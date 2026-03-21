package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmdbSeasonSummaryDTO(
    Integer id,

    @JsonProperty("season_number")
    Integer seasonNumber,

    String name,
    String overview,

    @JsonProperty("poster_path")
    String posterPath,

    @JsonProperty("air_date")
    String airDate,

    @JsonProperty("episode_count")
    Integer episodeCount
) {}
