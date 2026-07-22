package com.heapvortex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JvmClassLoadingMetrics {
    private int loadedClassCount;
    private Long totalLoadedClassCount;
    private Long unloadedClassCount;
}
