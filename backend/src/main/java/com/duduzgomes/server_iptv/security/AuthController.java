package com.duduzgomes.server_iptv.security;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.duduzgomes.server_iptv.domain.admin.AdminRepository;
import com.duduzgomes.server_iptv.security.dto.LoginRequestDTO;
import com.duduzgomes.server_iptv.security.dto.LoginResponseDTO;
import com.duduzgomes.server_iptv.shared.exception.UnauthorizedException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService      jwtService;

    @Value("${jwt.expiration:3600}")
    private long expiration;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
        @Valid @RequestBody LoginRequestDTO request
    ) {
        var admin = adminRepository.findByUsername(request.username())
            .orElseThrow(() -> new UnauthorizedException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.password(), admin.getPassword())) {
            throw new UnauthorizedException("Credenciais inválidas");
        }

        if (!admin.getActive()) {
            throw new UnauthorizedException("Conta suspensa");
        }

        String token = jwtService.gerar(admin);

        return ResponseEntity.ok(LoginResponseDTO.builder()
            .token(token)
            .username(admin.getUsername())
            .role(admin.getRole().name())
            .expiresIn(expiration)
            .build());
    }
}
