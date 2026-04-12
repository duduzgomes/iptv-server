package com.duduzgomes.server_iptv.xtream;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import com.duduzgomes.server_iptv.domain.access.AccessContentType;
import com.duduzgomes.server_iptv.domain.access.AccessLogService;
import com.duduzgomes.server_iptv.domain.channel.ChannelRepository;
import com.duduzgomes.server_iptv.domain.movie.MovieRepository;
import com.duduzgomes.server_iptv.domain.series.episode.EpisodeRepository;
import com.duduzgomes.server_iptv.domain.user.User;
import com.duduzgomes.server_iptv.domain.vod.VodStatus;
import com.duduzgomes.server_iptv.security.JwtService;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequiredArgsConstructor
public class XtreamStreamController {

    private final XtreamAuthService  authService;
    private final ChannelRepository  channelRepository;
    private final MovieRepository    movieRepository;
    private final EpisodeRepository  episodeRepository;
    private final AccessLogService   accessLogService;
    private final JwtService         jwtService;

    @Value("${xtream.server.url}")
    private String serverUrl;

    // canal ao vivo
    @GetMapping("/live/{username}/{password}/{streamId}.{extension}")
    public ResponseEntity<Void> liveStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long streamId,
        @PathVariable String extension,
        HttpServletRequest request
    ) {
        User user = authService.autenticarRetornandoUsuario(username, password);

        var channel = channelRepository.findById(streamId)
            .orElseThrow(() -> new NotFoundException("Canal não encontrado"));

        if (!channel.getActive()) {
            throw new NotFoundException("Canal indisponível");
        }

        String clientIp = obterIp(request);

        // registra ou renova sessão
        accessLogService.registrarOuRenovarConexao(
            user,
            AccessContentType.LIVE,
            streamId,
            clientIp
        );

        // String token = jwtService.gerarStreamToken(String.valueOf(user.getId()), clientIp);

        String url = String.format("%s/hls/%s/master.m3u8?id=%s",
            serverUrl,
            channel.getStreamKey(),
            streamId
        );
            
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    // filme
    @GetMapping("/movie/{username}/{password}/{streamId}.{extension}")
    public ResponseEntity<Void> movieStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long streamId,
        @PathVariable String extension,
        HttpServletRequest request
    ) {
        var user = authService.autenticarRetornandoUsuario(username, password);

        var movie = movieRepository.findById(streamId)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));

        if (!movie.getActive()) {
            throw new NotFoundException("Filme indisponível");
        }

        // verifica se está pronto
        if (movie.getVodStatus() != VodStatus.READY) {
            throw new NotFoundException("Filme ainda não está disponível");
        }

        String clientIp = obterIp(request);

        // registra ou renova sessão
        accessLogService.registrarOuRenovarConexao(
            user,
            AccessContentType.MOVIE,
            streamId,
            clientIp
        );

        if(extension.equals("mp4")){

            String token = jwtService.gerarStreamToken(String.valueOf(user.getId()), clientIp);

            // redireciona pro HLS no MinIO via Nginx
            String url = String.format("%s/vod-mp4/%s?sjwt=%s&id=%s",
                serverUrl,
                movie.getMinioKey(),
                URLEncoder.encode(token, StandardCharsets.UTF_8),
                streamId
            );

            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(url))
                .build();
        }

        String token = jwtService.gerarStreamToken(String.valueOf(user.getId()), clientIp);

        // redireciona pro HLS no MinIO via Nginx
        String url = String.format("%s/vod-hls/%s/master.m3u8?sjwt=%s&id=%s",
            serverUrl,
            movie.getHlsPath(),
            URLEncoder.encode(token, StandardCharsets.UTF_8),
            streamId
        );

        return ResponseEntity
            .status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    // episódio de série
    @GetMapping("/series/{username}/{password}/{episodeId}.m3u8")
    public ResponseEntity<Void> seriesStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long episodeId,
        HttpServletRequest request
    ) {
        var user = authService.autenticarRetornandoUsuario(username, password);

        var episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new NotFoundException("Episódio não encontrado"));

        if (!episode.getActive()) {
            throw new NotFoundException("Episódio indisponível");
        }

        if (episode.getVodStatus() != VodStatus.READY) {
            throw new NotFoundException("Episódio ainda não está disponível");
        }

        if (episode.getHlsPath() == null) {
            throw new NotFoundException("Arquivo não disponível");
        }

        String clientIp = obterIp(request);

        // registra ou renova sessão
        accessLogService.registrarOuRenovarConexao(
            user,
            AccessContentType.EPISODE,
            episodeId,
            clientIp
        );

        String token = jwtService.gerarStreamToken(String.valueOf(user.getId()), clientIp);
        
        String url = String.format("%s/vod/%s/master.m3u8?sjwt=%s&id=%s",
            serverUrl,
            episode.getHlsPath(),
            URLEncoder.encode(token, StandardCharsets.UTF_8),
            episodeId
        );

        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    private String obterIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
