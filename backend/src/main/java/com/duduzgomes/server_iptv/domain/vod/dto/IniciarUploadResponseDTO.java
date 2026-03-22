package com.duduzgomes.server_iptv.domain.vod.dto;

import java.util.List;

public record IniciarUploadResponseDTO(
    String       uploadId,
    List<String> urls
) {}
