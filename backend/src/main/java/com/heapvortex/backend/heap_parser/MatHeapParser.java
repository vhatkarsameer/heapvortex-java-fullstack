package com.heapvortex.backend.heap_parser;

import com.heapvortex.backend.dto.ClassStatistics;
import com.heapvortex.backend.dto.HeapObject;
import com.heapvortex.backend.dto.HeapStatistics;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
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

        long objectCount = classStatistics.stream().mapToLong(ClassStatistics::getObjectCount).sum();
        long totalShallowHeap = classStatistics.stream().mapToLong(ClassStatistics::getShallowHeap).sum();

        return new HeapStatistics(objectCount, classStatistics.size(), totalShallowHeap, classStatistics);
    }

    private Path executeOql(Path heapDumpPath, String oqlQuery) throws IOException {
        System.out.println("[MAT DEBUG] Executing OQL: " + oqlQuery);

        // --- BULLETPROOF FIX 1: DELETE STALE RESULTS ---
        // This guarantees we NEVER reuse an old CSV if the query fails!
        Path queryDir = heapDumpPath.getParent().resolve(removeExtension(heapDumpPath.getFileName().toString()) + "_Query");
        if (Files.exists(queryDir)) {
            try (Stream<Path> walk = Files.walk(queryDir)) {
                walk.sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
        }

        ProcessBuilder processBuilder = new ProcessBuilder(
                matCommand,
                heapDumpPath.toAbsolutePath().toString(),
                "-command=oql \"" + oqlQuery + "\"", // Wrapped in quotes so MAT CLI parser doesn't break
                "-format=csv",
                "-unzip",
                "-limit=25000",
                "org.eclipse.mat.api:query"
        );

        processBuilder.directory(heapDumpPath.getParent().toFile());
        processBuilder.inheritIO();

        Process process = processBuilder.start();
        try {
            int exitCode = process.waitFor();
            System.out.println("[MAT DEBUG] OQL Process finished with exit code: " + exitCode);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return findLatestQueryCsv(heapDumpPath);
    }

    public List<HeapObject> readHeapObjects(Path csvReport) throws IOException {
        List<HeapObject> realObjects = new ArrayList<>();
        try (
                Reader fileReader = Files.newBufferedReader(csvReport, StandardCharsets.UTF_8);
                CSVParser csvParser = CSVFormat.DEFAULT.builder().get().parse(fileReader)
        ) {
            Iterator<CSVRecord> iterator = csvParser.iterator();
            if (iterator.hasNext())
                iterator.next(); // Skip header
            while (iterator.hasNext())
                realObjects.add(toHeapObject(iterator.next()));
        }

        // --- THE MISSING SORTING LOGIC ---
        // Sort by Retained Heap (or Shallow Heap if Retained is 0) in DESCENDING order
        realObjects.sort((obj1, obj2) -> {
            long size1 = obj1.getRetainedHeap() > 0 ? obj1.getRetainedHeap() : obj1.getShallowHeap();
            long size2 = obj2.getRetainedHeap() > 0 ? obj2.getRetainedHeap() : obj2.getShallowHeap();
            return Long.compare(size2, size1); // (size2, size1) forces descending order
        });
        // ---------------------------------

        // Now that the heaviest objects are at the top, it is safe to truncate!
        if(realObjects.size() > 15000)
            return realObjects.subList(0, 15000);

        return realObjects;
    }

    private HeapObject toHeapObject(CSVRecord record) {
        String objectInfo = record.size() > 0 ? record.get(0).trim() : "";
        String className = objectInfo;
        String address = "";
        int index = objectInfo.indexOf('@');
        if (index != -1) {
            className = objectInfo.substring(0, index).trim();
            address = objectInfo.substring(index + 1).trim().split(" ")[0];
        }
        long shallow = record.size() > 1 ? parseNumber(record.get(1)) : 0;
        long retained = record.size() > 2 ? parseNumber(record.get(2)) : 0;
        return new HeapObject(className, address, shallow, retained);
    }

    private void runHistogramReport(Path heapDumpPath) throws IOException {
        System.out.println("[MAT DEBUG] Starting Histogram report...");

        ProcessBuilder processBuilder = new ProcessBuilder(
                matCommand,
                heapDumpPath.toAbsolutePath().toString(),
                "-command=histogram",
                "-format=csv",
                "-unzip",
                "-limit=25000",
                "org.eclipse.mat.api:query"
        );

        processBuilder.directory(heapDumpPath.getParent().toFile());
        processBuilder.inheritIO();

        Process process = processBuilder.start();
        try {
            int exitCode = process.waitFor();
            System.out.println("[MAT DEBUG] Histogram Process finished with exit code: " + exitCode);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private Path findLatestQueryCsv(Path heapDumpPath) throws IOException {
        // --- BULLETPROOF FIX 2: STRICT SCOPED SEARCH ---
        // Only look inside the newly generated query folder. Never search the root!
        Path queryDir = heapDumpPath.getParent().resolve(removeExtension(heapDumpPath.getFileName().toString()) + "_Query");
        System.out.println("[MAT DEBUG] Searching for CSV recursively in: " + queryDir);

        if (!Files.exists(queryDir)) {
            throw new FileNotFoundException("[MAT ERROR] OQL crashed. The query directory was not generated.");
        }

        try (Stream<Path> stream = Files.walk(queryDir)) {
            Path csvPath = stream
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".csv"))
                    .max(Comparator.comparingLong(p -> p.toFile().lastModified()))
                    .orElse(null);

            if (csvPath == null) {
                throw new FileNotFoundException("[MAT ERROR] MAT successfully ran, but no CSV was found in the output directories!");
            }

            System.out.println("[MAT DEBUG] Successfully found CSV: " + csvPath);
            return csvPath;
        }
    }

    private Path findLatestHistogramCsv(Path heapDumpPath) throws IOException {
        try (Stream<Path> paths = Files.walk(heapDumpPath.getParent(), 5)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".csv"))
                    .filter(path -> path.toString().contains(removeExtension(heapDumpPath.getFileName().toString()) + "_Query"))
                    .max(Comparator.comparing(this::lastModifiedTime))
                    .orElseThrow(() -> new IOException("MAT did not produce a histogram"));
        }
    }

    private long lastModifiedTime(Path path) {
        try { return Files.getLastModifiedTime(path).toMillis(); } catch (IOException e) { return Long.MIN_VALUE; }
    }

    private List<ClassStatistics> readClassStatistics(Path csvReport) throws IOException {
        try (
                Reader fileReader = Files.newBufferedReader(csvReport, StandardCharsets.UTF_8);
                CSVParser csvParser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setAllowMissingColumnNames(true).get().parse(fileReader)
        ) {
            return csvParser.stream().map(this::toClassStatistics).sorted(Comparator.comparingLong(ClassStatistics::getShallowHeap).reversed()).toList();
        }
    }

    private ClassStatistics toClassStatistics(CSVRecord record) {
        return new ClassStatistics(record.get("Class Name").trim(), parseNumber(record.get("Objects")), parseNumber(record.get("Shallow Heap")));
    }

    private long parseNumber(String value) {
        if (value == null || value.isBlank()) return 0;
        return Long.parseLong(value.replace(",", "").trim());
    }

    private String removeExtension(String fileName) {
        int extIndex = fileName.lastIndexOf('.');
        return extIndex < 0 ? fileName : fileName.substring(0, extIndex);
    }

    @Override
    public List<HeapObject> getObjectsForClass(Path heapDumpPath, String className) throws IOException {
        String escaped = className.replace("[", "\\[").replace("]", "\\]");

        // --- BULLETPROOF FIX 3: ESCAPE INNER QUOTES WITH BACKSLASHES ---
        // This ensures the quotes survive ProcessBuilder and arrive safely inside MAT
        String query = "SELECT * FROM \\\"" + escaped + "\\\"";
        return readHeapObjects(executeOql(heapDumpPath, query));
    }

    @Override
    public List<HeapObject> getIncomingReferences(Path heapDumpPath, String address) throws IOException {
        return readHeapObjects(executeOql(heapDumpPath, "SELECT OBJECTS inbounds(s) FROM OBJECTS (" + address + ") s"));
    }

    @Override
    public List<HeapObject> getOutgoingReferences(Path heapDumpPath, String address) throws IOException {
        return readHeapObjects(executeOql(heapDumpPath, "SELECT OBJECTS outbounds(s) FROM OBJECTS (" + address + ") s"));
    }

    @Override
    public List<HeapObject> getPathToGcRoots(Path heapDumpPath, String address) throws IOException {
        List<HeapObject> chain = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        String currentAddress = address;

        while (currentAddress != null && !currentAddress.isBlank()) {
            if (!visited.add(currentAddress))
                break;

            List<HeapObject> parents = readHeapObjects(executeOql(heapDumpPath,
                    "SELECT OBJECTS inbounds(s) FROM OBJECTS " + currentAddress + " s"));

            if (parents == null || parents.isEmpty()) {
                break;
            }

            HeapObject heaviestParent = parents.stream()
                    .max((p1, p2) -> {
                        long size1 = p1.getRetainedHeap() > 0 ? p1.getRetainedHeap() : p1.getShallowHeap();
                        long size2 = p2.getRetainedHeap() > 0 ? p2.getRetainedHeap() : p2.getShallowHeap();
                        return Long.compare(size1, size2);
                    })
                    .orElse(parents.get(0));

            chain.add(heaviestParent);
            currentAddress = heaviestParent.getAddress();
        }

        return chain;
    }
}