package com.duduzgomes.ffmpeg_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Slf4j
@Service
public class FFmpegService {

    @Value("${streaming.ffmpeg-path:ffmpeg}")
    private String ffmpegPath;

    @Value("${streaming.hls-segment-duration:2}")
    private int segmentDuration;

    @Value("${streaming.hls-segment-count:8}")
    private int segmentCount;

    // transcodifica arquivo para HLS em múltiplas qualidades
    public void transcodar(String inputUrl, Path outputDir) throws Exception {
        // cria pastas de saída
        Files.createDirectories(outputDir.resolve("720p"));
        Files.createDirectories(outputDir.resolve("480p"));

        // gera master.m3u8
        gerarMasterPlaylist(outputDir);

        // monta comando FFmpeg
        List<String> comando = List.of(
            ffmpegPath,
            "-i", inputUrl,

            // 720p
            "-map", "0:v", "-map", "0:a",
            "-c:v", "libx264", "-preset", "veryfast",
            "-b:v", "1500k", "-vf", "scale=1280:720", "-r", "30",
            "-c:a", "aac", "-b:a", "128k",
            "-f", "hls",
            "-hls_time", String.valueOf(segmentDuration),
            "-hls_list_size", "0",           // 0 = mantém todos os segmentos (VOD)
            "-hls_segment_filename", outputDir + "/720p/seg%03d.ts",
            outputDir + "/720p/index.m3u8",

            // 480p
            "-map", "0:v", "-map", "0:a",
            "-c:v", "libx264", "-preset", "veryfast",
            "-b:v", "800k", "-vf", "scale=854:480", "-r", "30",
            "-c:a", "aac", "-b:a", "96k",
            "-f", "hls",
            "-hls_time", String.valueOf(segmentDuration),
            "-hls_list_size", "0",
            "-hls_segment_filename", outputDir + "/480p/seg%03d.ts",
            outputDir + "/480p/index.m3u8"
        );

        log.info("Iniciando FFmpeg para {}", outputDir);

        Process processo = new ProcessBuilder(comando)
            .redirectErrorStream(true)
            .redirectOutput(outputDir.resolve("ffmpeg.log").toFile())
            .start();

        int exitCode = processo.waitFor();

        if (exitCode != 0) {
            String log = Files.readString(outputDir.resolve("ffmpeg.log"));
            throw new RuntimeException("FFmpeg falhou (exit " + exitCode + "): " + log);
        }

        log.info("FFmpeg concluído para {}", outputDir);
    }

    private void gerarMasterPlaylist(Path outputDir) throws Exception {
        String master = """
            #EXTM3U
            #EXT-X-VERSION:3

            #EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
            720p/index.m3u8

            #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480
            480p/index.m3u8
            """;
        Files.writeString(outputDir.resolve("master.m3u8"), master);
    }
}
