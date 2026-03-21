package com.duduzgomes.server_iptv.domain.movie;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.category.CategoryRepository;
import com.duduzgomes.server_iptv.domain.category.ContentType;
import com.duduzgomes.server_iptv.integration.tmdb.TmdbService;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import com.duduzgomes.server_iptv.xtream.dto.CategoryDTO;
import com.duduzgomes.server_iptv.xtream.dto.VodStreamDTO;
import java.time.ZoneId;
import java.util.List;

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

    @Transactional
    public Movie cadastrar(Long categoryId, Integer tmdbId, String filePath) {
        movieRepository.findByTmdbId(tmdbId).ifPresent(m -> {
            throw new IllegalArgumentException("Filme já cadastrado");
        });

        var category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));

        var movie = Movie.builder()
            .tmdbId(tmdbId)
            .category(category)
            .filePath(filePath)
            .title("Carregando...")
            .active(true)
            .build();

        movie = movieRepository.save(movie);
        tmdbService.enriquecerFilme(movie);

        return movieRepository.save(movie);
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
