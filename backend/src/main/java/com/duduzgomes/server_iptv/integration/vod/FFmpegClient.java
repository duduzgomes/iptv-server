package com.duduzgomes.server_iptv.integration.vod;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.duduzgomes.server_iptv.integration.minio.MinioService;

@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class FFmpegClient implements IVodTranscoder {

    private final RestClient restClient;
    private final MinioService minioService;

    @Value("${streaming.ffmpeg-service-url:http://ffmpeg-service:8081}")
    private String ffmpegServiceUrl;

    public void transcodarFilme(Long movieId, String minioKey) {
        String inputUrl = minioService.gerarUrlInterna(minioKey);

        var request = new TranscodeRequestDTO(
            movieId,
            "MOVIE",
            inputUrl,
            "filmes/" + movieId
        );

        enviar(request);
    }

    public void transcodarEpisodio(Long episodeId, String minioKey) {
        String inputUrl = minioService.gerarUrlInterna(minioKey);

        var request = new TranscodeRequestDTO(
            episodeId,
            "EPISODE",
            inputUrl,
            "series/episodes/" + episodeId
        );

        enviar(request);
    }

    private void enviar(TranscodeRequestDTO request) {
        try {
            restClient.post()
                .uri(ffmpegServiceUrl + "/transcode")
                .body(request)
                .retrieve()
                .toBodilessEntity();
            log.info("Transcodificação solicitada — {} id: {}",
                request.contentType(), request.contentId());
        } catch (Exception e) {
            log.error("Erro ao acionar FFmpeg Service: {}", e.getMessage());
        }
    }

    record TranscodeRequestDTO(
        Long   contentId,
        String contentType,
        String inputUrl,
        String outputPath
    ) {}
}
