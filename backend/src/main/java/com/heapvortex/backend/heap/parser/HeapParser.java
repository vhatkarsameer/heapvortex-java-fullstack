package com.heapvortex.backend.heap.parser;

import java.io.IOException;
import java.nio.file.Path;

public interface HeapParser {
    long parse(Path heapDumpPath) throws IOException;
}
