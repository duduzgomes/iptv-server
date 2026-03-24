package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record VodInfoDTO(

    @JsonProperty("movie_data")
    VodMovieDataDTO movieData,

    VodInfoDetailDTO info
) {}
