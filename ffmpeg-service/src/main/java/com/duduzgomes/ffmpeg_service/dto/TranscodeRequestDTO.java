package com.duduzgomes.ffmpeg_service.dto;

public record TranscodeRequestDTO(
    Long   contentId,
    String contentType, 
    String inputPath, 
    String outputPath 
) {}
