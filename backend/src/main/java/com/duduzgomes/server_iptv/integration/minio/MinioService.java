package com.duduzgomes.server_iptv.integration.minio;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

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
            log.info("Upload concluído — key: {}", objectKey);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao fazer upload: " + e.getMessage());
        }
    }

    public String gerarUrlTemporaria(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .method(Method.GET)
                    .expiry(1, TimeUnit.HOURS)
                    .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar URL: " + e.getMessage());
        }
    }

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

    public boolean existe(String objectKey) {
        try {
            minioClient.statObject(
                StatObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build()
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}