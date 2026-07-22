package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JvmMemoryPoolMetrics {
    private String poolName;
    private String type;
    private long used;
    private long committed;
    private long max;


}
