package com.heapvortex.backend.controller;

import com.heapvortex.backend.dto.JvmHeapMetrics;
import com.heapvortex.backend.jmx.JmxConnectionService;
import lombok.Getter;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/jvm")
public class JvmController {

    private JmxConnectionService jmxConnectionService;

    public JvmController(JmxConnectionService jmxConnectionService) {
        this.jmxConnectionService = jmxConnectionService;
    }

    @GetMapping("/heap")
    public JvmHeapMetrics getHeapMetrics() throws IOException {
        return jmxConnectionService.getHeapMetrics();
    }


}
