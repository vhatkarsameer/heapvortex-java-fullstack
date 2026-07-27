package com.heapvortex.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidHeapDumpException.class)
    public ResponseEntity<String> handleInvalidHeapDumpException(InvalidHeapDumpException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<String> handleHeapParsingException(IOException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(e.getMessage());
    }
}
