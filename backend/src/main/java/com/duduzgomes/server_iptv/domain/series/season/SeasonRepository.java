package com.duduzgomes.server_iptv.domain.series.season;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SeasonRepository extends JpaRepository<Season, Long> {
    List<Season> findBySeriesIdOrderByNumber(Long seriesId);
}