package com.duduzgomes.ffmpeg_service.dto;

public record TranscodeCallbackDTO(
    Long    contentId,
    String  contentType,
    String  hlsPath,
    boolean success,
    String  errorMessage
) {}
