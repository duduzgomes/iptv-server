package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record VodMovieDataDTO(
    @JsonProperty("stream_id")
    Long streamId,

    String name,
    String added,

    @JsonProperty("category_id")
    String categoryId,

    @JsonProperty("container_extension")
    String containerExtension,

    @JsonProperty("custom_sid")
    String customSid,

    @JsonProperty("direct_source")
    String directSource
) {}
