package com.heapvortex.backend.dto;

public class JvmClassLoadingMetrics {
    private int loadedClassCount;
    private Long totalLoadedClassCount;
    private Long unloadedClassCount;

    public JvmClassLoadingMetrics(int loadedClassCount, Long totalLoadedClassCount, Long unloadedClassCount) {
        this.loadedClassCount = loadedClassCount;
        this.totalLoadedClassCount = totalLoadedClassCount;
        this.unloadedClassCount = unloadedClassCount;
    }

    public int getLoadedClassCount() {
        return loadedClassCount;
    }

    public JvmClassLoadingMetrics setLoadedClassCount(int loadedClassCount) {
        this.loadedClassCount = loadedClassCount;
        return this;
    }

    public Long getTotalLoadedClassCount() {
        return totalLoadedClassCount;
    }

    public JvmClassLoadingMetrics setTotalLoadedClassCount(Long totalLoadedClassCount) {
        this.totalLoadedClassCount = totalLoadedClassCount;
        return this;
    }

    public Long getUnloadedClassCount() {
        return unloadedClassCount;
    }

    public JvmClassLoadingMetrics setUnloadedClassCount(Long unloadedClassCount) {
        this.unloadedClassCount = unloadedClassCount;
        return this;
    }
}
