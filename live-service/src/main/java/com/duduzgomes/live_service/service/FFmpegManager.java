package com.duduzgomes.live_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class FFmpegManager {
    
    @Value("${streaming.ffmpeg-path}")
    private String ffmpegPath;

    @Value("${streaming.hls-path}")
    private String hlsPath;

    @Value("${streaming.mediamtx-url}")
    private String mediamtxUrl;

    @Value("${streaming.hls-segment-duration}")
    private int hlsSegmentDuration;

    @Value("${streaming.hls-segment-count}")
    private int hlsSegmentCount;

    private final ReconnectWatcher reconnectWatcher;
    private final Map<Long, Process> processosAtivos = new ConcurrentHashMap<>();
    private final Set<Long> canaisManualmenteParados = ConcurrentHashMap.newKeySet();

    public FFmpegManager(@Lazy ReconnectWatcher reconnectWatcher) {
        this.reconnectWatcher = reconnectWatcher;
    }

    public void iniciarCanal(Long channelId, String streamKey, String url) throws IOException {
        canaisManualmenteParados.remove(channelId);

        Path baseDir = Path.of(hlsPath, streamKey);
        deleteRecursively(baseDir);
        Files.createDirectories(baseDir.resolve("720p"));
        Files.createDirectories(baseDir.resolve("480p"));

        Process processo = new ProcessBuilder(montarComando(url, baseDir))
                .redirectErrorStream(true)
                .redirectOutput(baseDir.resolve("ffmpeg.log").toFile())
                .start();

        processosAtivos.put(channelId, processo);

        log.info("[canal={}] FFmpeg iniciado (streamKey={}) url = {}", channelId, streamKey, url);

        Thread.ofVirtual().start(() -> monitorarProcesso(channelId, streamKey, url, processo));
    }

    public void pararCanal(Long channelId) {
        canaisManualmenteParados.add(channelId);

        Process processo = processosAtivos.remove(channelId);
        if (processo != null && processo.isAlive()) {
            processo.destroy();
            log.info("[canal={}] FFmpeg encerrado manualmente", channelId);
        }
    }

    public boolean estaRodando(Long channelId) {
        Process processo = processosAtivos.get(channelId);
        return processo != null && processo.isAlive();
    }

    private void monitorarProcesso(Long channelId, String streamKey, String url, Process processo) {
        Long inicioMs = System.currentTimeMillis();
        Long duracaoMs = 0L;
        try {
            int exitCode = processo.waitFor();
            processosAtivos.remove(channelId);
            duracaoMs = System.currentTimeMillis() - inicioMs;

            log.warn("[canal={}] FFmpeg encerrou (exitCode={}) após {}s", channelId, exitCode, duracaoMs / 1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        reconnectWatcher.notificarQueda(channelId, streamKey, url, canaisManualmenteParados, duracaoMs);
    }

    private List<String> montarComando(String url, Path baseDir) {
        List<String> cmd = new ArrayList<>();
        cmd.add(ffmpegPath);

        if (!url.startsWith("rtmp")) {
            cmd.addAll(List.of("-i", url));
        } else {
            cmd.addAll(List.of("-re", "-i", url));
        }

        cmd.addAll(List.of(
                "-filter_complex", "[0:v]split=2[v720][v480];[v720]scale=1280:720[v720out];[v480]scale=854:480[v480out]",
                "-map", "[v720out]", "-c:v:0", "h264_nvenc", "-preset:v:0", "p4", "-b:v:0", "1500k",
                "-map", "[v480out]", "-c:v:1", "h264_nvenc", "-preset:v:1", "p4", "-b:v:1", "800k",
                "-map", "0:a", "-c:a:0", "aac", "-b:a:0", "128k",
                "-map", "0:a", "-c:a:1", "aac", "-b:a:1", "96k",
                "-f", "hls",
                "-hls_time", String.valueOf(hlsSegmentDuration),
                "-hls_list_size", String.valueOf(hlsSegmentCount),
                "-hls_flags", "delete_segments+independent_segments",
                "-master_pl_name", "master.m3u8",
                "-var_stream_map", "v:0,a:0,name:720p v:1,a:1,name:480p",
                "-hls_segment_filename", baseDir.resolve("%v/seg%03d.ts").toString(),
                baseDir.resolve("%v/index.m3u8").toString()
        ));

        return cmd;
    }

    private void deleteRecursively(Path path) throws IOException {
        if (Files.exists(path)) {
            try (var stream = Files.walk(path)) {
                stream.sorted(Comparator.reverseOrder())
                    .forEach(p -> p.toFile().delete());
            }
        }
    }
}
