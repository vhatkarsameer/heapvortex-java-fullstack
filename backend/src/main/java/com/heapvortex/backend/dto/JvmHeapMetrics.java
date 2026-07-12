package com.heapvortex.backend.dto;

public class JvmHeapMetrics {
    private long heapUsed;
    private long heapCommited;
    private long heapMax;

    public JvmHeapMetrics(long heapUsed, long heapCommited, long heapMax) {
        this.heapUsed = heapUsed;
        this.heapCommited = heapCommited;
        this.heapMax = heapMax;
    }

    public long getHeapUsed() {
        return heapUsed;
    }

    public JvmHeapMetrics setHeapUsed(long heapUsed) {
        this.heapUsed = heapUsed;
        return this;
    }

    public long getHeapCommited() {
        return heapCommited;
    }

    public JvmHeapMetrics setHeapCommited(long heapCommited) {
        this.heapCommited = heapCommited;
        return this;
    }

    public long getHeapMax() {
        return heapMax;
    }

    public JvmHeapMetrics setHeapMax(long heapMax) {
        this.heapMax = heapMax;
        return this;
    }
}
