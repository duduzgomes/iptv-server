package com.duduzgomes.server_iptv.domain.series.episode;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findBySeasonIdOrderByNumber(Long seasonId);
    List<Episode> findBySeasonIdAndActiveTrueOrderByNumber(Long seasonId);
    Optional<Episode> findBySeasonIdAndNumber(Long seasonId, Integer number);
}
