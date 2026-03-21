package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import java.util.List;

@Builder
public record VodStreamDTO(

    int num,
    String name,

    @JsonProperty("stream_type")
    String streamType,

    @JsonProperty("stream_id")
    Long streamId,

    @JsonProperty("stream_icon")
    String streamIcon,

    @JsonProperty("category_id")
    String categoryId,

    @JsonProperty("category_ids")
    List<Long> categoryIds,

    String rating,
    String added,
    String tmdb
) {}
