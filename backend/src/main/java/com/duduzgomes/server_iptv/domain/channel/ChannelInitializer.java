package com.duduzgomes.server_iptv.domain.channel;

import com.duduzgomes.server_iptv.integration.live.ILiveStreamManager;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChannelInitializer {

    private final ChannelService channelService;
    private final ILiveStreamManager liveStreamManager;

    @PostConstruct
    public void iniciarCanaisAtivos() {
        var canais = channelService.listarEntidades();
        log.info("Iniciando {} canal(is) ativo(s)...", canais.size());

        canais.forEach(canal -> {
            try {
                liveStreamManager.iniciarCanal(canal.getId(), canal.getStreamKey());
                log.info("[canal={}] Iniciado (streamKey={})", canal.getId(), canal.getStreamKey());
            } catch (Exception e) {
                log.error("[canal={}] Falha ao iniciar: {}", canal.getId(), e.getMessage());
            }
        });
    }
}