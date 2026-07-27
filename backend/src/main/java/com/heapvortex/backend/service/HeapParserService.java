package com.heapvortex.backend.service;

import com.heapvortex.backend.dto.HeapObject;
import com.heapvortex.backend.dto.HeapStatistics;
import com.heapvortex.backend.dto.HeapUploadResponse;
import com.heapvortex.backend.exception.InvalidHeapDumpException;
import com.heapvortex.backend.heap_parser.HeapParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
public class HeapParserService {

    private final HeapParser heapParser;
    private final String uploadDirectory;

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

        HeapStatistics heapStatistics;
        try {
            // Call our newly refactored MAT parser
            heapStatistics = heapParser.parse(destination);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse heap dump using MAT API", e);
        }

        return new HeapUploadResponse(fileName, file.getSize(), heapStatistics, "Heap dump uploaded successfully");
    }

    public List<HeapObject> getIncomingReferences(String fileName, String address) throws Exception {
        // Resolve the path to the previously uploaded file
        Path heapDumpPath = Path.of(uploadDirectory, fileName);
        return heapParser.getIncomingReferences(heapDumpPath, address);
    }

    public List<HeapObject> getOutgoingReferences(String fileName, String address) throws Exception {
        Path heapDumpPath = Path.of(uploadDirectory, fileName);
        return heapParser.getOutgoingReferences(heapDumpPath, address);
    }

    public List<HeapObject> getObjectsForClass(String fileName, String className) throws Exception {
        Path heapDumpPath = Path.of(uploadDirectory, fileName);
        return heapParser.getObjectsForClass(heapDumpPath, className);
    }

    public List<HeapObject> getPathToGcRoots(String fileName, String address) throws Exception {
        Path heapDumpPath = Path.of(uploadDirectory, fileName);
        return heapParser.getPathToGcRoots(heapDumpPath, address);
    }

}
