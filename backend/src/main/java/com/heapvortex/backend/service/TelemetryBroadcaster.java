package com.heapvortex.backend.service;

import com.heapvortex.backend.dto.MemoryTelemetryDTO;
import com.heapvortex.backend.jmx.MemoryTelemetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class TelemetryBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;
    private final MemoryTelemetryService memoryTelemetryService;

    // Add the same state flag here
    private boolean wasConnected = true;

    @Scheduled(fixedRate = 2000)
    public void broadcastTelemetry() {
        try {
            MemoryTelemetryDTO dto = memoryTelemetryService.getCurrentTelemetry();
            messagingTemplate.convertAndSend("/topic/telemetry", dto);

            // Silently reset the state if it reconnects
            if (!wasConnected) {
                wasConnected = true;
            }
        } catch (IOException e) {
            // Only log the drop once!
            if (wasConnected) {
                log.warn("WebSocket broadcast paused: Target JVM is disconnected.");
                wasConnected = false;
            }
        }
    }
}