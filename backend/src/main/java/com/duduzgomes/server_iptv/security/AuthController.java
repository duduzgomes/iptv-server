package com.duduzgomes.server_iptv.security;


import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
        @Valid @RequestBody LoginRequestDTO request,
        HttpServletResponse response
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

        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
            .httpOnly(true)
            .path("/")
            .maxAge(expiration)
            .sameSite("Lax")
            .secure(true)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(LoginResponseDTO.builder()
            .token(token)
            .username(admin.getUsername())
            .role(admin.getRole().name())
            .expiresIn(expiration)
            .build());
    }

    @GetMapping("/me")
    public ResponseEntity<AdminInfoDTO> me(Authentication authentication) {
        String username = authentication.getName();

        String role = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(auth -> auth.startsWith("ROLE_")) 
            .findFirst()
            .orElse("USER");
            
        return ResponseEntity.ok(new AdminInfoDTO(username, role));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("auth_token", "")
            .httpOnly(true)
            .path("/")
            .maxAge(0)
            .sameSite("Lax")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.noContent().build();
    }

    public record AdminInfoDTO(String username, String role) {}
}
