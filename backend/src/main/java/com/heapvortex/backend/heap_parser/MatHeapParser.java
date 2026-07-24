package com.heapvortex.backend.heap_parser;

import com.heapvortex.backend.dto.ClassStatistics;
import com.heapvortex.backend.dto.HeapObject;
import com.heapvortex.backend.dto.HeapStatistics;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

@Component
public class MatHeapParser implements HeapParser {

    private final String matCommand;

    public MatHeapParser(@Value("${mat.command}") String matCommand) {
        this.matCommand = matCommand;
    }

    @Override
    public HeapStatistics parse(Path heapDumpPath) throws IOException {
        runHistogramReport(heapDumpPath);

        Path csvReport = findLatestHistogramCsv(heapDumpPath);
        List<ClassStatistics> classStatistics = readClassStatistics(csvReport);

        long objectCount = classStatistics.stream()
                .mapToLong(ClassStatistics::getObjectCount)
                .sum();

        long totalShallowHeap = classStatistics.stream()
                .mapToLong(ClassStatistics::getShallowHeap)
                .sum();

        return new HeapStatistics(
                objectCount,
                classStatistics.size(),
                totalShallowHeap,
                classStatistics
        );
    }

    // =================================================================================
    // CORE CLI EXECUTION & PARSING LOGIC
    // =================================================================================

    private Path executeOql(Path heapDumpPath, String oqlQuery) throws IOException {
        System.out.println("Executing OQL = " + oqlQuery);

        // Deep search reveals MAT requires the entire query string in quotes,
        // and internal quotes MUST be explicitly escaped for its OSGi parser.
        String escapedOql = oqlQuery.replace("\"", "\\\"");
        String commandArg = "-command=oql \"" + escapedOql + "\"";

        ProcessBuilder processBuilder = new ProcessBuilder(
                matCommand,
                heapDumpPath.toAbsolutePath().toString(),
                commandArg,
                "-format=csv",
                "-unzip",
                "org.eclipse.mat.api:query"
        );

        processBuilder.directory(heapDumpPath.getParent().toFile());
        processBuilder.redirectErrorStream(true); // Captures both error and standard output
        Process process = processBuilder.start();
        StringBuilder output = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }

        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("MAT OQL execution failed with exit code " + exitCode + ":\n" + output);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("MAT OQL execution interrupted", e);
        }

        // Pass MAT's raw terminal output into our search method
        return findLatestQueryCsv(heapDumpPath, output.toString());
    }

    private Path findLatestQueryCsv(Path heapDumpPath, String matOutput) throws IOException {
        try (Stream<Path> paths = Files.walk(heapDumpPath.getParent(), 3)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".csv"))
                    .filter(path -> !path.getFileName().toString().contains("Histogram")) // Explicitly exclude histogram
                    .filter(this::isOqlCsv)
                    .max(Comparator.comparing(this::lastModifiedTime))
                    // If it fails, dump the entire MAT terminal output directly to Postman
                    .orElseThrow(() -> new IOException("MAT did not produce an OQL query CSV report.\n\n--- MAT CONSOLE OUTPUT ---\n" + matOutput));
        }
    }

    private boolean isOqlCsv(Path path) {
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String firstLine = reader.readLine();
            if (firstLine == null) return false;

            String lower = firstLine.toLowerCase();
            // Object list CSVs have "Shallow Heap" but do NOT have the "Objects" count column
            return lower.contains("shallow") && !lower.contains("objects");
        } catch (IOException e) {
            return false;
        }
    }

    public List<HeapObject> readHeapObjects(Path csvReport) throws IOException {
        try (
                Reader fileReader = Files.newBufferedReader(csvReport, StandardCharsets.UTF_8);
                CSVParser csvParser = CSVFormat.DEFAULT.builder().get().parse(fileReader)
        ) {
            Iterator<CSVRecord> iterator = csvParser.iterator();

            if (iterator.hasNext()) {
                iterator.next(); // Skip the header row
            }

            List<HeapObject> result = new ArrayList<>();
            while (iterator.hasNext()) {
                result.add(toHeapObject(iterator.next()));
            }
            return result;
        }
    }

    private HeapObject toHeapObject(CSVRecord record) {
        // MAT outputs Object info in column 0
        String objectInfo = record.size() > 0 ? record.get(0).trim() : "";
        String className = objectInfo;
        String address = "";

        int index = objectInfo.indexOf('@');
        if (index != -1) {
            className = objectInfo.substring(0, index).trim();
            address = objectInfo.substring(index + 1).trim().split(" ")[0];
        }

        // Safely parse Shallow (Column 1) and Retained (Column 2) if they exist
        long shallow = record.size() > 1 ? parseNumber(record.get(1)) : 0;
        long retained = record.size() > 2 ? parseNumber(record.get(2)) : 0;

        return new HeapObject(
                className,
                address,
                shallow,
                retained
        );
    }


    private void runHistogramReport(Path heapDumpPath) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder(
                matCommand,
                heapDumpPath.toAbsolutePath().toString(),
                "-command=histogram",
                "-format=csv",
                "-unzip",
                "org.eclipse.mat.api:query"
        );
        processBuilder.directory(heapDumpPath.getParent().toFile());
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        StringBuilder output = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }

        try {
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new IOException("MAT histogram generation failed: " + output.toString());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("MAT histogram generation was interrupted", e);
        }
    }

    private Path findLatestHistogramCsv(Path heapDumpPath) throws IOException {
        // Changed "_Histogram" back to "_Query" to match MAT's output directory
        String reportPrefix = removeExtension(heapDumpPath.getFileName().toString()) + "_Query";

        try (Stream<Path> paths = Files.walk(heapDumpPath.getParent(), 3)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".csv"))
                    .filter(path -> belongsToMatReport(path, reportPrefix))
                    .max(Comparator.comparing(this::lastModifiedTime))
                    .orElseThrow(() -> new IOException("MAT did not produce a histogram CSV report"));
        }
    }

    private boolean belongsToMatReport(Path csvPath, String reportPrefix) {
        Path reportDirectory = csvPath.getParent() == null ? null : csvPath.getParent().getParent();
        return reportDirectory != null && reportDirectory.getFileName().toString().startsWith(reportPrefix);
    }

    private long lastModifiedTime(Path path) {
        try {
            return Files.getLastModifiedTime(path).toMillis();
        } catch (IOException e) {
            return Long.MIN_VALUE;
        }
    }

    private List<ClassStatistics> readClassStatistics(Path csvReport) throws IOException {
        try (
                Reader fileReader = Files.newBufferedReader(csvReport, StandardCharsets.UTF_8);
                CSVParser csvParser = CSVFormat.DEFAULT.builder()
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .setAllowMissingColumnNames(true)
                        .get()
                        .parse(fileReader)
        ) {
            return csvParser.stream()
                    .map(this::toClassStatistics)
                    .sorted(Comparator.comparingLong(ClassStatistics::getShallowHeap).reversed())
                    .toList();
        }
    }

    private ClassStatistics toClassStatistics(CSVRecord record) {
        return new ClassStatistics(
                record.get("Class Name").trim(),
                parseNumber(record.get("Objects")),
                parseNumber(record.get("Shallow Heap"))
        );
    }

    private long parseNumber(String value) {
        if (value == null || value.isBlank()) return 0;
        return Long.parseLong(value.replace(",", "").trim());
    }

    private String removeExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        return extensionIndex < 0 ? fileName : fileName.substring(0, extensionIndex);
    }

    @Override
    public List<HeapObject> getObjectsForClass(Path heapDumpPath, String className) throws IOException {
        // Changed to standard SELECT * so MAT can natively export it to CSV
        String oqlQuery = "SELECT * FROM \"" + className + "\"";
        Path csvReport = executeOql(heapDumpPath, oqlQuery);
        return readHeapObjects(csvReport);
    }

    @Override
    public List<HeapObject> getIncomingReferences(Path heapDumpPath, String address) throws IOException {
        String oqlQuery = "SELECT OBJECTS inbounds(s) FROM OBJECTS (" + address + ") s";
        Path csvReport = executeOql(heapDumpPath, oqlQuery);
        return readHeapObjects(csvReport);
    }

    @Override
    public List<HeapObject> getOutgoingReferences(Path heapDumpPath, String address) throws IOException {
        String oqlQuery = "SELECT OBJECTS outbounds(s) FROM OBJECTS (" + address + ") s";
        Path csvReport = executeOql(heapDumpPath, oqlQuery);
        return readHeapObjects(csvReport);
    }

    @Override
    public List<HeapObject> getPathToGcRoots(Path heapDumpPath, String address) throws IOException {
        List<HeapObject> chain = new ArrayList<>();
        Set<String> visited = new HashSet<>();

        String currentAddress = address;

        // Iterative DFS / Backtracking up the reference tree toward the GC Root
        while (currentAddress != null && !currentAddress.isBlank()) {
            if (!visited.add(currentAddress)) {
                break; // Prevent infinite loops from circular references
            }

            // Get incoming references (parents) for the current address using our working OQL engine
            String oqlQuery = "SELECT OBJECTS inbounds(s) FROM OBJECTS " + currentAddress + " s";
            Path csvReport = executeOql(heapDumpPath, oqlQuery);
            List<HeapObject> parents = readHeapObjects(csvReport);

            if (parents == null || parents.isEmpty()) {
                break; // Reached the top (GC Root has no incoming references)
            }

            // Pick the primary parent to continue tracing the chain upward
            HeapObject parent = parents.get(0);
            chain.add(parent);

            // Move up to the parent's address for the next iteration
            currentAddress = parent.getAddress();
        }

        return chain;
    }
}