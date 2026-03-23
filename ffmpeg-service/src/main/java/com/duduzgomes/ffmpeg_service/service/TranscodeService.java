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

        try {
            log.info("Iniciando transcodificação — {} id: {}",
                request.contentType(), request.contentId());

            // 1. transcodifica — FFmpeg baixa direto da URL do MinIO
            ffmpegService.transcodar(request.inputUrl(), outputDir);

            // 2. faz upload de todos os segmentos pro MinIO
            uploadDiretorioParaMinIO(outputDir, hlsPath);

            // 3. apaga arquivo original do MinIO (processing/)
            String originalKey = "processing/" +
                request.contentType().toLowerCase() + "s/" +
                request.contentId() + "/original.mp4";
            minioService.deletar(originalKey);

            log.info("Transcodificação concluída — {} id: {}",
                request.contentType(), request.contentId());

            // 4. notifica Spring Boot
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
                // pula o log do FFmpeg
                if (file.getFileName().toString().equals("ffmpeg.log")) {
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
