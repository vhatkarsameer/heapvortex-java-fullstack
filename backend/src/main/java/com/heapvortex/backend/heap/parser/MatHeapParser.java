package com.heapvortex.backend.heap.parser;

import com.heapvortex.backend.dto.ClassStatistics;
import com.heapvortex.backend.dto.HeapStatistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.Reader;

@Component
public class MatHeapParser implements HeapParser{

    private static final Logger logger = LoggerFactory.getLogger(MatHeapParser.class);

    @Override
    public HeapStatistics parse(Path heapDumpPath) throws IOException {

        ProcessBuilder processBuilder = new ProcessBuilder(
                "/Applications/MemoryAnalyzer.app/Contents/Eclipse/ParseHeapDump.sh",
                heapDumpPath.toAbsolutePath().toString()
        );

        Process process = processBuilder.start();

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        String line;
        long objectCount = 0;

        while ((line = reader.readLine()) != null) {


            if (line.contains("contains") && line.contains("objects")) {

                String count = line.replaceAll(
                        ".*contains\\s+([0-9,]+)\\s+objects.*",
                        "$1"
                );

                objectCount = Long.parseLong(count.replace(",", ""));

            }
        }

        try {
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("MAT exited with code " + exitCode);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("MAT execution interrupted", e);
        }


        ProcessBuilder histogramProcessBuilder = new ProcessBuilder(
                "/Applications/MemoryAnalyzer.app/Contents/Eclipse/ParseHeapDump.sh",
                heapDumpPath.toAbsolutePath().toString(),
                "-command=histogram",
                "-format=csv",
                "-unzip",
                "org.eclipse.mat.api:query"
        );

        histogramProcessBuilder.directory(heapDumpPath.getParent().toFile());

        Process histogramProcess = histogramProcessBuilder.start();

        BufferedReader histogramReader = new BufferedReader(
                new InputStreamReader(histogramProcess.getInputStream())
        );

        String histogramLine;

        while ((histogramLine = histogramReader.readLine()) != null) {
        }

        try {
            int histogramExitCode = histogramProcess.waitFor();
            logger.info("Histogram Exit Code : {}", histogramExitCode);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Histogram execution interrupted", e);
        }


        File pagesFolder = heapDumpPath.getParent()
                .resolve("heapdump_Query")
                .resolve("pages")
                .toFile();

        File[] csvFiles = pagesFolder.listFiles(file ->
                file.isFile() &&
                        file.getName().endsWith(".csv")
        );

        if (csvFiles == null || csvFiles.length == 0) {
            throw new RuntimeException("No CSV file found.");
        }


        try (
                Reader fileReader = new FileReader(csvFiles[0]);
                CSVParser csvParser = CSVFormat.DEFAULT
                        .builder()
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .build()
                        .parse(fileReader)
        ) {

            int classCount = 0;
            long totalShallowHeap = 0;

            List<ClassStatistics> classStatistics = new ArrayList<>();

            for (CSVRecord record : csvParser) {

                String className = record.get("Class Name").trim();

                long objects = Long.parseLong(
                        record.get("Objects").replace(",", "").trim()
                );

                long shallowHeap = Long.parseLong(
                        record.get("Shallow Heap").replace(",", "").trim()
                );

                classCount++;
                totalShallowHeap += shallowHeap;

                classStatistics.add(
                        new ClassStatistics(
                                className,
                                objects,
                                shallowHeap
                        )
                );
            }

            classStatistics.sort(
                    Comparator.comparingLong(ClassStatistics::getShallowHeap)
                            .reversed()
            );

            logger.info("Object Count : {}", objectCount);
            logger.info("Class Count : {}", classCount);
            logger.info("Total Shallow Heap : {}", totalShallowHeap);

            return new HeapStatistics(
                    objectCount,
                    classCount,
                    totalShallowHeap,
                    classStatistics
            );
        }
    }
}
