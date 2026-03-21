package com.duduzgomes.server_iptv.integration.tmdb;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.movie.Movie;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbCreditsDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbMovieDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

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
}
