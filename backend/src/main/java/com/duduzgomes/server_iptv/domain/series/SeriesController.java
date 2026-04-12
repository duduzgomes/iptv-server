package com.duduzgomes.server_iptv.domain.series;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.duduzgomes.server_iptv.domain.series.episode.Episode;
import com.duduzgomes.server_iptv.integration.tmdb.dto.SeriesInfoDTO;
import com.duduzgomes.server_iptv.integration.tmdb.dto.TmdbSeasonDetailDTO;

import java.util.List;

@RestController
@RequestMapping("/admin/series")
@RequiredArgsConstructor
public class SeriesController {

    private final SeriesService seriesService;

    @GetMapping
    public ResponseEntity<List<Series>> listar() {
        return ResponseEntity.ok(seriesService.listarEntidades());
    }

    @PostMapping
    public ResponseEntity<Series> criar(
        @Valid @RequestBody CriarSeriesRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(seriesService.cadastrar(request.categoryId(), request.tmdbId()));
    }

    @PostMapping("/{id}/episodios")
    public ResponseEntity<List<Episode>> cadastrarEpisodios(
        @PathVariable Long id,
        @Valid @RequestBody List<CadastrarEpisodioRequest> request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(seriesService.cadastrarEpisodios(id, request));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SeriesInfoDTO> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(seriesService.buscarInfo(id));
    }

    @GetMapping("/{id}/temporadas")
    public ResponseEntity<List<TmdbSeasonDetailDTO>> buscarTemporadas(@PathVariable Long id) {
        return ResponseEntity.ok(seriesService.buscarTemporadasTmdb(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> alterarStatus(
        @PathVariable Long id,
        @RequestParam boolean active
    ) {
        seriesService.alterarStatus(id, active);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/episodes/{episodeId}/arquivo")
    public ResponseEntity<Void> associarArquivo(
        @PathVariable Long episodeId,
        @RequestParam @NotBlank String filePath
    ) {
        seriesService.associarArquivo(episodeId, filePath);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/sincronizar")
    public ResponseEntity<Series> sincronizar(@PathVariable Long id) {
        return ResponseEntity.ok(seriesService.sincronizarTmdb(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        seriesService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/stream-url")
    public ResponseEntity<StreamUrlResponse> obterStreamUrl(
        @PathVariable Long id,
        HttpServletRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        String clientIp = obterIp(request);
        String url = seriesService.gerarStreamUrl(id, clientIp, jwt.getSubject());
        return ResponseEntity.ok(new StreamUrlResponse(url));
    }

    private String obterIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        return (realIp != null && !realIp.isBlank()) ? realIp.trim() : request.getRemoteAddr();
    }

    record StreamUrlResponse(String url) {}

    record CriarSeriesRequest(
        @NotNull Long    categoryId,
        @NotNull Integer tmdbId
    ) {}

    record CadastrarEpisodioRequest(
        @NotNull Integer seasonNumber,
        @NotNull Integer episodeNumber
    ) {}
}
