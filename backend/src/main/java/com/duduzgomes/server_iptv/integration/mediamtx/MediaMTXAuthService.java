package com.duduzgomes.server_iptv.integration.mediamtx;

import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.channel.ChannelRepository;
import com.duduzgomes.server_iptv.integration.live.ILiveStreamManager;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaMTXAuthService {

    private final ChannelRepository  channelRepository;
    private final ILiveStreamManager liveStreamManager;

    public boolean autorizar(MediaMTXAuthDTO dto) {
        if (!"publish".equals(dto.action())) return true;

        if (dto.path() == null || !dto.path().startsWith("live/")) return false;

        String streamKey = dto.path().substring("live/".length());
        if (streamKey.isBlank()) return false;

        return channelRepository.existsByStreamKeyAndActiveTrue(streamKey);
    }

    public boolean publish(String path) {
        String streamKey = path.substring("live/".length());

        return channelRepository.findByStreamKeyAndActiveTrue(streamKey)
                .map(canal -> {
                    liveStreamManager.iniciarCanal(canal.getId(), streamKey, canal.getSourceUrl());
                    return true;
                })
                .orElse(false);
    }

    public boolean onUnpublish(String path) {
        String streamKey = path.substring("live/".length());

        return channelRepository.findByStreamKeyAndActiveTrue(streamKey)
                .map(canal -> {
                    liveStreamManager.pararCanal(canal.getId());
                    return true;
                })
                .orElse(false);
    }
}
