package com.heapvortex.backend.heap.parser;

import java.nio.file.Path;

public interface HeapParser {
    void parse(Path heapDumpPath);
}
