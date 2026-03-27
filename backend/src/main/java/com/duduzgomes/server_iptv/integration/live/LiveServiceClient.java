package com.duduzgomes.server_iptv.integration.live;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@Primary
@RequiredArgsConstructor
public class LiveServiceClient implements ILiveStreamManager {

    private final RestClient restClient;

    @Value("${streaming.live-service-url:http://live-service:8082}")
    private String liveServiceUrl;

    @Override
    public void iniciarCanal(Long channelId, String streamKey) {
        try {
            restClient.post()
                    .uri(liveServiceUrl + "/live/iniciar")
                    .body(new CanalRequestDTO(channelId, streamKey))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Canal iniciado — id: {}", channelId);
        } catch (Exception e) {
            log.error("Erro ao iniciar canal {}: {}", channelId, e.getMessage());
        }
    }

    @Override
    public void pararCanal(Long channelId) {
        try {
            restClient.post()
                    .uri(liveServiceUrl + "/live/parar/" + channelId)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Canal parado — id: {}", channelId);
        } catch (Exception e) {
            log.error("Erro ao parar canal {}: {}", channelId, e.getMessage());
        }
    }

    @Override
    public boolean estaRodando(Long channelId) {
        try {
            Boolean result = restClient.get()
                    .uri(liveServiceUrl + "/live/status/" + channelId)
                    .retrieve()
                    .body(Boolean.class);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("Erro ao verificar status do canal {}: {}", channelId, e.getMessage());
            return false;
        }
    }

    record CanalRequestDTO(Long channelId, String streamKey) {}
}