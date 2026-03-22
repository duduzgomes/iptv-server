package com.duduzgomes.server_iptv.domain.vod;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/upload")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    // filmes
    @PostMapping("/movies/{movieId}/iniciar")
    public ResponseEntity<IniciarUploadResponseDTO> iniciarFilme(
        @PathVariable Long movieId,
        @RequestParam int totalChunks
    ) {
        return ResponseEntity.ok(
            uploadService.iniciarUploadFilme(movieId, totalChunks)
        );
    }

    @PostMapping("/movies/{movieId}/concluir")
    public ResponseEntity<Void> concluirFilme(
        @PathVariable Long movieId,
        @RequestBody ConcluirUploadRequestDTO request
    ) {
        uploadService.concluirUploadFilme(movieId, request.uploadId(), request.etags());
        return ResponseEntity.ok().build();
    }

    // episódios
    @PostMapping("/episodes/{episodeId}/iniciar")
    public ResponseEntity<IniciarUploadResponseDTO> iniciarEpisodio(
        @PathVariable Long episodeId,
        @RequestParam int totalChunks
    ) {
        return ResponseEntity.ok(
            uploadService.iniciarUploadEpisodio(episodeId, totalChunks)
        );
    }

    @PostMapping("/episodes/{episodeId}/concluir")
    public ResponseEntity<Void> concluirEpisodio(
        @PathVariable Long episodeId,
        @RequestBody ConcluirUploadRequestDTO request
    ) {
        uploadService.concluirUploadEpisodio(
            episodeId, request.uploadId(), request.etags()
        );
        return ResponseEntity.ok().build();
    }
}
