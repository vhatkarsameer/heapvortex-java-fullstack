package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HeapUploadResponse {
    private String fileName;
    private long fileSize;
    private HeapStatistics heapStatistics;
    private String message;


}
