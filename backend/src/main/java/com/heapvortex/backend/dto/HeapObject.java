package com.heapvortex.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class HeapObject {

    private final String className;
    private final String address;
    private final long shallowHeap;
    private final long retainedHeap;

    @Override
    public String toString() {
        return "HeapObject{" +
                "className='" + className + '\'' +
                ", address='" + address + '\'' +
                ", shallowHeap=" + shallowHeap +
                ", retainedHeap=" + retainedHeap +
                '}';
    }
}
