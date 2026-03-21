package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record TmdbMovieDTO(
    Integer id,
    String title,

    @JsonProperty("original_title")
    String originalTitle,

    String overview,

    @JsonProperty("release_date")
    String releaseDate,

    @JsonProperty("vote_average")
    Double voteAverage,

    @JsonProperty("poster_path")
    String posterPath,

    @JsonProperty("backdrop_path")
    String backdropPath,

    Integer runtime,

    List<TmdbGenreDTO> genres
) {}
