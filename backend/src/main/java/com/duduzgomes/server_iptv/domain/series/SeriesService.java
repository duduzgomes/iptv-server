package com.duduzgomes.server_iptv.domain.series;


import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.category.CategoryRepository;
import com.duduzgomes.server_iptv.domain.category.ContentType;
import com.duduzgomes.server_iptv.domain.series.SeriesController.CadastrarEpisodioRequest;
import com.duduzgomes.server_iptv.domain.series.episode.Episode;
import com.duduzgomes.server_iptv.domain.series.episode.EpisodeRepository;
import com.duduzgomes.server_iptv.domain.series.season.Season;
import com.duduzgomes.server_iptv.domain.series.season.SeasonRepository;
import com.duduzgomes.server_iptv.domain.vod.VodStatus;
import com.duduzgomes.server_iptv.integration.tmdb.TmdbService;
import com.duduzgomes.server_iptv.integration.tmdb.dto.EpisodeDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.EpisodeInfoDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.SeriesDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.SeriesInfoDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeasonDetailDTO;
import com.duduzgomes.server_iptv.security.JwtService;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import com.duduzgomes.server_iptv.xtream.dto.CategoryDTO;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SeriesService {

    private final SeriesRepository     seriesRepository;
    private final SeasonRepository     seasonRepository;
    private final EpisodeRepository    episodeRepository;
    private final CategoryRepository   categoryRepository;
    private final TmdbService          tmdbService;
    private final JwtService           jwtService;

    @Value("${xtream.server.url}")
    private String serverUrl;

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
            .temporadas(episodeMap)
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
        tmdbService.enriquecerSerie(series);
        return seriesRepository.save(series);
    }

    @Transactional
    public List<Episode> cadastrarEpisodios(Long seriesId, List<CadastrarEpisodioRequest> requests) {
        var series = seriesRepository.findById(seriesId)
            .orElseThrow(() -> new NotFoundException("Série não encontrada"));

        Map<Integer, Season> seasonCache = new HashMap<>();
        List<Episode> episodiosSalvos = new ArrayList<>();

        for (var request : requests) {
            var season = seasonCache.computeIfAbsent(request.seasonNumber(), sn -> {
                return seasonRepository.findBySeriesIdAndNumber(seriesId, sn)
                    .orElseGet(() -> {
                        var novaSeason = Season.builder()
                            .series(series)
                            .number(sn)
                            .build();
                        novaSeason = seasonRepository.save(novaSeason);
                        tmdbService.enriquecerTemporada(novaSeason, series.getTmdbId());
                        return seasonRepository.save(novaSeason);
                    });
            });

            var episodio = episodeRepository.findBySeasonIdAndNumber(season.getId(), request.episodeNumber())
                .orElseGet(() -> {
                    var novoEpisodio = Episode.builder()
                        .season(season)
                        .number(request.episodeNumber())
                        .title("...")
                        .build();
                    tmdbService.enriquecerEpisodio(novoEpisodio, series.getTmdbId(), request.seasonNumber());
                    return episodeRepository.save(novoEpisodio);
                });

            episodiosSalvos.add(episodio);
        }

        return episodiosSalvos;
    }

    public String gerarStreamUrl(Long id, String clientIp, String adminSubject) {
        var episodio = episodeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Episodio não encontrado"));

        if (episodio.getVodStatus() != VodStatus.READY || episodio.getHlsPath() == null) {
            throw new NotFoundException("Episodio não está disponível para reprodução");
        }

        String token = jwtService.gerarStreamToken(adminSubject, clientIp);

        return String.format("%s/vod-hls/%s/master.m3u8?sjwt=%s&id=%s",
            serverUrl,
            episodio.getHlsPath(),
            URLEncoder.encode(token, StandardCharsets.UTF_8),
            id
        );
    }

    public List<Series> listarEntidades() {
        return seriesRepository.findByActiveTrueOrderByTitle();
    }

    public List<TmdbSeasonDetailDTO> buscarTemporadasTmdb(Long seriesId) {
        var series = seriesRepository.findById(seriesId)
            .orElseThrow(() -> new NotFoundException("Série não encontrada"));

        return tmdbService.buscarTodasTemporadas(series);
    }

    @Transactional
    public void alterarStatus(Long id, boolean active) {
        var series = seriesRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Série não encontrada"));
        series.setActive(active);
        seriesRepository.save(series);
    }

    @Transactional
    public void associarArquivo(Long episodeId, String filePath) {
        var episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new NotFoundException("Episódio não encontrado"));
        episode.setFilePath(filePath);
        episodeRepository.save(episode);
    }

    @Transactional
    public Series sincronizarTmdb(Long id) {
        var series = seriesRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Série não encontrada"));

        List<Season>  seasons  = new ArrayList<>();
        List<Episode> episodes = new ArrayList<>();

        tmdbService.enriquecerSerie(series);
        series = seriesRepository.save(series);
        seasonRepository.saveAll(seasons);
        episodeRepository.saveAll(episodes);
        return series;
    }

    @Transactional
    public void excluir(Long id) {
        if (!seriesRepository.existsById(id)) {
            throw new NotFoundException("Série não encontrada");
        }
        seriesRepository.deleteById(id);
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
            .director(series.getDirector())
            .releaseDate(series.getYear() != null ? String.valueOf(series.getYear()) : null)
            .genre(series.getGenre())
            .tmbdId(series.getTmdbId())
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
