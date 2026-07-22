package com.heapvortex.backend.heap.parser;

import com.heapvortex.backend.dto.ClassStatistics;
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
import java.util.Comparator;
import java.util.List;
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

    private Path executeOql(Path heapDumpPath, String oqlQuery) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder(
                matCommand,
                heapDumpPath.toAbsolutePath().toString(),
                "-command=oql \"" + oqlQuery + "\"",
                "-format=csv",
                "-unzip",
                "org.eclipse.mat.api:query"
        );

        processBuilder.directory(heapDumpPath.getParent().toFile());
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }

        try {
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new IOException("MAT OQL execution failed:\n" + output);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("MAT OQL execution interrupted", e);
        }

        return findLatestQueryCsv(heapDumpPath);
    }

    private Path findLatestQueryCsv(Path heapDumpPath) throws IOException {

        String reportPrefix = removeExtension(heapDumpPath.getFileName().toString()) + "_Query";

        try (Stream<Path> paths = Files.walk(heapDumpPath.getParent(), 3)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".csv"))
                    .filter(path -> belongsToMatReport(path, reportPrefix))
                    .max(Comparator.comparing(this::lastModifiedTime))
                    .orElseThrow(() -> new IOException("MAT did not produce a query CSV report"));
        }
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

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {

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
        return reportDirectory != null
                && reportDirectory.getFileName().toString().startsWith(reportPrefix);
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
        return Long.parseLong(value.replace(",", "").trim());
    }

    private String removeExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        return extensionIndex < 0 ? fileName : fileName.substring(0, extensionIndex);
    }
}
