package com.duduzgomes.server_iptv.domain.vod;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.movie.MovieRepository;
import com.duduzgomes.server_iptv.domain.series.episode.EpisodeRepository;
import com.duduzgomes.server_iptv.domain.vod.dto.TranscodeCallbackDTO;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranscodeCallbackService {

    private final MovieRepository   movieRepository;
    private final EpisodeRepository episodeRepository;

    @Transactional
    public void processar(TranscodeCallbackDTO callback) {
        switch (callback.contentType()) {
            case "MOVIE"   -> processarFilme(callback);
            case "EPISODE" -> processarEpisodio(callback);
            default -> log.warn("ContentType desconhecido: {}", callback.contentType());
        }
    }

    private void processarFilme(TranscodeCallbackDTO callback) {
        var movie = movieRepository.findById(callback.contentId())
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));

        if (callback.success()) {
            movie.setVodStatus(VodStatus.READY);
            movie.setHlsPath(callback.hlsPath());
            log.info("Filme {} pronto — hlsPath: {}", callback.contentId(), callback.hlsPath());
        } else {
            movie.setVodStatus(VodStatus.ERROR);
            log.error("Erro na transcodificação do filme {}: {}",
                callback.contentId(), callback.errorMessage());
        }

        movieRepository.save(movie);
    }

    private void processarEpisodio(TranscodeCallbackDTO callback) {
        var episode = episodeRepository.findById(callback.contentId())
            .orElseThrow(() -> new NotFoundException("Episódio não encontrado"));

        if (callback.success()) {
            episode.setVodStatus(VodStatus.READY);
            episode.setHlsPath(callback.hlsPath());
            log.info("Episódio {} pronto — hlsPath: {}", callback.contentId(), callback.hlsPath());
        } else {
            episode.setVodStatus(VodStatus.ERROR);
            log.error("Erro na transcodificação do episódio {}: {}",
                callback.contentId(), callback.errorMessage());
        }

        episodeRepository.save(episode);
    }
}
