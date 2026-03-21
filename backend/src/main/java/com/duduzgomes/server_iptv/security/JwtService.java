package com.duduzgomes.server_iptv.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.admin.Admin;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtEncoder jwtEncoder;

    @Value("${jwt.expiration:3600}")
    private long expiration;

    public String gerar(Admin admin) {
        var now = Instant.now();

        var claims = JwtClaimsSet.builder()
            .issuer("iptv-server")
            .subject(admin.getUsername())
            .claim("role", admin.getRole().name())
            .claim("adminId", admin.getId())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expiration))
            .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims))
            .getTokenValue();
    }
}
