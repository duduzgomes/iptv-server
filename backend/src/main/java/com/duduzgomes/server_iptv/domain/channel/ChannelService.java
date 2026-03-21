package com.duduzgomes.server_iptv.domain.channel;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.category.Category;
import com.duduzgomes.server_iptv.domain.category.CategoryRepository;
import com.duduzgomes.server_iptv.domain.category.ContentType;
import com.duduzgomes.server_iptv.xtream.dto.CategoryDTO;
import com.duduzgomes.server_iptv.xtream.dto.LiveStreamDTO;

import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final CategoryRepository categoryRepository;

    public List<CategoryDTO> listarCategorias() {
        return categoryRepository
            .findByContentTypeAndActiveTrue(ContentType.LIVE)
            .stream()
            .map(this::toCategoryDTO)
            .toList();
    }

    public List<LiveStreamDTO> listarCanais() {
        return channelRepository
            .findByActiveTrueOrderByNum()
            .stream()
            .map(this::toLiveStreamDTO)
            .toList();
    }

    private CategoryDTO toCategoryDTO(Category category) {
        return CategoryDTO.builder()
            .categoryId(String.valueOf(category.getId()))
            .categoryName(category.getName())
            .parentId(0)
            .build();
    }

    private LiveStreamDTO toLiveStreamDTO(Channel channel) {
        return LiveStreamDTO.builder()
            .num(channel.getNum())
            .name(channel.getName())
            .streamType("live")
            .streamId(channel.getId())
            .streamIcon(channel.getLogoUrl())
            .epgChannelId(channel.getEpgChannelId())
            .added(toTimestamp(channel.getCreatedAt()))
            .categoryId(String.valueOf(channel.getCategory().getId()))
            .categoryIds(List.of(channel.getCategory().getId()))
            .tvArchive(0)
            .tvArchiveDuration(0)
            .customSid("")
            .directSource("")
            .thumbnail("")
            .build();
    }

    private String toTimestamp(java.time.LocalDateTime dateTime) {
        return String.valueOf(
            dateTime.atZone(ZoneId.of("America/Sao_Paulo")).toEpochSecond()
        );
    }
}
