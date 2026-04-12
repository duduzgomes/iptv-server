package com.duduzgomes.server_iptv.domain.movie;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.category.CategoryRepository;
import com.duduzgomes.server_iptv.domain.category.ContentType;
import com.duduzgomes.server_iptv.integration.tmdb.TmdbService;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import com.duduzgomes.server_iptv.xtream.dto.CategoryDTO;
import com.duduzgomes.server_iptv.xtream.dto.VodInfoDTO;
import com.duduzgomes.server_iptv.xtream.dto.VodInfoDetailDTO;
import com.duduzgomes.server_iptv.xtream.dto.VodMovieDataDTO;
import com.duduzgomes.server_iptv.xtream.dto.VodStreamDTO;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final CategoryRepository categoryRepository;
    private final TmdbService tmdbService;

    public List<CategoryDTO> listarCategorias() {
        return categoryRepository
            .findByContentTypeAndActiveTrue(ContentType.VOD)
            .stream()
            .map(c -> CategoryDTO.builder()
                .categoryId(String.valueOf(c.getId()))
                .categoryName(c.getName())
                .parentId(0)
                .build())
            .toList();
    }

    public List<VodStreamDTO> listarFilmes() {
        return movieRepository.findByActiveTrueOrderByTitle()
            .stream()
            .map(this::toVodStreamDTO)
            .toList();
    }

    public Movie buscarPorId(Long id) {
        return movieRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));
    }

    public VodInfoDTO buscarInfo(Long movieId) {
        var movie = movieRepository.findById(movieId)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));

        var movieData = VodMovieDataDTO.builder()
            .streamId(movie.getId())
            .name(movie.getTitle())
            .added(toTimestamp(movie.getCreatedAt()))
            .categoryId(String.valueOf(movie.getCategory().getId()))
            .containerExtension("mp4")
            .customSid("")
            .directSource("")
            .build();

        // converte duração em minutos para segundos
        Integer durationSecs = movie.getDuration() != null
            ? movie.getDuration() * 60 : 0;

        // formata duração como "HH:MM:SS"
        String durationStr = movie.getDuration() != null
            ? String.format("%02d:%02d:%02d",
                movie.getDuration() / 60,
                movie.getDuration() % 60, 0)
            : "00:00:00";

        var info = VodInfoDetailDTO.builder()
            .name(movie.getTitle())
            .nameO(movie.getOriginalTitle())
            .plot(movie.getSynopsis())
            .description(movie.getSynopsis())
            .cast(movie.getCastMembers())
            .actors(movie.getCastMembers())
            .director(movie.getDirector())
            .genre(movie.getGenre())
            .rating(movie.getRating() != null ? movie.getRating().toString() : "0")
            .ratingMpaa("")
            .ratingCountKinopoisk(0)
            .imdbId("")
            .kinopoiskUrl("")
            .releasedate(movie.getYear() != null ? movie.getYear().toString() : "")
            .releaseDate(movie.getYear() != null ? movie.getYear().toString() : "")
            .youtubeTrailer("")
            .episodeRunTime("")
            .movieImage(movie.getPosterUrl())
            .coverBig(movie.getPosterUrl())
            .backdropPath(movie.getBackdropUrl() != null
                ? List.of(movie.getBackdropUrl()) : List.of())
            .durationSecs(durationSecs)
            .duration(durationStr)
            .bitrate(0)
            .age("")
            .country("")
            .audio("")
            .video("")
            .build();

        return VodInfoDTO.builder()
            .movieData(movieData)
            .info(info)
            .build();
    }

    @Transactional
    public Movie cadastrar(Long categoryId, Integer tmdbId) {

        movieRepository.findByTmdbId(tmdbId).ifPresent(m -> {
            throw new IllegalArgumentException("Filme já cadastrado");
        });

        var category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));

        var movie = Movie.builder()
            .tmdbId(tmdbId)
            .category(category)
            .filePath("")
            .title("Carregando...")
            .active(true)
            .build();

        movie = movieRepository.save(movie);

        tmdbService.enriquecerFilme(movie);
        return movieRepository.save(movie);
    }

    public List<Movie> listarEntidades() {
        return movieRepository.findByActiveTrueOrderByTitle();
    }

    @Transactional
    public void alterarStatus(Long id) {
        var movie = movieRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));
        movie.setActive(!movie.getActive());
        movieRepository.save(movie);
    }

    @Transactional
    public Movie sincronizarTmdb(Long id) {
        var movie = movieRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));
        tmdbService.enriquecerFilme(movie);
        return movieRepository.save(movie);
    }

    @Transactional
    public void excluir(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new NotFoundException("Filme não encontrado");
        }
        movieRepository.deleteById(id);
    }

    private VodStreamDTO toVodStreamDTO(Movie movie) {
        return VodStreamDTO.builder()
            .num((int) movie.getId().longValue())
            .name(movie.getTitle())
            .streamType("movie")
            .streamId(movie.getId())
            .streamIcon(movie.getPosterUrl())
            .categoryId(String.valueOf(movie.getCategory().getId()))
            .categoryIds(List.of(movie.getCategory().getId()))
            .containerExtension("mp4")
            .rating(movie.getRating() != null
                ? movie.getRating().toString()
                : "0")
            .added(toTimestamp(movie.getCreatedAt()))
            .tmdb(String.valueOf(movie.getTmdbId()))
            .build();
    }

    private String toTimestamp(java.time.LocalDateTime dt) {
        return String.valueOf(
            dt.atZone(ZoneId.of("America/Sao_Paulo")).toEpochSecond()
        );
    }
}
