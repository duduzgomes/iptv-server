package com.duduzgomes.server_iptv.xtream.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record CategoryDTO(

    @JsonProperty("category_id")
    String categoryId,

    @JsonProperty("category_name")
    String categoryName,

    @JsonProperty("parent_id")
    int parentId
) {}
