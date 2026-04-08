package com.duduzgomes.server_iptv.domain.channel;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.category.Category;
import com.duduzgomes.server_iptv.domain.category.CategoryRepository;
import com.duduzgomes.server_iptv.domain.category.ContentType;
import com.duduzgomes.server_iptv.integration.live.ILiveStreamManager;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import com.duduzgomes.server_iptv.xtream.dto.CategoryDTO;
import com.duduzgomes.server_iptv.xtream.dto.LiveStreamDTO;
import jakarta.transaction.Transactional;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final CategoryRepository categoryRepository;
    private final ILiveStreamManager liveStreamManager;

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

    public List<Channel> listarEntidades() {
        return channelRepository.findByActiveTrueOrderByNum();
    }

    @Transactional
    public Channel criar(Long categoryId, String name, String logoUrl,
                        String sourceUrl, String streamKey,
                        String epgChannelId) {

        var category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
        
        int num = channelRepository.findMaxNum() + 1;

        Channel canal =  channelRepository.save(Channel.builder()
            .name(name)
            .category(category)
            .logoUrl(logoUrl)
            .sourceUrl(sourceUrl)
            .streamKey(streamKey)
            .epgChannelId(epgChannelId)
            .num(num)
            .active(true)
            .build());

        liveStreamManager.iniciarCanal(canal.getId(), canal.getStreamKey(), canal.getSourceUrl());

        return canal;
    }

    @Transactional
    public Channel editar(Long id, String name, String logoUrl,
                        String sourceUrl, String epgChannelId) {
        var channel = channelRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Canal não encontrado"));

        channel.setName(name);
        channel.setLogoUrl(logoUrl);
        channel.setSourceUrl(sourceUrl);
        channel.setEpgChannelId(epgChannelId);
        channel.setNum(channel.getNum());
        return channelRepository.save(channel);
    }

    @Transactional
    public void alterarStatus(Long id, boolean active) {
        var canal = channelRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Canal não encontrado"));
        canal.setActive(active);
        channelRepository.save(canal);

        if (active){
            liveStreamManager.iniciarCanal(canal.getId(), canal.getStreamKey(), canal.getSourceUrl());
            return;
        }

        liveStreamManager.pararCanal(id);
    }

    @Transactional
    public void excluir(Long id) {
        if (!channelRepository.existsById(id)) {
            throw new NotFoundException("Canal não encontrado");
        }
        channelRepository.deleteById(id);
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
