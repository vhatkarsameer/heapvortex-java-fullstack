package com.heapvortex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JvmOperatingSystemMetrics {
    private String osName;
    private String osVersion;
    private String architecture;
    private int availableProcessors;
    private double systemLoadAverage;


}
