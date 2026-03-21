package com.duduzgomes.server_iptv.domain.series;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SeriesRepository extends JpaRepository<Series, Long> {
    List<Series> findByActiveTrueOrderByTitle();
    List<Series> findByCategoryIdAndActiveTrue(Long categoryId);
    Optional<Series> findByTmdbId(Integer tmdbId);
}


