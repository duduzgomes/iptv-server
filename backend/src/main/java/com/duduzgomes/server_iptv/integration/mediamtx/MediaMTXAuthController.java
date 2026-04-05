package com.duduzgomes.server_iptv.integration.mediamtx;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/mediamtx")
public class MediaMTXAuthController {

    private final MediaMTXAuthService authService;

    @PostMapping("/auth")
    public ResponseEntity<Void> auth(@RequestBody MediaMTXAuthDTO dto) {
        return authService.autorizar(dto)
            ? ResponseEntity.ok().build()
            : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/publish")
    public ResponseEntity<Void> publish(@RequestParam String streamKey) {

        return authService.publish(streamKey)
            ? ResponseEntity.ok().build()
            : ResponseEntity.notFound().build();
    }

    @PostMapping("/onUnpublish")
    public ResponseEntity<Void> onUnpublish(@RequestParam String streamKey) {

        return authService.onUnpublish(streamKey)
            ? ResponseEntity.ok().build()
            : ResponseEntity.notFound().build();
    }
}
