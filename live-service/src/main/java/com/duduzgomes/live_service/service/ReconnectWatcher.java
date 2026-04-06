package com.duduzgomes.live_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReconnectWatcher {

    private static final long BACKOFF_INICIAL_MS = 5_000;
    private static final long BACKOFF_MAXIMO_MS  = 60_000;
    private static final long DURACAO_ESTAVEL_MS = 30_000;
    private static final int  MAX_TENTATIVAS     = 10;

    private final FFmpegManager ffmpegManager;
    private final Map<Long, Integer> tentativasPorCanal = new ConcurrentHashMap<>();

    public void notificarQueda(Long channelId, String streamKey, String url, Set<Long> canaisManualmenteParados, long duracaoMs) {
        if (canaisManualmenteParados.contains(channelId)) {
            log.info("[canal={}] Encerrado manualmente — sem reconexão", channelId);
            tentativasPorCanal.remove(channelId);
            return;
        }

        if (duracaoMs >= DURACAO_ESTAVEL_MS) {
            log.info("[canal={}] Stream ficou estável por {}s — resetando tentativas", channelId, duracaoMs / 1000);
            tentativasPorCanal.remove(channelId);
        }

        int tentativa = tentativasPorCanal.merge(channelId, 1, Integer::sum);

        if (tentativa > MAX_TENTATIVAS) {
            log.error("[canal={}] Limite de {} tentativas atingido. Desistindo.", channelId, MAX_TENTATIVAS);
            tentativasPorCanal.remove(channelId);
            return;
        }

        long backoff = Math.min(BACKOFF_INICIAL_MS * (1L << (tentativa - 1)), BACKOFF_MAXIMO_MS);

        log.warn("[canal={}] Queda detectada. Tentativa {}/{}. Reconectando em {}s...",
                channelId, tentativa, MAX_TENTATIVAS, backoff / 1000);

        Thread.ofVirtual().start(() -> executarReconexao(channelId, streamKey, url, backoff, canaisManualmenteParados));
    }

    private void executarReconexao(Long channelId, String streamKey, String url, long backoff, Set<Long> canaisManualmenteParados) {
        try {
            Thread.sleep(backoff);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return;
        }

        if (canaisManualmenteParados.contains(channelId)) {
            log.info("[canal={}] Canal parado durante backoff. Abortando.", channelId);
            tentativasPorCanal.remove(channelId);
            return;
        }

        try {
            ffmpegManager.iniciarCanal(channelId, streamKey, url);
            log.info("[canal={}] Processo FFmpeg iniciado — aguardando estabilidade", channelId);
        } catch (Exception e) {
            log.error("[canal={}] Falha ao reconectar: {}", channelId, e.getMessage());
            notificarQueda(channelId, streamKey, url, canaisManualmenteParados, 0L);
        }
    }

    public void notificarInicioManual(Long channelId) {
        tentativasPorCanal.remove(channelId);
    }
}