package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class HeapStatistics {
    private final long objectCount;
    private final int classCount;
    private final long totalShallowHeap;
    private final List<ClassStatistics> classStatistics;
}
