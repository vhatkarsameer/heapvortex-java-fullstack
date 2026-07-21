package com.heapvortex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ClassStatistics {

    private final String className;
    private final long objectCount;
    private final long shallowHeap;

}
