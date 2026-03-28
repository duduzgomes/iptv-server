package com.duduzgomes.server_iptv.domain.vod;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.duduzgomes.server_iptv.domain.vod.dto.TranscodeCallbackDTO;

@RestController
@RequestMapping("/internal/transcode")
@RequiredArgsConstructor
public class TranscodeCallbackController {

    private final TranscodeCallbackService callbackService;
    
    @Value("${internal.secret}")
    private String internalSecret;

    @PostMapping("/callback")
    public ResponseEntity<Void> callback(@RequestBody TranscodeCallbackDTO callback,
        @RequestHeader("X-Internal-Secret") String secret) {
        
            if (!internalSecret.equals(secret)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
        callbackService.processar(callback);
        return ResponseEntity.ok().build();
    }
}
