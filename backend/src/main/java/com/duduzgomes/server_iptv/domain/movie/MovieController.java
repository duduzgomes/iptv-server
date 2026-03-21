package com.duduzgomes.server_iptv.domain.movie;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    public ResponseEntity<List<Movie>> listar() {
        return ResponseEntity.ok(movieService.listarEntidades());
    }

    @PostMapping
    public ResponseEntity<Movie> criar(
        @Valid @RequestBody CriarMovieRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(movieService.cadastrar(
                request.categoryId(),
                request.tmdbId(),
                request.filePath()
            ));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> alterarStatus(
        @PathVariable Long id,
        @RequestParam boolean active
    ) {
        movieService.alterarStatus(id, active);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/sincronizar")
    public ResponseEntity<Movie> sincronizar(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.sincronizarTmdb(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        movieService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    record CriarMovieRequest(
        @NotNull  Long    categoryId,
        @NotNull  Integer tmdbId,
        @NotBlank String  filePath
    ) {}
}
