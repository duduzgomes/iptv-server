package com.duduzgomes.server_iptv.xtream;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.duduzgomes.server_iptv.xtream.dto.AuthResponseDTO;

@RestController
@RequiredArgsConstructor
public class XtreamController {

    private final XtreamAuthService authService;

    @GetMapping("/player_api.php")
    public ResponseEntity<?> playerApi(
        @RequestParam String username,
        @RequestParam String password,
        @RequestParam(required = false) String action
    ) {
        if (action == null) {
            AuthResponseDTO response = authService.autenticar(username, password);
            return ResponseEntity.ok(response);
        }

        // com action = outras operações (implementamos nas próximas etapas)
        return switch (action) {
            case "get_live_categories"   -> ResponseEntity.ok("[]"); // placeholder
            case "get_live_streams"      -> ResponseEntity.ok("[]");
            case "get_vod_categories"    -> ResponseEntity.ok("[]");
            case "get_vod_streams"       -> ResponseEntity.ok("[]");
            case "get_series_categories" -> ResponseEntity.ok("[]");
            case "get_series"            -> ResponseEntity.ok("[]");
            default -> ResponseEntity.badRequest().build();
        };
    }
}
