package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class HeapStatistics {
    private final long objectCount;
    private final int classCount;
    private final long totalShallowHeap;
    private final List<ClassStatistics> classStatistics;
}
