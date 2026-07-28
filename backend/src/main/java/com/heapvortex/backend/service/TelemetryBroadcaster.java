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

    @Scheduled(fixedRate = 2000) // Pushes updates every 2 seconds
    public void broadcastTelemetry() {
        try {
            MemoryTelemetryDTO dto = memoryTelemetryService.getCurrentTelemetry();
            messagingTemplate.convertAndSend("/topic/telemetry", dto);
        } catch (IOException e) {
            log.error("Failed to collect and broadcast live telemetry", e);
        }
    }
}