package com.heapvortex.backend.heap_parser;

import com.heapvortex.backend.dto.HeapObject;
import com.heapvortex.backend.dto.HeapStatistics;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

public interface HeapParser {

    HeapStatistics parse(Path heapDumpPath) throws Exception;

    // New methods to fulfill the reference chain requirement
    List<HeapObject> getIncomingReferences(Path heapDumpPath, String address) throws Exception;

    List<HeapObject> getOutgoingReferences(Path heapDumpPath, String address) throws Exception;

    List<HeapObject> getObjectsForClass(Path heapDumpPath, String className) throws Exception;

    List<HeapObject> getPathToGcRoots(Path heapDumpPath, String address) throws Exception;
}