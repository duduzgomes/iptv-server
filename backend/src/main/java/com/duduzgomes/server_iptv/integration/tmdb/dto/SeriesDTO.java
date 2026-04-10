package com.duduzgomes.server_iptv.integration.tmdb.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import java.util.List;

@Builder
public record SeriesDTO(

    int num,
    String name,

    @JsonProperty("series_id")
    Long seriesId,

    @JsonProperty("stream_type")
    String streamType,

    String cover,
    String plot,
    String cast,
    String director,
    String genre,

    @JsonProperty("release_date")
    String releaseDate,

    @JsonProperty("last_modified")
    String lastModified,

    @JsonProperty("tmdb_id")
    Integer tmbdId,

    String rating,

    @JsonProperty("rating_5based")
    Double rating5based,

    @JsonProperty("backdrop_path")
    List<String> backdropPath,

    @JsonProperty("youtube_trailer")
    String youtubeTrailer,

    @JsonProperty("episode_run_time")
    String episodeRunTime,

    @JsonProperty("category_id")
    String categoryId,

    @JsonProperty("category_ids")
    List<Long> categoryIds
) {}
