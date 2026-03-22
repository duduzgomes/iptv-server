package com.duduzgomes.server_iptv.domain.vod.dto;

import java.util.List;

public record ConcluirUploadRequestDTO(
    String       uploadId,
    List<String> etags
) {}