package com.duduzgomes.server_iptv.domain.user;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record UserResponseDTO(
    Long          id,
    String        username,
    String        password,   
    Integer       maxConnections,
    Boolean       active,
    LocalDateTime expiresAt,
    String        createdBy,  
    LocalDateTime createdAt
) {}
