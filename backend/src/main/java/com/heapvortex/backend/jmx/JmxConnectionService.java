package com.heapvortex.backend.jmx;

import javax.management.MBeanServerConnection;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;

import java.io.IOException;
import java.net.MalformedURLException;

public class JmxConnectionService {

    private JMXServiceURL jmxServiceURL;
    private JMXConnector connector;
    private MBeanServerConnection mBeanServerConnection;

    public void connect(String host, int port) throws IOException {

        String url = "service:jmx:rmi:///jndi/rmi://" + host + ":" + port + "/jmxrmi";
        jmxServiceURL = new JMXServiceURL(url);
        connector = JMXConnectorFactory.connect(jmxServiceURL);
        mBeanServerConnection = connector.getMBeanServerConnection();
        System.out.println(mBeanServerConnection.getDefaultDomain());

    }


}
