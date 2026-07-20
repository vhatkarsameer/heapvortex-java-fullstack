package com.heapvortex.backend.heap.parser;

import com.heapvortex.backend.dto.HeapStatistics;

import java.io.IOException;
import java.nio.file.Path;

public interface HeapParser {
    HeapStatistics parse(Path heapDumpPath) throws IOException;
}
