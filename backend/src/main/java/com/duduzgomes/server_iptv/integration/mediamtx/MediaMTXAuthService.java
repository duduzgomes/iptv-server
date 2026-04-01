package com.duduzgomes.server_iptv.integration.mediamtx;

import org.springframework.stereotype.Service;

import com.duduzgomes.server_iptv.domain.channel.ChannelRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MediaMTXAuthService {

    private final ChannelRepository channelRepository;

    public boolean autorizar(MediaMTXAuthDTO dto) {
        if (!"publish".equals(dto.action())) return true;

        if (dto.path() == null || !dto.path().startsWith("live/")) return false;

        String streamKey = dto.path().substring("live/".length());
        if (streamKey.isBlank()) return false;

        return channelRepository.existsByStreamKeyAndActiveTrue(streamKey);
    }
}
