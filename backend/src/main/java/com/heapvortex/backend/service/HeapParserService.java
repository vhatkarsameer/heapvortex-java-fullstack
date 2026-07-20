package com.heapvortex.backend.service;

import com.heapvortex.backend.dto.HeapStatistics;
import com.heapvortex.backend.dto.HeapUploadResponse;
import com.heapvortex.backend.exception.InvalidHeapDumpException;
import com.heapvortex.backend.heap.parser.HeapParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class HeapParserService {

    private final HeapParser heapParser;
    private String uploadDirectory;

    public HeapParserService(HeapParser heapParser, @Value("${heap.upload.directory}") String uploadDirectory) {
        this.heapParser = heapParser;
        this.uploadDirectory = uploadDirectory;
    }

    private String validateHeapDump(MultipartFile file) {

        if (file.isEmpty()) {
            throw new InvalidHeapDumpException("Uploaded file is empty.");
        }

        String fileName = file.getOriginalFilename();

        if (fileName == null || fileName.isBlank()) {
            throw new InvalidHeapDumpException("Invalid file name.");
        }

        if (!fileName.toLowerCase().endsWith(".hprof")) {
            throw new InvalidHeapDumpException("Only .hprof files are supported.");
        }

        return fileName;
    }

    public HeapUploadResponse uploadHeapDump(MultipartFile file) throws IOException {

        String fileName = validateHeapDump(file);

        Path uploadPath = Paths.get(uploadDirectory);

        if(Files.notExists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path destination = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        HeapStatistics heapStatistics = heapParser.parse(destination);

        return new HeapUploadResponse(fileName, file.getSize(), objectCount, "Heap dump uploaded successfully");
    }

}
