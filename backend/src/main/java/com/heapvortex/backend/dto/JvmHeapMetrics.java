package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JvmHeapMetrics {
    private long heapUsed;
    private long heapCommited;
    private long heapMax;


}
