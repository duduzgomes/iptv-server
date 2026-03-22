package com.duduzgomes.server_iptv.integration.tmdb;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.movie.Movie;
import com.duduzgomes.server_iptv.domain.series.Series;
import com.duduzgomes.server_iptv.domain.series.episode.Episode;
import com.duduzgomes.server_iptv.domain.series.season.Season;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbCreditsDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbEpisodeDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbMovieDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeasonDetailDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeasonSummaryDTO;
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

    public void enriquecerSerie(Series series,List<Season> seasons,List<Episode> episodes) {
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
        if (credits.cast() != null) {
            series.setCastMembers(credits.cast().stream()
                .limit(5)
                .map(c -> c.name())
                .collect(Collectors.joining(", ")));
        }
        series.setTmdbUpdatedAt(LocalDateTime.now());

        // busca episódios de cada temporada
        if (tmdbSeries.seasons() != null) {
            for (TmdbSeasonSummaryDTO s : tmdbSeries.seasons()) {

                // ignora temporada 0 (extras/especiais)
                if (s.seasonNumber() == 0) continue;

                TmdbSeasonDetailDTO detail =
                    tmdbClient.buscarTemporada(series.getTmdbId(), s.seasonNumber());

                Season season = Season.builder()
                    .series(series)
                    .tmdbId(detail.id())
                    .number(detail.seasonNumber())
                    .title(detail.name())
                    .synopsis(detail.overview())
                    .posterUrl(detail.posterPath() != null
                        ? imageBaseUrl + detail.posterPath() : null)
                    .build();

                seasons.add(season);

                // episódios da temporada
                if (detail.episodes() != null) {
                    for (TmdbEpisodeDTO e : detail.episodes()) {
                        LocalDate airDate = null;
                        if (e.airDate() != null && !e.airDate().isBlank()) {
                            airDate = LocalDate.parse(e.airDate());
                        }

                        Episode episode = Episode.builder()
                            .season(season)
                            .tmdbId(e.id())
                            .number(e.episodeNumber())
                            .title(e.name())
                            .synopsis(e.overview())
                            .posterUrl(e.stillPath() != null
                                ? imageBaseUrl + e.stillPath() : null)
                            .duration(e.runtime())
                            .airDate(airDate)
                            .filePath(null)
                            .active(true)
                            .build();

                        episodes.add(episode);
                    }
                }
            }
        }
    }
}
