package com.duduzgomes.ffmpeg_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
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

    // move o moov atom para o início do MP4 (faststart) — melhora streaming progressivo
    public void processarFaststart(String inputUrl, Path outputFile) throws Exception {
        Files.createDirectories(outputFile.getParent());
        Path logFile = outputFile.getParent().resolve("faststart.log");

        List<String> comando = new ArrayList<>(List.of(
            ffmpegPath,
            "-i", inputUrl,
            "-movflags", "faststart",
            "-c", "copy",
            outputFile.toString()
        ));

        log.info("Aplicando faststart em {}", outputFile);

        Process processo = new ProcessBuilder(comando)
            .redirectErrorStream(true)
            .redirectOutput(logFile.toFile())
            .start();

        int exitCode = processo.waitFor();

        if (exitCode != 0) {
            String logContent = Files.readString(logFile);
            throw new RuntimeException("FFmpeg faststart falhou (exit " + exitCode + "): " + logContent);
        }

        log.info("Faststart concluído: {}", outputFile);
    }

    // transcodifica arquivo para HLS em múltiplas qualidades
    public void transcodar(String inputUrl, Path outputDir) throws Exception {
        Files.createDirectories(outputDir.resolve("720p"));
        Files.createDirectories(outputDir.resolve("480p"));

        List<String> comando = new ArrayList<>(List.of(
            ffmpegPath,
            "-i", inputUrl,

            "-filter_complex", "[0:v]split=2[v720][v480];[v720]scale=1280:720[v720out];[v480]scale=854:480[v480out]",

            "-map", "[v720out]", "-c:v:0", "h264_nvenc", "-preset:v:0", "p4", "-b:v:0", "1500k",
            "-map", "[v480out]", "-c:v:1", "h264_nvenc", "-preset:v:1", "p4", "-b:v:1", "800k",

            "-map", "0:a", "-c:a:0", "aac", "-b:a:0", "128k",
            "-map", "0:a", "-c:a:1", "aac", "-b:a:1", "96k",

            "-f", "hls",
            "-hls_time", String.valueOf(segmentDuration),
            "-hls_list_size", "0",
            "-hls_flags", "independent_segments",
            "-master_pl_name", "master.m3u8",
            "-var_stream_map", "v:0,a:0,name:720p v:1,a:1,name:480p",
            "-hls_segment_filename", outputDir + "/%v/seg%03d.ts",
            outputDir + "/%v/index.m3u8"
        ));

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
}
