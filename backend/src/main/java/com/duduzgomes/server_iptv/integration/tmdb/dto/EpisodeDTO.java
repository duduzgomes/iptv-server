package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.duduzgomes.server_iptv.domain.vod.VodStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record EpisodeDTO(

    String id,

    @JsonProperty("episode_num")
    Integer episodeNum,

    String title,

    Integer season,

    @JsonProperty("container_extension")
    String containerExtension,

    @JsonProperty("vod_status")
    VodStatus vodStatus,

    EpisodeInfoDTO info
    
) {}