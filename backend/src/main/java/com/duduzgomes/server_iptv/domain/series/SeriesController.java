package com.duduzgomes.server_iptv.domain.series;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.duduzgomes.server_iptv.integration.tmdb.dto.SeriesInfoDTO;

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
    
    @GetMapping("/{id}")
    public ResponseEntity<SeriesInfoDTO> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(seriesService.buscarInfo(id));
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

    record CriarSeriesRequest(
        @NotNull Long    categoryId,
        @NotNull Integer tmdbId
    ) {}
}
