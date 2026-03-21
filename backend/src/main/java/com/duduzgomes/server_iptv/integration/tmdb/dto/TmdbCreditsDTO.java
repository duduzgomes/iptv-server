package com.duduzgomes.server_iptv.integration.tmdb.dto;

import java.util.List;

public record TmdbCreditsDTO(
    List<TmdbCastDTO> cast,
    List<TmdbCrewDTO> crew
) {}
