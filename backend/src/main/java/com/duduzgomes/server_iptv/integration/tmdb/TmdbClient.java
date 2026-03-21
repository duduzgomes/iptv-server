package com.duduzgomes.server_iptv.integration.tmdb;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbCreditsDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbMovieDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeasonDetailDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeriesDTO;

@Slf4j
@Component
@RequiredArgsConstructor
public class TmdbClient {

    private final RestClient restClient;

    @Value("${tmdb.api-key}")
    private String apiKey;

    @Value("${tmdb.base-url}")
    private String baseUrl;

    @Value("${tmdb.language}")
    private String language;

    public TmdbMovieDTO buscarFilme(Integer tmdbId) {
        log.info("Buscando filme no TMDB: {}", tmdbId);
        return restClient.get()
            .uri("{baseUrl}/movie/{id}?api_key={key}&language={lang}",
                baseUrl, tmdbId, apiKey, language)
            .retrieve()
            .body(TmdbMovieDTO.class);
    }

    public TmdbCreditsDTO buscarCreditos(Integer tmdbId) {
        log.info("Buscando créditos no TMDB: {}", tmdbId);
        return restClient.get()
            .uri("{baseUrl}/movie/{id}/credits?api_key={key}&language={lang}",
                baseUrl, tmdbId, apiKey, language)
            .retrieve()
            .body(TmdbCreditsDTO.class);
    }

    public TmdbSeriesDTO buscarSerie(Integer tmdbId) {
    log.info("Buscando série no TMDB: {}", tmdbId);
    return restClient.get()
        .uri("{baseUrl}/tv/{id}?api_key={key}&language={lang}",
            baseUrl, tmdbId, apiKey, language)
        .retrieve()
        .body(TmdbSeriesDTO.class);
}

    public TmdbSeasonDetailDTO buscarTemporada(Integer seriesTmdbId, Integer seasonNumber) {
        log.info("Buscando temporada {}/{} no TMDB", seriesTmdbId, seasonNumber);
        return restClient.get()
            .uri("{baseUrl}/tv/{id}/season/{season}?api_key={key}&language={lang}",
                baseUrl, seriesTmdbId, seasonNumber, apiKey, language)
            .retrieve()
            .body(TmdbSeasonDetailDTO.class);
    }

    public TmdbCreditsDTO buscarCreditosSerie(Integer tmdbId) {
        log.info("Buscando créditos da série no TMDB: {}", tmdbId);
        return restClient.get()
            .uri("{baseUrl}/tv/{id}/credits?api_key={key}&language={lang}",
                baseUrl, tmdbId, apiKey, language)
            .retrieve()
            .body(TmdbCreditsDTO.class);
    }
}
