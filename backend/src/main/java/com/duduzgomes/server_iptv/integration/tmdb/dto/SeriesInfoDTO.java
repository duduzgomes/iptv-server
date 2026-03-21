package com.duduzgomes.server_iptv.integration.tmdb.dto;

import lombok.Builder;
import java.util.Map;
import java.util.List;

@Builder
public record SeriesInfoDTO(

    SeriesDTO info,
    // chave = número da temporada como String ("1", "2"...)
    Map<String, List<EpisodeDTO>> episodes
) {}
