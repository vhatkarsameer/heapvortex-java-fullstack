package com.heapvortex.backend.controller;

import com.heapvortex.backend.dto.*;
import com.heapvortex.backend.jmx.JmxConnectionService;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/jvm")
public class JvmController {

    private JmxConnectionService jmxConnectionService;

    public JvmController(JmxConnectionService jmxConnectionService) {
        this.jmxConnectionService = jmxConnectionService;
    }

    @PostMapping("/connect")
    public String connect(@RequestBody JmxConnectionRequest request) throws IOException {

        jmxConnectionService.connect(request.getHost(), request.getPort());

        return "Connected Successfully";
    }

    @GetMapping("/heap")
    public JvmHeapMetrics getHeapMetrics() throws IOException {
        return jmxConnectionService.getHeapMetrics();
    }

    @GetMapping("/runtime")
    public JvmRuntimeMetrics getRunTimeMetrics() throws IOException {
        return jmxConnectionService.getRuntimeMetrics();
    }

    @GetMapping("/thread")
    public JvmThreadMetrics getThreadMetrics() throws IOException {
        return jmxConnectionService.getThreadMetrics();
    }

    @GetMapping("/os")
    public JvmOperatingSystemMetrics getOperatingSystemMetrics() throws IOException {
        return jmxConnectionService.getOSMetrics();
    }

    @GetMapping("/classloading")
    public JvmClassLoadingMetrics getClassLoadingMetrics() throws IOException {
        return jmxConnectionService.getClassLoadingMetrics();
    }

    @GetMapping("/gc")
    public List<JvmGarbageCollectorMetrics> getGarbageCollectorMetrics() throws IOException {
        return jmxConnectionService.getGCMetrics();
    }

    @GetMapping("/memory-pools")
    public List<JvmMemoryPoolMetrics> getMemoryPoolMetrics() throws IOException {
        return jmxConnectionService.getMemoryPoolMetrics();
    }





}
