package com.heapvortex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JvmRuntimeMetrics {
    private String jvmName;
    private long upTime;
    private long startTime;

}
