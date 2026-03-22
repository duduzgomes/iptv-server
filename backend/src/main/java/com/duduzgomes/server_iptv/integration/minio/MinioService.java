package com.duduzgomes.server_iptv.integration.minio;

import io.minio.*;
import io.minio.http.Method;
import io.minio.messages.Part;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient      minioClient;
    private final MinioAsyncClient minioAsyncClient;

    @Value("${minio.bucket}")
    private String bucket;

    // inicia multipart — MinioAsyncClient expõe createMultipartUploadAsync
    public String iniciarMultipartUpload(String objectKey) {
        try {
            var response = minioAsyncClient.createMultipartUploadAsync(
                bucket, null, objectKey, null, null
            ).get();
            return response.result().uploadId();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao iniciar upload: " + e.getMessage());
        }
    }

    // gera presigned URL pra cada chunk — MinioClient tem getPresignedObjectUrl
    public String gerarPresignedUrlParaChunk(String objectKey,
                                              String uploadId,
                                              int partNumber) {
        try {
            Map<String, String> queryParams = new HashMap<>();
            queryParams.put("uploadId", uploadId);
            queryParams.put("partNumber", String.valueOf(partNumber));

            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .method(Method.PUT)
                    .expiry(1, TimeUnit.HOURS)
                    .extraQueryParams(queryParams)
                    .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar URL: " + e.getMessage());
        }
    }

    // conclui multipart
    public void concluirMultipartUpload(String objectKey,
                                         String uploadId,
                                         List<String> etags) {
        try {
            List<Part> parts = new ArrayList<>();
            for (int i = 0; i < etags.size(); i++) {
                parts.add(new Part(i + 1, etags.get(i)));
            }

            minioAsyncClient.completeMultipartUploadAsync(
                bucket, null, objectKey, uploadId,
                parts.toArray(new Part[0]), null, null
            ).get();

        } catch (Exception e) {
            throw new RuntimeException("Erro ao concluir upload: " + e.getMessage());
        }
    }

    // aborta multipart
    public void abortarMultipartUpload(String objectKey, String uploadId) {
        try {
            minioAsyncClient.abortMultipartUploadAsync(
                bucket, null, objectKey, uploadId, null, null
            ).get();
        } catch (Exception e) {
            log.error("Erro ao abortar: {}", e.getMessage());
        }
    }

    // URL temporária pra FFmpeg baixar
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

    // apaga arquivo
    public void deletar(String objectKey) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build()
            );
        } catch (Exception e) {
            log.error("Erro ao apagar {}: {}", objectKey, e.getMessage());
        }
    }
}