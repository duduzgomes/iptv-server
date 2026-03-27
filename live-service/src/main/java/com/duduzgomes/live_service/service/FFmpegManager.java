package com.duduzgomes.live_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class FFmpegManager {
    
    @Value("${streaming.ffmpeg-path:ffmpeg}")
    private String ffmpegPath;

    @Value("${streaming.hls-path:/hls}")
    private String hlsPath;

    @Value("${streaming.mediamtx-url:rtmp://mediamtx:1935}")
    private String mediamtxUrl;

    @Value("${streaming.hls-segment-duration:2}")
    private int hlsSegmentDuration;

    @Value("${streaming.hls-segment-count:8}")
    private int hlsSegmentCount;

    private final ReconnectWatcher reconnectWatcher;

    private final Map<Long, Process> processosAtivos = new ConcurrentHashMap<>();
    private final Set<Long> canaisManualmenteParados = ConcurrentHashMap.newKeySet();

    public FFmpegManager(@Lazy ReconnectWatcher reconnectWatcher) {
        this.reconnectWatcher = reconnectWatcher;
    }

    public void iniciarCanal(Long channelId, String streamKey) throws IOException {
        canaisManualmenteParados.remove(channelId);

        Path baseDir = Path.of(hlsPath, streamKey);
        Files.createDirectories(baseDir.resolve("720p"));
        Files.createDirectories(baseDir.resolve("480p"));

        gerarMasterPlaylist(baseDir);

        Process processo = new ProcessBuilder(montarComando(streamKey, baseDir))
                .redirectErrorStream(true)
                .redirectOutput(baseDir.resolve("ffmpeg.log").toFile())
                .start();

        processosAtivos.put(channelId, processo);
        log.info("[canal={}] FFmpeg iniciado (streamKey={})", channelId, streamKey);

        Thread.ofVirtual().start(() -> monitorarProcesso(channelId, streamKey, processo));
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

    private void monitorarProcesso(Long channelId, String streamKey, Process processo) {
        try {
            int exitCode = processo.waitFor();
            processosAtivos.remove(channelId);
            log.warn("[canal={}] FFmpeg encerrou (exitCode={})", channelId, exitCode);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        reconnectWatcher.notificarQueda(channelId, streamKey, canaisManualmenteParados);
    }

    private void gerarMasterPlaylist(Path baseDir) throws IOException {
        String conteudo = """
                #EXTM3U
                #EXT-X-VERSION:3

                #EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
                720p/index.m3u8

                #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480
                480p/index.m3u8
                """;
        Files.writeString(baseDir.resolve("master.m3u8"), conteudo);
    }

    private List<String> montarComando(String streamKey, Path baseDir) {
        String inputUrl = mediamtxUrl + "/live/" + streamKey;
        String segDuration = String.valueOf(hlsSegmentDuration);
        String segCount = String.valueOf(hlsSegmentCount);

        List<String> cmd = new ArrayList<>();
        cmd.add(ffmpegPath);

        cmd.addAll(List.of("-re", "-i", inputUrl));

        // copia vídeo do OBS sem reencoder — zero custo de CPU
        cmd.addAll(List.of(
                "-map", "0:v", "-map", "0:a",
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "128k",
                "-f", "hls",
                "-hls_time", segDuration,
                "-hls_list_size", segCount,
                "-hls_flags", "delete_segments+append_list+discont_start",
                "-hls_segment_filename", baseDir.resolve("720p/seg%03d.ts").toString(),
                baseDir.resolve("720p/index.m3u8").toString()
        ));

        return cmd;
    }
}
