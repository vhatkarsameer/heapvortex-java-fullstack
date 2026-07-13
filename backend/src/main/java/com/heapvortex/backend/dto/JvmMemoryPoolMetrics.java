package com.heapvortex.backend.dto;

public class JvmMemoryPoolMetrics {
    private String poolName;
    private String type;
    private long used;
    private long committed;
    private long max;

    public JvmMemoryPoolMetrics(String poolName, String type, long used, long committed, long max) {
        this.poolName = poolName;
        this.type = type;
        this.used = used;
        this.committed = committed;
        this.max = max;
    }

    public String getPoolName() {
        return poolName;
    }

    public JvmMemoryPoolMetrics setPoolName(String poolName) {
        this.poolName = poolName;
        return this;
    }

    public String getType() {
        return type;
    }

    public JvmMemoryPoolMetrics setType(String type) {
        this.type = type;
        return this;
    }

    public long getUsed() {
        return used;
    }

    public JvmMemoryPoolMetrics setUsed(long used) {
        this.used = used;
        return this;
    }

    public long getCommitted() {
        return committed;
    }

    public JvmMemoryPoolMetrics setCommitted(long committed) {
        this.committed = committed;
        return this;
    }

    public long getMax() {
        return max;
    }

    public JvmMemoryPoolMetrics setMax(long max) {
        this.max = max;
        return this;
    }
}
