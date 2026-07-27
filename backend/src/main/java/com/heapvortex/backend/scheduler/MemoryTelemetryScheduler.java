package com.heapvortex.backend.scheduler;

import com.heapvortex.backend.jmx.MemoryTelemetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class MemoryTelemetryScheduler {

    private final MemoryTelemetryService memoryTelemetryService;

    @Scheduled(fixedRate = 1000)
    public void collectTelemetry() {
        try {
            memoryTelemetryService.getCurrentTelemetry();
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }
}
