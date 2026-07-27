package com.heapvortex.backend.controller;

import com.heapvortex.backend.dto.HeapObject;
import com.heapvortex.backend.dto.HeapUploadResponse;
import com.heapvortex.backend.service.HeapParserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/heap")
public class HeapController {

    private HeapParserService heapParserService;

    public HeapController(HeapParserService heapParserService) {
        this.heapParserService = heapParserService;
    }

    @PostMapping("/upload")
    public ResponseEntity<HeapUploadResponse> uploadHeapDump(@RequestParam("file") MultipartFile file) throws Exception {
        HeapUploadResponse response = heapParserService.uploadHeapDump(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/incoming-references")
    public ResponseEntity<List<HeapObject>> getIncomingReferences(
            @RequestParam("fileName") String fileName,
            @RequestParam("address") String address) throws Exception {

        List<HeapObject> references = heapParserService.getIncomingReferences(fileName, address);
        return ResponseEntity.ok(references);
    }

    @GetMapping("/outgoing-references")
    public ResponseEntity<List<HeapObject>> getOutgoingReferences(
            @RequestParam("fileName") String fileName,
            @RequestParam("address") String address) throws Exception {

        List<HeapObject> references = heapParserService.getOutgoingReferences(fileName, address);
        return ResponseEntity.ok(references);
    }

    @GetMapping("/objects-by-class")
    public ResponseEntity<List<HeapObject>> getObjectsForClass(
            @RequestParam("fileName") String fileName,
            @RequestParam("className") String className) throws Exception {

        List<HeapObject> objects = heapParserService.getObjectsForClass(fileName, className);
        return ResponseEntity.ok(objects);
    }

    @GetMapping("/path-to-gc-roots")
    public ResponseEntity<List<HeapObject>> getPathToGcRoots(
            @RequestParam("fileName") String fileName,
            @RequestParam("address") String address) throws Exception {

        List<HeapObject> referenceChain = heapParserService.getPathToGcRoots(fileName, address);
        return ResponseEntity.ok(referenceChain);
    }
}
