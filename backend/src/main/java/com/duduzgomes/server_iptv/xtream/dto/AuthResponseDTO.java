package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record AuthResponseDTO(

    @JsonProperty("user_info")
    UserInfoDTO userInfo,

    @JsonProperty("server_info")
    ServerInfoDTO serverInfo
) {}
