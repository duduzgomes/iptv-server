package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import java.util.List;

@Builder
public record LiveStreamDTO(

    int num,
    String name,

    @JsonProperty("stream_type")
    String streamType,

    @JsonProperty("stream_id")
    Long streamId,

    @JsonProperty("stream_icon")
    String streamIcon,

    @JsonProperty("epg_channel_id")
    String epgChannelId,

    String added,

    @JsonProperty("category_id")
    String categoryId,

    @JsonProperty("category_ids")
    List<Long> categoryIds,

    @JsonProperty("tv_archive")
    int tvArchive,

    @JsonProperty("tv_archive_duration")
    int tvArchiveDuration,

    @JsonProperty("custom_sid")
    String customSid,

    @JsonProperty("direct_source")
    String directSource,

    String thumbnail
) {}
