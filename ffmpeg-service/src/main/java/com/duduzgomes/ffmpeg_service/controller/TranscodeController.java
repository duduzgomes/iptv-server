package com.duduzgomes.ffmpeg_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.duduzgomes.ffmpeg_service.dto.TranscodeRequestDTO;
import com.duduzgomes.ffmpeg_service.service.TranscodeService;

@RestController
@RequestMapping("/transcode")
@RequiredArgsConstructor
public class TranscodeController {

    private final TranscodeService transcodeService;

    @PostMapping
    public ResponseEntity<Void> transcodar(@RequestBody TranscodeRequestDTO request) {
        // inicia em background — retorna 202 imediatamente
        transcodeService.transcodar(request);
        return ResponseEntity.accepted().build();
    }
}
