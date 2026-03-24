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

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.net.URI;

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

    @Value("${server.url:http://localhost}")
    private String serverUrl;

    // canal ao vivo
    @GetMapping("/live/{username}/{password}/{streamId}.m3u8")
    public ResponseEntity<Void> liveStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long streamId,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        User user = authService.autenticarRetornandoUsuario(username, password);

        var channel = channelRepository.findById(streamId)
            .orElseThrow(() -> new NotFoundException("Canal não encontrado"));

        if (!channel.getActive()) {
            throw new NotFoundException("Canal indisponível");
        }

        // registra ou renova sessão
        accessLogService.registrarOuRenovarConexao(
            user,
            AccessContentType.LIVE,
            streamId,
            request.getRemoteAddr(),
            request.getHeader("User-Agent")
        );

        definirCookieStreaming(user, response);

        String url = serverUrl + "/" + channel.getStreamKey() + "/master.m3u8";
    
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    // filme
    @GetMapping("/movie/{username}/{password}/{streamId}.mp4")
    public ResponseEntity<Void> movieStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long streamId,
        HttpServletRequest request,
        HttpServletResponse response
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

        accessLogService.registrarOuRenovarConexao(
            user, AccessContentType.MOVIE, streamId,
            request.getRemoteAddr(),
            request.getHeader("User-Agent")
        );

        definirCookieStreaming(user, response);

        // redireciona pro HLS no MinIO via Nginx
        String url = serverUrl + "/vod/" + movie.getHlsPath() + "/master.m3u8";
        log.info("url redirecionada minio :" + url );
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    // episódio de série
    @GetMapping("/series/{username}/{password}/{episodeId}.mp4")
    public ResponseEntity<Void> seriesStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long episodeId,
        HttpServletRequest request,
        HttpServletResponse response
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

        accessLogService.registrarOuRenovarConexao(
            user, AccessContentType.EPISODE, episodeId,
            request.getRemoteAddr(),
            request.getHeader("User-Agent")
        );

        definirCookieStreaming(user, response);

        String url = "/vod/" + episode.getHlsPath() + "/master.m3u8";
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    private void definirCookieStreaming(User user, HttpServletResponse response) {
        String token = jwtService.gerarStreamToken(user.getId());
        Cookie cookie = new Cookie("stream_token", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/vod");
        cookie.setMaxAge(4 * 3600);
        response.addCookie(cookie);
    }
}
