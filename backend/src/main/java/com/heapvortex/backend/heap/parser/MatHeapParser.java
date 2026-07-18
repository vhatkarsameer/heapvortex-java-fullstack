package com.heapvortex.backend.heap.parser;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Component
public class MatHeapParser implements HeapParser{

    private static final Logger logger = LoggerFactory.getLogger(MatHeapParser.class);

    @Override
    public void parse(Path heapDumpPath) {
        logger.info("Parsing heap dump: {}", heapDumpPath);
    }
}
