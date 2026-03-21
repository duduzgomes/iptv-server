package com.duduzgomes.server_iptv.domain.access;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AccessLogService accessLogService;

    @GetMapping("/connections")
    public ResponseEntity<List<AccessLog>> conexoesAtivas() {
        return ResponseEntity.ok(accessLogService.listarConexoesAtivas());
    }

    @GetMapping("/connections/count")
    public ResponseEntity<Integer> totalConexoes() {
        return ResponseEntity.ok(
            accessLogService.listarConexoesAtivas().size()
        );
    }
}
