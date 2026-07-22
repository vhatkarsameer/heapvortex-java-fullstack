package com.heapvortex.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoryTelemetryDTO {
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
