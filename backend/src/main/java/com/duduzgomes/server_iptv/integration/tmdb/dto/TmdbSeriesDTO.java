package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record TmdbSeriesDTO(
    Integer id,
    String name,
    String overview,
    String status,

    @JsonProperty("created_by")
    List<TmdbCreatedByDTO> createdBy,

    @JsonProperty("vote_average")
    Double voteAverage,

    @JsonProperty("poster_path")
    String posterPath,

    @JsonProperty("backdrop_path")
    String backdropPath,

    @JsonProperty("first_air_date")
    String firstAirDate,

    @JsonProperty("number_of_seasons")
    Integer numberOfSeasons,

    List<TmdbGenreDTO> genres,

    List<TmdbSeasonSummaryDTO> seasons
) {}
