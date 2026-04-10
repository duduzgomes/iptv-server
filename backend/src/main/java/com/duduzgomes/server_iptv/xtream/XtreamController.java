package com.duduzgomes.server_iptv.xtream;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.duduzgomes.server_iptv.domain.channel.ChannelService;
import com.duduzgomes.server_iptv.domain.movie.MovieService;
import com.duduzgomes.server_iptv.domain.series.SeriesService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequiredArgsConstructor
public class XtreamController {

    private final XtreamAuthService authService;
    private final ChannelService channelService;
    private final MovieService movieService; 
    private final SeriesService seriesService;

    @GetMapping("/player_api.php")
    public ResponseEntity<?> playerApi(
        @RequestParam String username,
        @RequestParam String password,
        @RequestParam(required = false) String action,
        HttpServletRequest request
    ) {
        if (action == null) {
            return ResponseEntity.ok(authService.autenticar(username, password));
        }

        authService.autenticar(username, password);

        return switch (action) {
            case "get_live_categories"   -> ResponseEntity.ok(channelService.listarCategorias());
            case "get_live_streams"      -> ResponseEntity.ok(channelService.listarCanais());
            case "get_vod_categories"    -> ResponseEntity.ok(movieService.listarCategorias());
            case "get_vod_streams"       -> ResponseEntity.ok(movieService.listarFilmes());
            case "get_series_categories" -> ResponseEntity.ok(seriesService.listarCategorias());
            case "get_series"            -> ResponseEntity.ok(seriesService.listarSeries());
            case "get_series_info" -> {
                Long seriesId = Long.parseLong(request.getParameter("series_id"));
                yield ResponseEntity.ok(seriesService.buscarInfo(seriesId));
            }
            case "get_vod_info" -> {
                Long vodId = Long.parseLong(request.getParameter("vod_id"));
                yield ResponseEntity.ok(movieService.buscarInfo(vodId));
            }
            default -> ResponseEntity.badRequest().build();
        };
    }
}