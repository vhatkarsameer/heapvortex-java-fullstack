package com.heapvortex.backend.heap.parser;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;

@Component
public class MatHeapParser implements HeapParser{

    private static final Logger logger = LoggerFactory.getLogger(MatHeapParser.class);

    @Override
    public long parse(Path heapDumpPath) throws IOException {

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

            logger.info("MAT Output : {}", line);

            if (line.contains("contains") && line.contains("objects")) {

                String count = line.replaceAll(
                        ".*contains\\s+([0-9,]+)\\s+objects.*",
                        "$1"
                );

                objectCount = Long.parseLong(count.replace(",", ""));

                logger.info("Object Count : {}", objectCount);
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

        Path reportDirectory = heapDumpPath.getParent().resolve("mat-report");

        ProcessBuilder histogramProcessBuilder = new ProcessBuilder(
                "/Applications/MemoryAnalyzer.app/Contents/Eclipse/ParseHeapDump.sh",
                heapDumpPath.toAbsolutePath().toString(),
                "-command=histogram",
                "-format=csv",
                "-output=" + reportDirectory.toAbsolutePath(),
                "org.eclipse.mat.api:query"
        );

        histogramProcessBuilder.directory(heapDumpPath.getParent().toFile());

        Process histogramProcess = histogramProcessBuilder.start();

        BufferedReader histogramReader = new BufferedReader(
                new InputStreamReader(histogramProcess.getInputStream())
        );

        String histogramLine;

        while ((histogramLine = histogramReader.readLine()) != null) {
            logger.info("Histogram: {}", histogramLine);
        }

        try {
            int histogramExitCode = histogramProcess.waitFor();
            logger.info("Histogram Exit Code : {}", histogramExitCode);
            logger.info("Current Working Directory: {}", System.getProperty("user.dir"));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Histogram execution interrupted", e);
        }

        return objectCount;
    }
}
