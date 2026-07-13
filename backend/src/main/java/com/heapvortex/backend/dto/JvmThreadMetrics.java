package com.heapvortex.backend.dto;

public class JvmThreadMetrics {

    private int threadCount;
    private int peakThreadCount;
    private int daemonThreadCount;

    public JvmThreadMetrics(int threadCount, int peakThreadCount, int daemonThreadCount) {
        this.threadCount = threadCount;
        this.peakThreadCount = peakThreadCount;
        this.daemonThreadCount = daemonThreadCount;
    }

    public int getThreadCount() {
        return threadCount;
    }

    public JvmThreadMetrics setThreadCount(int threadCount) {
        this.threadCount = threadCount;
        return this;
    }

    public int getPeakThreadCount() {
        return peakThreadCount;
    }

    public JvmThreadMetrics setPeakThreadCount(int peakThreadCount) {
        this.peakThreadCount = peakThreadCount;
        return this;
    }

    public int getDaemonThreadCount() {
        return daemonThreadCount;
    }

    public JvmThreadMetrics setDaemonThreadCount(int daemonThreadCount) {
        this.daemonThreadCount = daemonThreadCount;
        return this;
    }
}
