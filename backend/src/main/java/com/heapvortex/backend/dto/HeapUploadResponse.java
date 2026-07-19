package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class HeapUploadResponse {
    private String fileName;
    private long fileSize;
    private long objectCount;
    private String message;


}
