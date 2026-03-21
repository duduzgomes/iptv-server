package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.util.List;

@Builder
public record UserInfoDTO(

    String username,
    String password,
    String status,

    @JsonProperty("exp_date")
    String expDate,

    @JsonProperty("max_connections")
    String maxConnections,

    @JsonProperty("active_cons")
    String activeCons,

    @JsonProperty("created_at")
    String createdAt,

    @JsonProperty("is_trial")
    String isTrial,

    @JsonProperty("allowed_output_formats")
    List<String> allowedOutputFormats
) {}
