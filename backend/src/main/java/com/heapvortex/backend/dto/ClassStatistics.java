package com.heapvortex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ClassStatistics {

    private final String className;
    private final long objectCount;
    private final long shallowHeap;

}
