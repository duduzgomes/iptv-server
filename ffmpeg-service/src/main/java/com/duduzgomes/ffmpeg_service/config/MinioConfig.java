package com.duduzgomes.ffmpeg_service.config;

import io.minio.MinioAsyncClient;
import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    @Value("${minio.url}")
    private String url;

    @Value("${minio.user}")
    private String user;

    @Value("${minio.password}")
    private String password;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
            .endpoint(url)
            .credentials(user, password)
            .build();
    }

    @Bean
    public MinioAsyncClient minioAsyncClient() {
        return MinioAsyncClient.builder()
            .endpoint(url)
            .credentials(user, password)
            .build();
    }
}
