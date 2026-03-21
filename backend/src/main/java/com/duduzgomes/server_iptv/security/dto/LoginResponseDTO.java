package com.duduzgomes.server_iptv.security.dto;

import lombok.Builder;

@Builder
public record LoginResponseDTO(
    String token,
    String username,
    String role,
    long expiresIn
) {}
