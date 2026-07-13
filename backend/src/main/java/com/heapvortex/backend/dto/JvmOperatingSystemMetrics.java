package com.heapvortex.backend.dto;

public class JvmOperatingSystemMetrics {
    private String osName;
    private String osVersion;
    private String architecture;
    private int availableProcessors;
    private double systemLoadAverage;

    public JvmOperatingSystemMetrics(String osName, String osVersion, String architecture, int availableProcessors, double systemLoadAverage) {
        this.osName = osName;
        this.osVersion = osVersion;
        this.architecture = architecture;
        this.availableProcessors = availableProcessors;
        this.systemLoadAverage = systemLoadAverage;
    }

    public String getOsName() {
        return osName;
    }

    public JvmOperatingSystemMetrics setOsName(String osName) {
        this.osName = osName;
        return this;
    }

    public String getOsVersion() {
        return osVersion;
    }

    public JvmOperatingSystemMetrics setOsVersion(String osVersion) {
        this.osVersion = osVersion;
        return this;
    }

    public String getArchitecture() {
        return architecture;
    }

    public JvmOperatingSystemMetrics setArchitecture(String architecture) {
        this.architecture = architecture;
        return this;
    }

    public int getAvailableProcessors() {
        return availableProcessors;
    }

    public JvmOperatingSystemMetrics setAvailableProcessors(int availableProcessors) {
        this.availableProcessors = availableProcessors;
        return this;
    }

    public double getSystemLoadAverage() {
        return systemLoadAverage;
    }

    public JvmOperatingSystemMetrics setSystemLoadAverage(double systemLoadAverage) {
        this.systemLoadAverage = systemLoadAverage;
        return this;
    }
}
