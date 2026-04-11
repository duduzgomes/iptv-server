package com.duduzgomes.server_iptv.integration.tmdb;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.movie.Movie;
import com.duduzgomes.server_iptv.domain.series.Series;
import com.duduzgomes.server_iptv.domain.series.episode.Episode;
import com.duduzgomes.server_iptv.domain.series.season.Season;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbCreatedByDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbCreditsDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbEpisodeDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbMovieDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeasonDetailDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeriesDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TmdbService {

    private final TmdbClient tmdbClient;

    @Value("${tmdb.image-base-url:https://image.tmdb.org/t/p/w500}")
    private String imageBaseUrl;

    @Value("${tmdb.backdrop-base-url:https://image.tmdb.org/t/p/w1280}")
    private String backdropBaseUrl;

    public void enriquecerFilme(Movie movie) {
        TmdbMovieDTO tmdbMovie = tmdbClient.buscarFilme(movie.getTmdbId());
        TmdbCreditsDTO credits = tmdbClient.buscarCreditos(movie.getTmdbId());

        movie.setTitle(tmdbMovie.title());
        movie.setOriginalTitle(tmdbMovie.originalTitle());
        movie.setSynopsis(tmdbMovie.overview());
        movie.setDuration(tmdbMovie.runtime());
        movie.setRating(tmdbMovie.voteAverage() != null
            ? BigDecimal.valueOf(tmdbMovie.voteAverage())
            : null);

        if (tmdbMovie.releaseDate() != null && !tmdbMovie.releaseDate().isBlank()) {
            movie.setYear(Integer.parseInt(tmdbMovie.releaseDate().substring(0, 4)));
        }
        if (tmdbMovie.genres() != null) {
            movie.setGenre(tmdbMovie.genres().stream()
                .map(g -> g.name())
                .collect(Collectors.joining(", ")));
        }

        if (tmdbMovie.posterPath() != null) {
            movie.setPosterUrl(imageBaseUrl + tmdbMovie.posterPath());
        }
        if (tmdbMovie.backdropPath() != null) {
            movie.setBackdropUrl(backdropBaseUrl + tmdbMovie.backdropPath());
        }

        if (credits.cast() != null) {
            movie.setCastMembers(credits.cast().stream()
                .sorted((a, b) -> Integer.compare(a.order(), b.order()))
                .limit(5)
                .map(c -> c.name())
                .collect(Collectors.joining(", ")));
        }

        if (credits.crew() != null) {
            credits.crew().stream()
                .filter(c -> "Director".equals(c.job()))
                .findFirst()
                .ifPresent(d -> movie.setDirector(d.name()));
        }

        movie.setTmdbUpdatedAt(LocalDateTime.now());
    }

    public void enriquecerSerie(Series series) {
        TmdbSeriesDTO tmdbSeries = tmdbClient.buscarSerie(series.getTmdbId());
        TmdbCreditsDTO credits   = tmdbClient.buscarCreditosSerie(series.getTmdbId());

        // metadados da série
        series.setTitle(tmdbSeries.name());
        series.setSynopsis(tmdbSeries.overview());
        series.setStatus(tmdbSeries.status());

        if (tmdbSeries.voteAverage() != null) {
            series.setRating(BigDecimal.valueOf(tmdbSeries.voteAverage()));
        }
        if (tmdbSeries.posterPath() != null) {
            series.setPosterUrl(imageBaseUrl + tmdbSeries.posterPath());
        }
        if (tmdbSeries.backdropPath() != null) {
            series.setBackdropUrl(backdropBaseUrl + tmdbSeries.backdropPath());
        }
        if (tmdbSeries.genres() != null) {
            series.setGenre(tmdbSeries.genres().stream()
                .map(g -> g.name())
                .collect(Collectors.joining(", ")));
        }
        if (tmdbSeries.firstAirDate() != null && !tmdbSeries.firstAirDate().isBlank()) {
            series.setYear(Integer.parseInt(tmdbSeries.firstAirDate().substring(0, 4)));
        }
        if (credits.cast() != null) {
            series.setCastMembers(credits.cast().stream()
                .limit(5)
                .map(c -> c.name())
                .collect(Collectors.joining(", ")));
        }
        if (tmdbSeries.createdBy() != null && !tmdbSeries.createdBy().isEmpty()) {
            series.setDirector(tmdbSeries.createdBy().stream()
                .map(TmdbCreatedByDTO::name)
                .collect(Collectors.joining(", ")));
        }
        series.setTmdbUpdatedAt(LocalDateTime.now());
    }

    public void enriquecerTemporada(Season season, Integer seriesTmdbId) {
        TmdbSeasonDetailDTO tmdbTemporada = tmdbClient.buscarTemporada(seriesTmdbId, season.getNumber());

        season.setTitle(tmdbTemporada.name());
        season.setSynopsis(tmdbTemporada.overview());
        season.setTmdbId(tmdbTemporada.id());
        if (tmdbTemporada.posterPath() != null) {
            season.setPosterUrl(imageBaseUrl + tmdbTemporada.posterPath());
        }
    }

    public void enriquecerEpisodio(Episode episode, Integer seriesTmdbId, Integer seasonNumber) {
        TmdbSeasonDetailDTO tmdbTemporada = tmdbClient.buscarTemporada(seriesTmdbId, seasonNumber);

        TmdbEpisodeDTO tmdbEpisodio = tmdbTemporada.episodes().stream()
            .filter(e -> e.episodeNumber().equals(episode.getNumber()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Episódio não encontrado no TMDB"));

        episode.setTitle(tmdbEpisodio.name());
        episode.setSynopsis(tmdbEpisodio.overview());
        episode.setDuration(tmdbEpisodio.runtime());
        episode.setTmdbId(tmdbEpisodio.id());

        if (tmdbEpisodio.stillPath() != null) {
            episode.setPosterUrl(imageBaseUrl + tmdbEpisodio.stillPath());
        }
        if (tmdbEpisodio.airDate() != null && !tmdbEpisodio.airDate().isBlank()) {
            episode.setAirDate(LocalDate.parse(tmdbEpisodio.airDate()));
        }
    }

    public List<TmdbSeasonDetailDTO> buscarTodasTemporadas(Series series) {
        TmdbSeriesDTO tmdbSeries = tmdbClient.buscarSerie(series.getTmdbId());

        return tmdbSeries.seasons().stream()
            .filter(s -> s.seasonNumber() != null && s.seasonNumber() > 0)
            .map(s -> tmdbClient.buscarTemporada(series.getTmdbId(), s.seasonNumber()))
            .toList();
    }
}
