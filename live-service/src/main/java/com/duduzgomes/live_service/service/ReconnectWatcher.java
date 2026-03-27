package com.duduzgomes.live_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReconnectWatcher {

    private static final long BACKOFF_INICIAL_MS = 5_000;
    private static final long BACKOFF_MAXIMO_MS = 60_000;

    private final FFmpegManager ffmpegManager;

    public void notificarQueda(Long channelId, String streamKey, Set<Long> canaisManualmenteParados) {
        if (canaisManualmenteParados.contains(channelId)) {
            log.info("[canal={}] Encerrado manualmente — sem reconexão", channelId);
            return;
        }

        Thread.ofVirtual().start(() -> tentarReconectar(channelId, streamKey, canaisManualmenteParados));
    }

    private void tentarReconectar(Long channelId, String streamKey, Set<Long> canaisManualmenteParados) {
        long backoff = BACKOFF_INICIAL_MS;

        while (!canaisManualmenteParados.contains(channelId)) {
            log.warn("[canal={}] Queda detectada. Reconectando em {}s...", channelId, backoff / 1000);

            try {
                Thread.sleep(backoff);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }

            if (canaisManualmenteParados.contains(channelId)) {
                log.info("[canal={}] Canal parado durante backoff. Abortando.", channelId);
                return;
            }

            try {
                ffmpegManager.iniciarCanal(channelId, streamKey);
                log.info("[canal={}] Reconectado com sucesso", channelId);
                return;
            } catch (Exception e) {
                backoff = Math.min(backoff * 2, BACKOFF_MAXIMO_MS);
                log.error("[canal={}] Falha ao reconectar: {}. Próxima tentativa em {}s",
                        channelId, e.getMessage(), backoff / 1000);
            }
        }
    }
}