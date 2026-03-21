package com.duduzgomes.server_iptv.xtream;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import com.duduzgomes.server_iptv.domain.channel.ChannelRepository;
import com.duduzgomes.server_iptv.domain.movie.MovieRepository;
import com.duduzgomes.server_iptv.domain.series.episode.EpisodeRepository;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class XtreamStreamController {

    private final XtreamAuthService  authService;
    private final ChannelRepository  channelRepository;
    private final MovieRepository    movieRepository;
    private final EpisodeRepository  episodeRepository;

    @Value("${xtream.hls-base-url:http://localhost:8080/hls}")
    private String hlsBaseUrl;

    @Value("${xtream.files-base-url:http://localhost:8080/files}")
    private String filesBaseUrl;

    // canal ao vivo
    @GetMapping("/live/{username}/{password}/{streamId}.m3u8")
    public ResponseEntity<Void> liveStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long streamId
    ) {
        authService.autenticar(username, password);

        var channel = channelRepository.findById(streamId)
            .orElseThrow(() -> new NotFoundException("Canal não encontrado"));

        if (!channel.getActive()) {
            throw new NotFoundException("Canal indisponível");
        }

        // redireciona pro HLS gerado pelo FFmpeg
        String url = hlsBaseUrl + "/" + channel.getStreamKey() + "/master.m3u8";
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    // filme
    @GetMapping("/movie/{username}/{password}/{streamId}.mp4")
    public ResponseEntity<Void> movieStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long streamId
    ) {
        authService.autenticar(username, password);

        var movie = movieRepository.findById(streamId)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));

        if (!movie.getActive()) {
            throw new NotFoundException("Filme indisponível");
        }

        // redireciona pro arquivo no disco via Nginx
        String url = filesBaseUrl + movie.getFilePath();
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }

    // episódio de série
    @GetMapping("/series/{username}/{password}/{episodeId}.mp4")
    public ResponseEntity<Void> seriesStream(
        @PathVariable String username,
        @PathVariable String password,
        @PathVariable Long episodeId
    ) {
        authService.autenticar(username, password);

        var episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new NotFoundException("Episódio não encontrado"));

        if (!episode.getActive()) {
            throw new NotFoundException("Episódio indisponível");
        }

        if (episode.getFilePath() == null) {
            throw new NotFoundException("Arquivo não disponível");
        }

        String url = filesBaseUrl + episode.getFilePath();
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url))
            .build();
    }
}
