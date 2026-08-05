package com.heapvortex.backend.controller;

import com.heapvortex.backend.dto.*;
import com.heapvortex.backend.jmx.JmxConnectionService;
import com.sun.management.HotSpotDiagnosticMXBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.management.MBeanServerConnection;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;
import java.io.File;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jvm")
@CrossOrigin(origins = "http://localhost") // Enables CORS for React frontend
public class JvmController {

    private JmxConnectionService jmxConnectionService;

    @Value("${RUNNING_IN_DOCKER:false}")
    private boolean isRunningInDocker;

    public JvmController(JmxConnectionService jmxConnectionService) {
        this.jmxConnectionService = jmxConnectionService;
    }


    @PostMapping("/trigger-remote-dump")
    public ResponseEntity<Map<String, Object>> triggerRemoteHeapDump(@RequestParam String host, @RequestParam int port) {

        // Notice we added '&& port != 9999' so it leaves the local JVM alone!
        if (isRunningInDocker && port != 9999 && ("localhost".equals(host) || "127.0.0.1".equals(host))) {
            host = "host.docker.internal";
        }

        Map<String, Object> response = new HashMap<>();
        try {
            String serviceUrl = String.format("service:jmx:rmi:///jndi/rmi://%s:%d/jmxrmi", host, port);
            JMXServiceURL url = new JMXServiceURL(serviceUrl);

            Map<String, Object> environment = new HashMap<>();
            javax.rmi.ssl.SslRMIClientSocketFactory csf = new javax.rmi.ssl.SslRMIClientSocketFactory();
            environment.put("com.sun.jndi.rmi.factory.socket", csf);

            try (JMXConnector jmxConnector = JMXConnectorFactory.connect(url, environment)) {
                MBeanServerConnection mbeanConn = jmxConnector.getMBeanServerConnection();
                HotSpotDiagnosticMXBean mxBean = ManagementFactory.newPlatformMXBeanProxy(
                        mbeanConn,
                        "com.sun.management:type=HotSpotDiagnostic",
                        HotSpotDiagnosticMXBean.class
                );

                String fileName = "remote_target_dump.hprof";

                // 1. THE DOCKER PATH: Where HeapVortex looks for the file inside the container
                Path dockerUploadDir = Paths.get("/app/uploads");
                if (!Files.exists(dockerUploadDir)) {
                    Files.createDirectories(dockerUploadDir);
                }
                File dockerFile = dockerUploadDir.resolve(fileName).toFile();
                if (dockerFile.exists()) {
                    dockerFile.delete(); // Delete old dump inside Docker
                }

                // 2. THE MAC PATH: The exact command sent to the Target JVM running on your Mac
                String macPath = "/Users/sameervhatkar/Study/Projects/HeapVortex/uploads/" + fileName;

                // Target JVM writes to the Mac drive (which instantly syncs to Docker via docker-compose volume)
                mxBean.dumpHeap(macPath, true);

                response.put("fileName", fileName);
                response.put("message", "Successfully generated remote dump!");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Failed to trigger remote dump: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Dumps the heap of the CURRENT running Spring Boot application itself.
     * No JMX network host/port needed!
     */
    @PostMapping("/dump-self")
    public ResponseEntity<Map<String, Object>> dumpSelfJvm() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 1. Get the local HotSpotDiagnosticMXBean directly from current JVM
            HotSpotDiagnosticMXBean mxBean = ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class);

            // 2. Ensure target uploads folder exists
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // 3. Create unique dump file name
            String fileName = "self_jvm_dump_" + System.currentTimeMillis() + ".hprof";
            File dumpFile = uploadDir.resolve(fileName).toFile();

            // Delete if already exists
            if (dumpFile.exists()) {
                dumpFile.delete();
            }

            // 4. Trigger local heap dump (liveObjectsOnly = true)
            mxBean.dumpHeap(dumpFile.getAbsolutePath(), true);

            response.put("fileName", fileName);
            response.put("message", "Successfully dumped local HeapVortex JVM!");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("error", "Failed to dump local JVM: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
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
