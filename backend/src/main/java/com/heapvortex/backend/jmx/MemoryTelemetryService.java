package com.heapvortex.backend.jmx;

import com.heapvortex.backend.dto.JvmGarbageCollectorMetrics;
import com.heapvortex.backend.dto.JvmHeapMetrics;
import com.heapvortex.backend.dto.JvmThreadMetrics;
import com.heapvortex.backend.dto.MemoryTelemetryDTO;
import com.heapvortex.backend.model.MemoryTelemetry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class MemoryTelemetryService {

    private final JmxConnectionService jmxConnectionService;
    private final List<MemoryTelemetry> history = new CopyOnWriteArrayList<>();

    public MemoryTelemetryDTO getCurrentTelemetry() throws IOException {

        LocalDateTime timestamp = LocalDateTime.now();

        JvmHeapMetrics heap = jmxConnectionService.getHeapMetrics();
        JvmHeapMetrics nonHeap = jmxConnectionService.getNonHeapMetrics();
        JvmThreadMetrics thread = jmxConnectionService.getThreadMetrics();
        List<JvmGarbageCollectorMetrics> gc = jmxConnectionService.getGCMetrics();

        MemoryTelemetryDTO dto = new MemoryTelemetryDTO();

        dto.setHeapUsed(heap.getHeapUsed());
        dto.setNonHeapUsed(nonHeap.getHeapUsed());
        dto.setHeapCommitted(heap.getHeapCommited());
        dto.setHeapMax(heap.getHeapMax());

        dto.setThreadCount(thread.getThreadCount());
        dto.setPeakThreadCount(thread.getPeakThreadCount());
        dto.setDaemonThreadCount(thread.getDaemonThreadCount());

        long youngGcCount = 0;
        long youngGcTime = 0;
        long oldGcCount = 0;
        long oldGcTime = 0;

        for(JvmGarbageCollectorMetrics collectorMetrics : gc) {
            String gcName = collectorMetrics.getGcName();

            if(gcName.contains("young") || gcName.contains("scavenge")) {
                youngGcCount = collectorMetrics.getCollectionCount();
                youngGcTime = collectorMetrics.getCollectionTime();
            }
            else {
                oldGcCount = collectorMetrics.getCollectionCount();
                oldGcTime = collectorMetrics.getCollectionTime();
            }
        }

        dto.setYoungGcCount(youngGcCount);
        dto.setYoungGcTime(youngGcTime);

        dto.setOldGcCount(oldGcCount);
        dto.setOldGcTime(oldGcTime);
        dto.setTimestamp(timestamp);

        MemoryTelemetry telemetry = MemoryTelemetry.builder()
                .timestamp(dto.getTimestamp())
                .heapUsed(dto.getHeapUsed())
                .heapCommitted(dto.getHeapCommitted())
                .heapMax(dto.getHeapMax())
                .nonHeapUsed(dto.getNonHeapUsed())
                .threadCount(dto.getThreadCount())
                .peakThreadCount(dto.getPeakThreadCount())
                .daemonThreadCount(dto.getDaemonThreadCount())
                .youngGcCount(dto.getYoungGcCount())
                .youngGcTime(dto.getYoungGcTime())
                .oldGcCount(dto.getOldGcCount())
                .oldGcTime(dto.getOldGcTime())
                .build();

        history.add(telemetry);

        return dto;
    }

    public List<MemoryTelemetry> getTelemetryHistory() {
        return history;
    }

}
