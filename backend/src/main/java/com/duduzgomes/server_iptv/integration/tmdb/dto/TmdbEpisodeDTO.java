package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmdbEpisodeDTO(
    Integer id,

    @JsonProperty("episode_number")
    Integer episodeNumber,

    String name,
    String overview,

    @JsonProperty("still_path")
    String stillPath,

    @JsonProperty("runtime")
    Integer runtime,

    @JsonProperty("air_date")
    String airDate
) {}
