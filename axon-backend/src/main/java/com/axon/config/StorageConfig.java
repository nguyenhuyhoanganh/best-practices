package com.axon.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Slf4j
@Configuration
@ConfigurationProperties(prefix = "storage")
@Getter
@Setter
public class StorageConfig {

    private String volumeBasePath;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(volumeBasePath));
        log.info("File storage directory ready: {}", volumeBasePath);
    }
}
