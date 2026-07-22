package com.heapvortex.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class JmxConnectionRequest {
    private String host;
    private int port;
}
