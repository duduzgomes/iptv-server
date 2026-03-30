package com.duduzgomes.server_iptv.domain.admin.dto;

import java.time.LocalDateTime;
import com.duduzgomes.server_iptv.domain.admin.AdminRole;
import lombok.Builder;

@Builder
public record AdminResponse(
    Long id,
	String username,
	String email,
	AdminRole role,
	boolean active,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {}
