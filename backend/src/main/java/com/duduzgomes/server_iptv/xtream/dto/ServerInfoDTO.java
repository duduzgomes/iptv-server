package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record ServerInfoDTO(

    String url,
    String port,

    @JsonProperty("https_port")
    String httpsPort,

    @JsonProperty("server_protocol")
    String serverProtocol,

    @JsonProperty("rtmp_port")
    String rtmpPort,

    String timestamp,
    String timezone,

    @JsonProperty("time_now")
    String timeNow
) {}
