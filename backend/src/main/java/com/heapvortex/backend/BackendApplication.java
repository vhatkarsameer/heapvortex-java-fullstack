package com.heapvortex.backend;

import com.heapvortex.backend.jmx.JmxConnectionService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.IOException;

@SpringBootApplication
//@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) throws IOException {
		SpringApplication.run(BackendApplication.class, args);

	}

}
