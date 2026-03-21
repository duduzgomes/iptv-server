package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record EpisodeDTO(

    String id,

    @JsonProperty("episode_num")
    Integer episodeNum,

    String title,

    @JsonProperty("container_extension")
    String containerExtension,

    Integer season,

    EpisodeInfoDTO info
) {}