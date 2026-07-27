package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JvmThreadMetrics {

    private int threadCount;
    private int peakThreadCount;
    private int daemonThreadCount;
}
