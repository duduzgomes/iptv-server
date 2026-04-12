package com.duduzgomes.ffmpeg_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.duduzgomes.ffmpeg_service.dto.TranscodeCallbackDTO;
import com.duduzgomes.ffmpeg_service.dto.TranscodeRequestDTO;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranscodeService {

    private final FFmpegService ffmpegService;
    private final MinioService  minioService;
    private final RestClient    restClient;

    @Value("${callback.url}")
    private String callbackUrl;

    @Value("${internal.secret}")
    private String internalSecret;

    // executor virtual — não bloqueia o servidor durante transcodificação
    private final Executor executor = Executors.newVirtualThreadPerTaskExecutor();

    // inicia transcodificação em background
    public void transcodar(TranscodeRequestDTO request) {
        executor.execute(() -> processarTranscode(request));
    }

    private void processarTranscode(TranscodeRequestDTO request) {
        Path outputDir = Path.of("/tmp/transcode",
            request.contentType().toLowerCase(),
            String.valueOf(request.contentId()));

        String hlsPath = request.outputPath();

        Path faststartFile = outputDir.resolve("input.mp4");

        String inputUrl = minioService.gerarUrlInterna(request.inputPath());

        try {
            log.info("Iniciando transcodificação — {} id: {}",
                request.contentType(), request.contentId());

            // 1. remuxar com faststart para mover o moov atom pro início
            ffmpegService.processarFaststart(inputUrl, faststartFile);

            // 2. substitui o arquivo original no MinIO pelo com moov atom no início
            minioService.upload(request.inputPath(), faststartFile);
            log.info("Original substituído pelo faststart — key: {}", request.inputPath());

            // 3. transcodifica a partir do arquivo local com faststart aplicado
            ffmpegService.transcodar(faststartFile.toString(), outputDir);

            // 4. faz upload dos segmentos HLS pro MinIO
            uploadDiretorioParaMinIO(outputDir, hlsPath);

            log.info("Transcodificação concluída — {} id: {}",
                request.contentType(), request.contentId());

            // 5. notifica Spring Boot
            notificar(new TranscodeCallbackDTO(
                request.contentId(),
                request.contentType(),
                hlsPath,
                true,
                null
            ));

        } catch (Exception e) {
            log.error("Erro na transcodificação — {} id: {}: {}",
                request.contentType(), request.contentId(), e.getMessage());

            notificar(new TranscodeCallbackDTO(
                request.contentId(),
                request.contentType(),
                null,
                false,
                e.getMessage()
            ));
        } finally {
            // limpa arquivos temporários
            limparDiretorio(outputDir);
        }
    }

    // faz upload recursivo de todos os arquivos do diretório pro MinIO
    private void uploadDiretorioParaMinIO(Path dir, String baseKey) throws Exception {
        Files.walkFileTree(dir, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file,BasicFileAttributes attrs) {
                // pula arquivos temporários intermediários
                String fileName = file.getFileName().toString();
                if (fileName.equals("ffmpeg.log") || fileName.equals("input.mp4") || fileName.equals("faststart.log")) {
                    return FileVisitResult.CONTINUE;
                }

                String relativePath = dir.relativize(file).toString()
                    .replace("\\", "/");
                String objectKey = baseKey + "/" + relativePath;

                minioService.upload(objectKey, file);
                log.debug("Upload: {}", objectKey);

                return FileVisitResult.CONTINUE;
            }
        });
    }

    private void notificar(TranscodeCallbackDTO callback) {
        try {
            restClient.post()
                .uri(callbackUrl)
                .header("X-Internal-Secret", internalSecret)
                .body(callback)
                .retrieve()
                .toBodilessEntity();
            log.info("Callback enviado pro Spring Boot");
        } catch (Exception e) {
            log.error("Erro ao notificar Spring Boot: {}", e.getMessage());
        }
    }

    private void limparDiretorio(Path dir) {
        try {
            Files.walkFileTree(dir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file,BasicFileAttributes attrs)throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path d, IOException e)
                        throws IOException {
                    Files.delete(d);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (Exception e) {
            log.warn("Erro ao limpar diretório {}: {}", dir, e.getMessage());
        }
    }
}
