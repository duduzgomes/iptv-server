package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record TmdbSeasonDetailDTO(
    Integer id,

    @JsonProperty("season_number")
    Integer seasonNumber,

    String name,
    
    String overview,

    @JsonProperty("poster_path")
    String posterPath,

    List<TmdbEpisodeDTO> episodes
) {}
