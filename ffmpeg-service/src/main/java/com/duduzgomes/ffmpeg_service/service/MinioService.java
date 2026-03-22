package com.duduzgomes.ffmpeg_service.service;

import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.nio.file.Path;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    // faz upload de arquivo pro MinIO
    public void upload(String objectKey, Path filePath) {
        try {
            minioClient.uploadObject(
                UploadObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .filename(filePath.toString())
                    .build()
            );
            log.debug("Upload concluído — key: {}", objectKey);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao fazer upload: " + e.getMessage());
        }
    }

    // faz upload de InputStream pro MinIO
    public void upload(String objectKey, InputStream inputStream,
                       long tamanho, String contentType) {
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(inputStream, tamanho, 10 * 1024 * 1024)
                    .contentType(contentType)
                    .build()
            );
            log.debug("Upload concluído — key: {}", objectKey);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao fazer upload: " + e.getMessage());
        }
    }

    // apaga arquivo
    public void deletar(String objectKey) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build()
            );
            log.info("Arquivo apagado — key: {}", objectKey);
        } catch (Exception e) {
            log.error("Erro ao apagar {}: {}", objectKey, e.getMessage());
        }
    }
}
