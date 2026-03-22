package com.duduzgomes.ffmpeg_service.dto;

public record TranscodeRequestDTO(
    Long   contentId,
    String contentType,  // MOVIE ou EPISODE
    String inputUrl,     // URL temporária do MinIO
    String outputPath    // onde salvar os segmentos ex: filmes/1
) {}
