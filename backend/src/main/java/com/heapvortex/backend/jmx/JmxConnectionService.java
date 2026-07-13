package com.heapvortex.backend.jmx;

import com.heapvortex.backend.dto.*;
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
    private static final String HOST = "localhost";
    private static final int PORT = 9999;

    public void connect() throws IOException {
        String url = "service:jmx:rmi:///jndi/rmi://" + HOST + ":" + PORT + "/jmxrmi";
        jmxServiceURL = new JMXServiceURL(url);
        connector = JMXConnectorFactory.connect(jmxServiceURL);
        mBeanServerConnection = connector.getMBeanServerConnection();
    }

    public JvmHeapMetrics getHeapMetrics() throws IOException {

        if(mBeanServerConnection == null)
            connect();

        MemoryMXBean memoryMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.MEMORY_MXBEAN_NAME, MemoryMXBean.class);
        MemoryUsage memoryUsage = memoryMXBean.getHeapMemoryUsage();

        JvmHeapMetrics metrics = new JvmHeapMetrics(memoryUsage.getUsed(), memoryUsage.getCommitted(), memoryUsage.getMax());

        return metrics;
    }

    public JvmRuntimeMetrics getRuntimeMetrics() throws IOException {

        if(mBeanServerConnection == null)
                connect();

        RuntimeMXBean runtimeMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.RUNTIME_MXBEAN_NAME, RuntimeMXBean.class);

        JvmRuntimeMetrics metrics = new JvmRuntimeMetrics(runtimeMXBean.getName(), runtimeMXBean.getUptime(), runtimeMXBean.getStartTime());

        return metrics;
    }

    public JvmThreadMetrics getThreadMetrics() throws IOException {
        if(mBeanServerConnection == null)
            connect();

        ThreadMXBean threadMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.THREAD_MXBEAN_NAME, ThreadMXBean.class);

        JvmThreadMetrics metrics = new JvmThreadMetrics(threadMXBean.getThreadCount(), threadMXBean.getPeakThreadCount(), threadMXBean.getDaemonThreadCount());

        return metrics;
    }

    public JvmOperatingSystemMetrics getOSMetrics() throws IOException {
        if(mBeanServerConnection == null)
            connect();

        OperatingSystemMXBean osMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.OPERATING_SYSTEM_MXBEAN_NAME, OperatingSystemMXBean.class);

        JvmOperatingSystemMetrics metrics = new JvmOperatingSystemMetrics(osMXBean.getName(), osMXBean.getVersion(), osMXBean.getArch(), osMXBean.getAvailableProcessors(), osMXBean.getSystemLoadAverage());

        return metrics;
    }

    public JvmClassLoadingMetrics getClassLoadingMetrics() throws IOException {
        if(mBeanServerConnection == null)
            connect();

        ClassLoadingMXBean classLoadingMXBean = ManagementFactory.newPlatformMXBeanProxy(mBeanServerConnection, ManagementFactory.CLASS_LOADING_MXBEAN_NAME, ClassLoadingMXBean.class);

        JvmClassLoadingMetrics metrics = new JvmClassLoadingMetrics(classLoadingMXBean.getLoadedClassCount(), classLoadingMXBean.getTotalLoadedClassCount(), classLoadingMXBean.getUnloadedClassCount());

        return metrics;
    }

    public List<JvmGarbageCollectorMetrics> getGCMetrics() throws IOException {
        if(mBeanServerConnection == null)
            connect();

        List<GarbageCollectorMXBean> garbageCollectorMXBean = ManagementFactory.getPlatformMXBeans(mBeanServerConnection, GarbageCollectorMXBean.class);

        List<JvmGarbageCollectorMetrics> metricsList = new ArrayList<>();

        for(GarbageCollectorMXBean gc : garbageCollectorMXBean) {
            JvmGarbageCollectorMetrics metrics = new JvmGarbageCollectorMetrics(gc.getName(), gc.getCollectionCount(), gc.getCollectionTime());

            metricsList.add(metrics);

        }
        return metricsList;
    }

    public List<JvmMemoryPoolMetrics> getMemoryPoolMetrics() throws IOException {
        if(mBeanServerConnection == null)
            connect();

        List<MemoryPoolMXBean> memoryPoolMXBeans = ManagementFactory.getPlatformMXBeans(mBeanServerConnection, MemoryPoolMXBean.class);

        List<JvmMemoryPoolMetrics> metricsList = new ArrayList<>();

        for(MemoryPoolMXBean pool : memoryPoolMXBeans) {
            MemoryUsage usage = pool.getUsage();

            if(usage == null)
                continue;

            JvmMemoryPoolMetrics metrics = new JvmMemoryPoolMetrics(
                    pool.getName(), pool.getType().toString(),
                    usage.getUsed(), usage.getCommitted(), usage.getMax()
            );

            metricsList.add(metrics);
        }

        return metricsList;
    }





    


}
