package com.duduzgomes.server_iptv.domain.vod;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.duduzgomes.server_iptv.domain.vod.dto.TranscodeCallbackDTO;

@RestController
@RequestMapping("/internal/transcode")
@RequiredArgsConstructor
public class TranscodeCallbackController {

    private final TranscodeCallbackService callbackService;

    @PostMapping("/callback")
    public ResponseEntity<Void> callback(@RequestBody TranscodeCallbackDTO callback) {
        callbackService.processar(callback);
        return ResponseEntity.ok().build();
    }
}
