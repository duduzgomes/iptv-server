package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record EpisodeInfoDTO(
    String plot,
    String duration,

    @JsonProperty("movie_image")
    String movieImage,

    @JsonProperty("release_date")
    String releaseDate
) {}
