package com.duduzgomes.server_iptv.xtream;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.access.AccessLogRepository;
import com.duduzgomes.server_iptv.domain.user.User;
import com.duduzgomes.server_iptv.domain.user.UserRepository;
import com.duduzgomes.server_iptv.shared.exception.UnauthorizedException;
import com.duduzgomes.server_iptv.xtream.dto.AuthResponseDTO;
import com.duduzgomes.server_iptv.xtream.dto.ServerInfoDTO;
import com.duduzgomes.server_iptv.xtream.dto.UserInfoDTO;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class XtreamAuthService {

    private final UserRepository userRepository;
    private final AccessLogRepository accessLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${xtream.server.url}")
    private String serverUrl;

    @Value("${xtream.server.port}")
    private String serverPort;

    @Value("${xtream.server.https-port}")
    private String httpsPort;

    @Value("${xtream.server.protocol}")
    private String serverProtocol;

    @Value("${xtream.server.rtmp-port}")
    private String rtmpPort;

    @Value("${xtream.server.timezone}")
    private String timezone;

    public AuthResponseDTO autenticar(String username, String password) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Senha inválida");
        }

        if (!user.getActive()) {
            throw new UnauthorizedException("Conta suspensa");
        }

        if (user.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Conta expirada");
        }

        int activeConnections = accessLogRepository.countActiveByUserId(user.getId());
        if (activeConnections >= user.getMaxConnections()) {
            throw new UnauthorizedException("Limite de conexões atingido");
        }

        return buildResponse(user, activeConnections);
    }

    private AuthResponseDTO buildResponse(User user, int activeConnections) {
        var now = LocalDateTime.now(ZoneId.of(timezone));
        var formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        var userInfo = UserInfoDTO.builder()
            .username(user.getUsername())
            .password("")
            .status("Active")
            .expDate(toTimestamp(user.getExpiresAt()))
            .maxConnections(String.valueOf(user.getMaxConnections()))
            .activeCons(String.valueOf(activeConnections))
            .createdAt(toTimestamp(user.getCreatedAt()))
            .isTrial("0")
            .allowedOutputFormats(List.of("m3u8", "ts"))
            .build();

        var serverInfo = ServerInfoDTO.builder()
            .url(serverUrl)
            .port(serverPort)
            .httpsPort(httpsPort)
            .serverProtocol(serverProtocol)
            .rtmpPort(rtmpPort)
            .timestamp(toTimestamp(now))
            .timezone(timezone)
            .timeNow(now.format(formatter))
            .build();

        return AuthResponseDTO.builder()
            .userInfo(userInfo)
            .serverInfo(serverInfo)
            .build();
    }

    private String toTimestamp(LocalDateTime dateTime) {
        return String.valueOf(
            dateTime.atZone(ZoneId.of(timezone)).toEpochSecond()
        );
    }
}
