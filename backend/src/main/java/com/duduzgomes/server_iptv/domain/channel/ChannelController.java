package com.duduzgomes.server_iptv.domain.channel;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<List<Channel>> listar() {
        return ResponseEntity.ok(channelService.listarEntidades());
    }

    @PostMapping
    public ResponseEntity<Channel> criar(
        @Valid @RequestBody CriarChannelRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(channelService.criar(
                request.categoryId(),
                request.name(),
                request.logoUrl(),
                request.sourceUrl(),
                request.streamKey(),
                request.epgChannelId()
              
            ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Channel> editar(
        @PathVariable Long id,
        @Valid @RequestBody EditarChannelRequest request
    ) {
        return ResponseEntity.ok(channelService.editar(
            id, 
            request.name(), 
            request.logoUrl(),
            request.sourceUrl(), 
            request.epgChannelId()
        ));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> alterarStatus(
        @PathVariable Long id,
        @RequestParam boolean active
    ) {
        channelService.alterarStatus(id, active);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        channelService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    record CriarChannelRequest(
        @NotNull  Long   categoryId,
        @NotBlank String name,
                  String logoUrl,
        @NotBlank String sourceUrl,
        @NotBlank String streamKey,
                  String epgChannelId
   
    ) {}

    record EditarChannelRequest(
        @NotBlank String  name,
                  String  logoUrl,
        @NotBlank String  sourceUrl,
                  String  epgChannelId
    ) {}
}
