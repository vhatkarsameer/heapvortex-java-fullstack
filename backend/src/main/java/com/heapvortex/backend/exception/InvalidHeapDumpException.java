package com.heapvortex.backend.exception;

public class InvalidHeapDumpException extends RuntimeException{
    public InvalidHeapDumpException(String message) {
        super(message);
    }

}
