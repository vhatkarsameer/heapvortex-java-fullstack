package com.heapvortex.backend.jmx;

import com.heapvortex.backend.dto.JvmHeapMetrics;
import org.springframework.stereotype.Service;

import javax.management.MBeanServerConnection;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;

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


}
