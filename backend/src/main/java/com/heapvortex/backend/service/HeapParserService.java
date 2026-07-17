package com.heapvortex.backend.service;

import com.heapvortex.backend.dto.HeapUploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class HeapParserService {

    public HeapUploadResponse heapUploadResponse(MultipartFile file) {
        return new HeapUploadResponse(file.getOriginalFilename(), file.getSize(), "Heap dump uploaded successfully");
    }

}
