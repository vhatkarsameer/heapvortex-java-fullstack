package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class JvmHeapMetrics {
    private long heapUsed;
    private long heapCommited;
    private long heapMax;
}
