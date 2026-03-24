package com.duduzgomes.server_iptv.xtream.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record VodInfoDetailDTO(
    String name,

    @JsonProperty("name_o")
    String nameO,

    String plot,
    String description,
    String cast,
    String actors,
    String director,
    String genre,
    String rating,

    @JsonProperty("rating_mpaa")
    String ratingMpaa,

    @JsonProperty("rating_count_kinopoisk")
    int ratingCountKinopoisk,

    @JsonProperty("imdb_id")
    String imdbId,

    @JsonProperty("kinopoisk_url")
    String kinopoiskUrl,

    @JsonProperty("releasedate")
    String releasedate,

    @JsonProperty("release_date")
    String releaseDate,

    @JsonProperty("youtube_trailer")
    String youtubeTrailer,

    @JsonProperty("episode_run_time")
    String episodeRunTime,

    @JsonProperty("movie_image")
    String movieImage,

    @JsonProperty("cover_big")
    String coverBig,

    @JsonProperty("backdrop_path")
    List<String> backdropPath,

    @JsonProperty("duration_secs")
    Integer durationSecs,

    String duration,

    Integer bitrate,
    String age,
    String country,
    String audio,
    String video
) {}