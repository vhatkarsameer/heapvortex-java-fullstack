package com.heapvortex.backend.dto;

public class JvmRuntimeMetrics {
    private String jvmName;
    private long upTime;
    private long startTime;

    public JvmRuntimeMetrics(String jvmName, long upTime, long startTime) {
        this.jvmName = jvmName;
        this.upTime = upTime;
        this.startTime = startTime;
    }

    public String getJvmName() {
        return jvmName;
    }

    public JvmRuntimeMetrics setJvmName(String jvmName) {
        this.jvmName = jvmName;
        return this;
    }

    public long getUpTime() {
        return upTime;
    }

    public JvmRuntimeMetrics setUpTime(long upTime) {
        this.upTime = upTime;
        return this;
    }

    public long getStartTime() {
        return startTime;
    }

    public JvmRuntimeMetrics setStartTime(long startTime) {
        this.startTime = startTime;
        return this;
    }
}
