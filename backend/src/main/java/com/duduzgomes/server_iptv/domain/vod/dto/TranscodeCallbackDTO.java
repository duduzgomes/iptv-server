package com.duduzgomes.server_iptv.domain.vod.dto;

public record TranscodeCallbackDTO(
    Long    contentId,
    String  contentType,
    String  hlsPath,
    boolean success,
    String  errorMessage
) {}