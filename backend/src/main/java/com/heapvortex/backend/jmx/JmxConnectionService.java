package com.heapvortex.backend.jmx;

import com.heapvortex.backend.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.management.MBeanServerConnection;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;
import javax.rmi.ssl.SslRMIClientSocketFactory;

import java.io.IOException;
import java.lang.management.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class JmxConnectionService {

    private JMXServiceURL jmxServiceURL;
    private JMXConnector connector;
    private MBeanServerConnection mBeanServerConnection;

    @Value("${jmx.host}")
    private String host;

    @Value("${jmx.port}")
    private int port;

    @Value("${RUNNING_IN_DOCKER:false}")
    private boolean isRunningInDocker;

    // We add stateful logging so we don't spam the terminal when it drops
    private boolean wasConnected = true;

    private void ensureConnection() throws IOException {
        if(!isConnectionAlive())
            connect(host, port);
    }

    private boolean isConnectionAlive() {
        try {
            return mBeanServerConnection != null && mBeanServerConnection.getMBeanCount() != null;
        }
        catch (IOException e) {
            return false;
        }
    }

    public void connect(String host, int port) throws IOException {
        // --- SMART INTERCEPTOR ---
        if (isRunningInDocker && port != 9999 && ("localhost".equals(host) || "127.0.0.1".equals(host))) {
            host = "host.docker.internal";
        }

        if (connector != null) {
            try { connector.close(); } catch (Exception e) {}
            connector = null;
            mBeanServerConnection = null;
        }

        try {
            String url = "service:jmx:rmi:///jndi/rmi://" + host + ":" + port + "/jmxrmi";
            jmxServiceURL = new JMXServiceURL(url);

            // --- CONDITIONAL SSL FIX ---
            Map<String, Object> environment = null;

            // Only attach SSL if we are connecting OUTSIDE to the secure Target JVM
            if (port != 9999) {
                environment = new HashMap<>();
                javax.rmi.ssl.SslRMIClientSocketFactory csf = new javax.rmi.ssl.SslRMIClientSocketFactory();
                environment.put("com.sun.jndi.rmi.factory.socket", csf);
            }

            // If port is 9999, environment is null (plain text). If 9010, it uses SSL.
            connector = JMXConnectorFactory.connect(jmxServiceURL, environment);
            mBeanServerConnection = connector.getMBeanServerConnection();

            this.host = host;
            this.port = port;

            log.info("Successfully connected to Target JVM at {}", url);
            wasConnected = true;

        } catch (IOException e) {
            if (wasConnected) {
                log.warn("Target JVM is disconnected. Waiting for it to boot...");
                wasConnected = false;
            }
            throw e;
        }
    }

    // Helper method to gracefully close it manually
    public void disconnect() {
        if (connector != null) {
            try {
                connector.close();
                log.info("JMX Connection closed.");
            } catch (IOException e) {
                log.error("Error closing JMX connection", e);
            } finally {
                connector = null;
                mBeanServerConnection = null;
                wasConnected = false;
            }
        }
    }


    // ==========================================
    // YOUR ORIGINAL METRIC METHODS (UNCHANGED)
    // ==========================================

    public JvmHeapMetrics getHeapMetrics() throws IOException {
        ensureConnection();
        MemoryMXBean memoryMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.MEMORY_MXBEAN_NAME, MemoryMXBean.class);
        MemoryUsage memoryUsage = memoryMXBean.getHeapMemoryUsage();
        return new JvmHeapMetrics(memoryUsage.getUsed(), memoryUsage.getCommitted(), memoryUsage.getMax());
    }

    public JvmHeapMetrics getNonHeapMetrics() throws IOException {
        ensureConnection();
        MemoryMXBean memoryMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.MEMORY_MXBEAN_NAME, MemoryMXBean.class);
        MemoryUsage memoryUsage = memoryMXBean.getNonHeapMemoryUsage();
        return new JvmHeapMetrics(memoryUsage.getUsed(), memoryUsage.getCommitted(), memoryUsage.getMax());
    }

    public JvmRuntimeMetrics getRuntimeMetrics() throws IOException {
        ensureConnection();
        RuntimeMXBean runtimeMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.RUNTIME_MXBEAN_NAME, RuntimeMXBean.class);
        return new JvmRuntimeMetrics(runtimeMXBean.getName(), runtimeMXBean.getUptime(), runtimeMXBean.getStartTime());
    }

    public JvmThreadMetrics getThreadMetrics() throws IOException {
        ensureConnection();
        ThreadMXBean threadMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.THREAD_MXBEAN_NAME, ThreadMXBean.class);
        return new JvmThreadMetrics(threadMXBean.getThreadCount(), threadMXBean.getPeakThreadCount(), threadMXBean.getDaemonThreadCount());
    }

    public JvmOperatingSystemMetrics getOSMetrics() throws IOException {
        ensureConnection();
        OperatingSystemMXBean osMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.OPERATING_SYSTEM_MXBEAN_NAME, OperatingSystemMXBean.class);
        return new JvmOperatingSystemMetrics(osMXBean.getName(), osMXBean.getVersion(), osMXBean.getArch(), osMXBean.getAvailableProcessors(), osMXBean.getSystemLoadAverage());
    }

    public JvmClassLoadingMetrics getClassLoadingMetrics() throws IOException {
        ensureConnection();
        ClassLoadingMXBean classLoadingMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.CLASS_LOADING_MXBEAN_NAME, ClassLoadingMXBean.class);
        return new JvmClassLoadingMetrics(classLoadingMXBean.getLoadedClassCount(), classLoadingMXBean.getTotalLoadedClassCount(), classLoadingMXBean.getUnloadedClassCount());
    }

    public List<JvmGarbageCollectorMetrics> getGCMetrics() throws IOException {
        ensureConnection();
        List<GarbageCollectorMXBean> garbageCollectorMXBeans = ManagementFactory.getPlatformMXBeans(mBeanServerConnection, GarbageCollectorMXBean.class);
        List<JvmGarbageCollectorMetrics> metricsList = new ArrayList<>();
        for(GarbageCollectorMXBean gc : garbageCollectorMXBeans) {
            metricsList.add(new JvmGarbageCollectorMetrics(gc.getName(), gc.getCollectionCount(), gc.getCollectionTime()));
        }
        return metricsList;
    }

    public List<JvmMemoryPoolMetrics> getMemoryPoolMetrics() throws IOException {
        ensureConnection();
        List<MemoryPoolMXBean> memoryPoolMXBeans = ManagementFactory.getPlatformMXBeans(mBeanServerConnection, MemoryPoolMXBean.class);
        List<JvmMemoryPoolMetrics> metricsList = new ArrayList<>();
        for(MemoryPoolMXBean pool : memoryPoolMXBeans) {
            MemoryUsage usage = pool.getUsage();
            if(usage == null) continue;
            metricsList.add(new JvmMemoryPoolMetrics(pool.getName(), pool.getType().toString(), usage.getUsed(), usage.getCommitted(), usage.getMax()));
        }
        return metricsList;
    }
}