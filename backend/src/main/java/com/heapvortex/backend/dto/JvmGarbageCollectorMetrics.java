package com.heapvortex.backend.dto;

public class JvmGarbageCollectorMetrics {

    private String gcName;
    private long collectionCount;
    private long collectionTime;

    public JvmGarbageCollectorMetrics(String gcName, long collectionCount, long collectionTime) {
        this.gcName = gcName;
        this.collectionCount = collectionCount;
        this.collectionTime = collectionTime;
    }

    public String getGcName() {
        return gcName;
    }

    public JvmGarbageCollectorMetrics setGcName(String gcName) {
        this.gcName = gcName;
        return this;
    }

    public long getCollectionCount() {
        return collectionCount;
    }

    public JvmGarbageCollectorMetrics setCollectionCount(long collectionCount) {
        this.collectionCount = collectionCount;
        return this;
    }

    public long getCollectionTime() {
        return collectionTime;
    }

    public JvmGarbageCollectorMetrics setCollectionTime(long collectionTime) {
        this.collectionTime = collectionTime;
        return this;
    }
}
