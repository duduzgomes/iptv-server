package com.duduzgomes.live_service.controller;

import com.duduzgomes.live_service.service.FFmpegManager;
import com.duduzgomes.live_service.service.ReconnectWatcher;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/live")
@RequiredArgsConstructor
public class LiveController {

    private final FFmpegManager    ffmpegManager;
    private final ReconnectWatcher reconnectWatcher;

    @PostMapping("/iniciar")
    public ResponseEntity<Void> iniciar(@RequestBody CanalRequestDTO dto) throws Exception {
        ffmpegManager.iniciarCanal(dto.channelId(), dto.streamKey(),  dto.url());
        reconnectWatcher.notificarInicioManual(dto.channelId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/parar/{channelId}")
    public ResponseEntity<Void> parar(@PathVariable Long channelId) {
        ffmpegManager.pararCanal(channelId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status/{channelId}")
    public ResponseEntity<Boolean> status(@PathVariable Long channelId) {
        return ResponseEntity.ok(ffmpegManager.estaRodando(channelId));
    }
}
