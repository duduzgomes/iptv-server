package com.duduzgomes.server_iptv.domain.series;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.category.CategoryRepository;
import com.duduzgomes.server_iptv.domain.category.ContentType;
import com.duduzgomes.server_iptv.domain.series.episode.Episode;
import com.duduzgomes.server_iptv.domain.series.episode.EpisodeRepository;
import com.duduzgomes.server_iptv.domain.series.season.Season;
import com.duduzgomes.server_iptv.domain.series.season.SeasonRepository;
import com.duduzgomes.server_iptv.integration.tmdb.TmdbService;
import com.duduzgomes.server_iptv.integration.tmdb.dto.EpisodeDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.EpisodeInfoDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.SeriesDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.SeriesInfoDTO;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import com.duduzgomes.server_iptv.xtream.dto.CategoryDTO;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SeriesService {

    private final SeriesRepository     seriesRepository;
    private final SeasonRepository     seasonRepository;
    private final EpisodeRepository    episodeRepository;
    private final CategoryRepository   categoryRepository;
    private final TmdbService          tmdbService;

    public List<CategoryDTO> listarCategorias() {
        return categoryRepository
            .findByContentTypeAndActiveTrue(ContentType.SERIES)
            .stream()
            .map(c -> CategoryDTO.builder()
                .categoryId(String.valueOf(c.getId()))
                .categoryName(c.getName())
                .parentId(0)
                .build())
            .toList();
    }

    public List<SeriesDTO> listarSeries() {
        return seriesRepository.findByActiveTrueOrderByTitle()
            .stream()
            .map(this::toSeriesDTO)
            .toList();
    }

    public SeriesInfoDTO buscarInfo(Long seriesId) {
        Series series = seriesRepository.findById(seriesId)
            .orElseThrow(() -> new NotFoundException("Série não encontrada"));

        List<Season> seasons = seasonRepository.findBySeriesIdOrderByNumber(seriesId);

        // monta mapa temporada → lista de episódios
        Map<String, List<EpisodeDTO>> episodeMap = new LinkedHashMap<>();
        for (Season season : seasons) {
            List<EpisodeDTO> eps = episodeRepository
                .findBySeasonIdOrderByNumber(season.getId())
                .stream()
                .map(e -> toEpisodeDTO(e, season.getNumber()))
                .toList();
            episodeMap.put(String.valueOf(season.getNumber()), eps);
        }

        return SeriesInfoDTO.builder()
            .info(toSeriesDTO(series))
            .episodes(episodeMap)
            .build();
    }

    @Transactional
    public Series cadastrar(Long categoryId, Integer tmdbId) {
        seriesRepository.findByTmdbId(tmdbId).ifPresent(s -> {
            throw new IllegalArgumentException("Série já cadastrada");
        });

        var category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));

        var series = Series.builder()
            .tmdbId(tmdbId)
            .category(category)
            .title("Carregando...")
            .active(true)
            .build();

        series = seriesRepository.save(series);

        // listas que o TmdbService vai preencher
        List<Season>  seasons  = new ArrayList<>();
        List<Episode> episodes = new ArrayList<>();

        tmdbService.enriquecerSerie(series, seasons, episodes);

        series = seriesRepository.save(series);

        // salva temporadas e episódios
        seasonRepository.saveAll(seasons);
        episodeRepository.saveAll(episodes);

        return series;
    }

    private SeriesDTO toSeriesDTO(Series series) {
        return SeriesDTO.builder()
            .num(series.getId().intValue())
            .name(series.getTitle())
            .seriesId(series.getId())
            .streamType("series")
            .cover(series.getPosterUrl())
            .plot(series.getSynopsis())
            .cast(series.getCastMembers())
            .genre(series.getGenre())
            .rating(series.getRating() != null
                ? series.getRating().toString() : "0")
            .rating5based(series.getRating() != null
                ? series.getRating().doubleValue() / 2 : 0)
            .backdropPath(series.getBackdropUrl() != null
                ? List.of(series.getBackdropUrl()) : List.of())
            .categoryId(String.valueOf(series.getCategory().getId()))
            .categoryIds(List.of(series.getCategory().getId()))
            .lastModified(series.getUpdatedAt() != null
                ? String.valueOf(series.getUpdatedAt()
                    .atZone(java.time.ZoneId.of("America/Sao_Paulo"))
                    .toEpochSecond()) : "0")
            .build();
    }

    private EpisodeDTO toEpisodeDTO(Episode episode, Integer seasonNumber) {
        return EpisodeDTO.builder()
            .id(String.valueOf(episode.getId()))
            .episodeNum(episode.getNumber())
            .title(episode.getTitle())
            .containerExtension("mp4")
            .season(seasonNumber)
            .info(EpisodeInfoDTO.builder()
                .plot(episode.getSynopsis())
                .duration(episode.getDuration() != null
                    ? episode.getDuration() + ":00" : "0")
                .movieImage(episode.getPosterUrl())
                .releaseDate(episode.getAirDate() != null
                    ? episode.getAirDate().toString() : null)
                .build())
            .build();
    }
}
