package com.duduzgomes.server_iptv.integration.live;

public interface ILiveStreamManager {
    void iniciarCanal(Long channelId, String streamKey);
    void pararCanal(Long channelId);
    boolean estaRodando(Long channelId);
}
