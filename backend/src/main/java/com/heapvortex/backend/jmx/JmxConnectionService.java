package com.heapvortex.backend.jmx;

import com.heapvortex.backend.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.management.MBeanServerConnection;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;

import java.io.IOException;
import java.lang.management.*;
import java.util.ArrayList;
import java.util.List;

@Service
public class JmxConnectionService {

    private JMXServiceURL jmxServiceURL;
    private JMXConnector connector;
    private MBeanServerConnection mBeanServerConnection;
    @Value("${jmx.host}")
    private String host;
    @Value("${jmx.port}")
    private int port;

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

        if(connector != null) {
            connector.close();
            connector = null;
            mBeanServerConnection = null;
        }

        String url = "service:jmx:rmi:///jndi/rmi://" + host + ":" + port + "/jmxrmi";

        jmxServiceURL = new JMXServiceURL(url);
        connector = JMXConnectorFactory.connect(jmxServiceURL);
        mBeanServerConnection = connector.getMBeanServerConnection();

        this.host = host;
        this.port = port;
    }


    public JvmHeapMetrics getHeapMetrics() throws IOException {

        ensureConnection();

        MemoryMXBean memoryMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.MEMORY_MXBEAN_NAME, MemoryMXBean.class);
        MemoryUsage memoryUsage = memoryMXBean.getHeapMemoryUsage();

        JvmHeapMetrics metrics = new JvmHeapMetrics(memoryUsage.getUsed(), memoryUsage.getCommitted(), memoryUsage.getMax());

        return metrics;
    }

    public JvmHeapMetrics getNonHeapMetrics() throws IOException {

        ensureConnection();

        MemoryMXBean memoryMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.MEMORY_MXBEAN_NAME, MemoryMXBean.class);
        MemoryUsage memoryUsage = memoryMXBean.getNonHeapMemoryUsage();

        JvmHeapMetrics metrics = new JvmHeapMetrics(memoryUsage.getUsed(), memoryUsage.getCommitted(), memoryUsage.getMax());

        return metrics;
    }

    public JvmRuntimeMetrics getRuntimeMetrics() throws IOException {

        ensureConnection();

        RuntimeMXBean runtimeMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.RUNTIME_MXBEAN_NAME, RuntimeMXBean.class);

        JvmRuntimeMetrics metrics = new JvmRuntimeMetrics(runtimeMXBean.getName(), runtimeMXBean.getUptime(), runtimeMXBean.getStartTime());

        return metrics;
    }

    public JvmThreadMetrics getThreadMetrics() throws IOException {

        ensureConnection();

        ThreadMXBean threadMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.THREAD_MXBEAN_NAME, ThreadMXBean.class);

        JvmThreadMetrics metrics = new JvmThreadMetrics(threadMXBean.getThreadCount(), threadMXBean.getPeakThreadCount(), threadMXBean.getDaemonThreadCount());

        return metrics;
    }

    public JvmOperatingSystemMetrics getOSMetrics() throws IOException {

        ensureConnection();

        OperatingSystemMXBean osMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.OPERATING_SYSTEM_MXBEAN_NAME, OperatingSystemMXBean.class);

        JvmOperatingSystemMetrics metrics = new JvmOperatingSystemMetrics(osMXBean.getName(), osMXBean.getVersion(), osMXBean.getArch(), osMXBean.getAvailableProcessors(), osMXBean.getSystemLoadAverage());

        return metrics;
    }

    public JvmClassLoadingMetrics getClassLoadingMetrics() throws IOException {

        ensureConnection();

        ClassLoadingMXBean classLoadingMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.CLASS_LOADING_MXBEAN_NAME, ClassLoadingMXBean.class);

        JvmClassLoadingMetrics metrics = new JvmClassLoadingMetrics(classLoadingMXBean.getLoadedClassCount(), classLoadingMXBean.getTotalLoadedClassCount(), classLoadingMXBean.getUnloadedClassCount());

        return metrics;
    }

    public List<JvmGarbageCollectorMetrics> getGCMetrics() throws IOException {

        ensureConnection();

        List<GarbageCollectorMXBean> garbageCollectorMXBeans = ManagementFactory.getPlatformMXBeans(mBeanServerConnection, GarbageCollectorMXBean.class);

        List<JvmGarbageCollectorMetrics> metricsList = new ArrayList<>();

        for(GarbageCollectorMXBean gc : garbageCollectorMXBeans) {
            JvmGarbageCollectorMetrics metrics = new JvmGarbageCollectorMetrics(gc.getName(), gc.getCollectionCount(), gc.getCollectionTime());

            metricsList.add(metrics);

        }
        return metricsList;
    }

    public List<JvmMemoryPoolMetrics> getMemoryPoolMetrics() throws IOException {

        ensureConnection();

        List<MemoryPoolMXBean> memoryPoolMXBeans = ManagementFactory.getPlatformMXBeans(mBeanServerConnection, MemoryPoolMXBean.class);

        List<JvmMemoryPoolMetrics> metricsList = new ArrayList<>();

        for(MemoryPoolMXBean pool : memoryPoolMXBeans) {
            MemoryUsage usage = pool.getUsage();

            if(usage == null) {
                continue;
            }

            JvmMemoryPoolMetrics metrics = new JvmMemoryPoolMetrics(
                    pool.getName(), pool.getType().toString(),
                    usage.getUsed(), usage.getCommitted(), usage.getMax()
            );

            metricsList.add(metrics);
        }

        return metricsList;
    }

}
