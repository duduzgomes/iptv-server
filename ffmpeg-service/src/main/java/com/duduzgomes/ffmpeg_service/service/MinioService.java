package com.duduzgomes.ffmpeg_service.service;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

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
    public void upload(String objectKey, InputStream inputStream,long tamanho, String contentType) {
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

    // URL pra FFmpeg baixar
    public String gerarUrlInterna(String objectKey) {
        try {
            String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .method(Method.GET)
                    .expiry(1, TimeUnit.HOURS)
                    .build()
            );

            return url;
           
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar URL: " + e.getMessage());
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
