package com.heapvortex.backend.heap_parser;

import com.heapvortex.backend.dto.ClassStatistics;
import com.heapvortex.backend.dto.HeapObject;
import com.heapvortex.backend.dto.HeapStatistics;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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

        ProcessBuilder processBuilder = new ProcessBuilder(
                matCommand,
                heapDumpPath.toAbsolutePath().toString(),
                "-command=oql " + oqlQuery, // Back to your original correct syntax
                "-format=csv",                        // Back to your original correct syntax
                "-unzip",
                "-limit=25000",
                "org.eclipse.mat.api:query"           // MUST BE THE LAST ARGUMENT
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


        if(realObjects.size() > 15000)
            return realObjects.subList(0, 15000);

        return realObjects;

        // ==============================================================================
        // AUDIT SCALER ENGINE: Scales the MAT 500-limit up to 10,000 mathematically accurate objects
        // ==============================================================================
//        int TARGET_COUNT = 10000;
//        if (realObjects.isEmpty()) return realObjects;
//        if (realObjects.size() >= TARGET_COUNT) return realObjects.subList(0, TARGET_COUNT);
//
//        List<HeapObject> finalObjects = new ArrayList<>(TARGET_COUNT);
//        finalObjects.addAll(realObjects);
//
//        int needed = TARGET_COUNT - realObjects.size();
//        Random rand = new Random(42); // Deterministic seed stops UI flickering
//
//        // Base memory address off the first real object
//        long currentAddress;
//        try {
//            currentAddress = Long.parseLong(realObjects.get(0).getAddress().replace("0x", ""), 16);
//        } catch (Exception e) {
//            currentAddress = 0x700000000L; // Safe JVM heap fallback
//        }
//
//        for (int i = 0; i < needed; i++) {
//            HeapObject source = realObjects.get(i % realObjects.size());
//
//            // Advance memory pointer sequentially like a real JVM heap allocator
//            long size = source.getShallowHeap() > 0 ? source.getShallowHeap() : 24;
//            currentAddress += size;
//
//            // Add slight organic variance to size for WebGL visual density
//            long newShallow = source.getShallowHeap() + (rand.nextBoolean() ? rand.nextInt(16) : 0);
//
//            finalObjects.add(new HeapObject(
//                    source.getClassName(),
//                    "0x" + Long.toHexString(currentAddress),
//                    newShallow,
//                    source.getRetainedHeap()
//            ));
//        }
//        return finalObjects;
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
                "-command=histogram",       // Back to your original correct syntax
                "-format=csv",              // Back to your original correct syntax
                "-unzip",
                "-limit=25000",
                "org.eclipse.mat.api:query" // MUST BE THE LAST ARGUMENT
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
        Path uploadDir = heapDumpPath.getParent();
        System.out.println("[MAT DEBUG] Searching for CSV recursively in: " + uploadDir);

        // This will hunt down the CSV no matter how deep MAT buries it in the subfolders
        try (Stream<Path> stream = Files.walk(uploadDir)) {
            Path csvPath = stream
                    .filter(p -> p.toString().endsWith(".csv"))
                    .max(Comparator.comparingLong(p -> p.toFile().lastModified()))
                    .orElse(null);

            if (csvPath == null) {
                System.err.println("[MAT ERROR] No CSV found! MAT process failed to generate it.");
                throw new FileNotFoundException("MAT successfully ran, but no CSV was found in the output directories!");
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
        return readHeapObjects(executeOql(heapDumpPath, "SELECT * FROM \"" + escaped + "\""));
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
                        // Compare by Retained Heap first. If not available, fall back to Shallow Heap.
                        long size1 = p1.getRetainedHeap() > 0 ? p1.getRetainedHeap() : p1.getShallowHeap();
                        long size2 = p2.getRetainedHeap() > 0 ? p2.getRetainedHeap() : p2.getShallowHeap();
                        return Long.compare(size1, size2);
                    })
                    .orElse(parents.get(0)); // Safe fallback

            // Add the heaviest parent to the chain and move up the tree
            chain.add(heaviestParent);
            currentAddress = heaviestParent.getAddress();
        }

        return chain;
    }
}