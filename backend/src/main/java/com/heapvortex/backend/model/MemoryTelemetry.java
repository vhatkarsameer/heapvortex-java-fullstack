package com.heapvortex.backend.model;

import lombok.*;

import java.time.LocalDateTime;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoryTelemetry {

    private LocalDateTime timestamp;

    private long heapUsed;
    private long heapCommitted;
    private long heapMax;

    private long nonHeapUsed;

    private int threadCount;
    private int peakThreadCount;
    private int daemonThreadCount;

    private long youngGcCount;
    private long youngGcTime;

    private long oldGcCount;
    private long oldGcTime;
}
