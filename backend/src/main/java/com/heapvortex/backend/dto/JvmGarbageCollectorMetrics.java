package com.heapvortex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JvmGarbageCollectorMetrics {

    private String gcName;
    private long collectionCount;
    private long collectionTime;


}
