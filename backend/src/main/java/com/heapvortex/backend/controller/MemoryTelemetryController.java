package com.heapvortex.backend.controller;

import com.heapvortex.backend.dto.MemoryTelemetryDTO;
import com.heapvortex.backend.jmx.MemoryTelemetryService;
import com.heapvortex.backend.model.MemoryTelemetry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
public class MemoryTelemetryController {

    private final MemoryTelemetryService memoryTelemetryService;

    @GetMapping("/current")
    private ResponseEntity<MemoryTelemetryDTO> getCurrentTelemetry() throws IOException {
        MemoryTelemetryDTO telemetryDTO = memoryTelemetryService.getCurrentTelemetry();
        return ResponseEntity.ok(telemetryDTO);
    }

    @GetMapping("/history")
    public ResponseEntity<List<MemoryTelemetry>> getTelemetryHistory() {
        return ResponseEntity.ok(memoryTelemetryService.getTelemetryHistory());
    }
}
