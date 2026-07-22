package com.heapvortex.backend.controller;

import com.heapvortex.backend.dto.HeapUploadResponse;
import com.heapvortex.backend.service.HeapParserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/heap")
public class HeapController {

    private HeapParserService heapParserService;

    public HeapController(HeapParserService heapParserService) {
        this.heapParserService = heapParserService;
    }

    @PostMapping("/upload")
    public ResponseEntity<HeapUploadResponse> uploadHeapDump(@RequestParam("file") MultipartFile file) throws IOException {
        HeapUploadResponse response = heapParserService.uploadHeapDump(file);
        return ResponseEntity.ok(response);
    }
}
