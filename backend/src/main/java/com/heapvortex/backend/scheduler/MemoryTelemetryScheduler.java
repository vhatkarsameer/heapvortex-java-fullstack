package com.heapvortex.backend.scheduler;

import com.heapvortex.backend.jmx.MemoryTelemetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class MemoryTelemetryScheduler {

    private final MemoryTelemetryService memoryTelemetryService;

    // We add a state flag to remember if we were connected recently
    private boolean wasConnected = true;

    @Scheduled(fixedRate = 1000)
    public void collectTelemetry() {
        try {
            memoryTelemetryService.getCurrentTelemetry();

            // If we just reconnected, log it once and flip the switch back
            if (!wasConnected) {
                log.info("Target JVM reconnected. Resuming telemetry polling.");
                wasConnected = true;
            }
        }
        catch (IOException e) {
            // Only log the error if we were PREVIOUSLY connected.
            // Once we flip 'wasConnected' to false, this block goes completely silent!
            if (wasConnected) {
                log.warn("Target JVM disconnected. Polling paused (waiting quietly for reconnect)...");
                wasConnected = false;
            }
        }
    }
}