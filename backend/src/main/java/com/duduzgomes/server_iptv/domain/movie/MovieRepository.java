package com.duduzgomes.server_iptv.domain.movie;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;


public interface MovieRepository extends JpaRepository<Movie, Long> {

    List<Movie> findByActiveTrueOrderByTitle();
    List<Movie> findByCategoryIdAndActiveTrue(Long categoryId);
    Optional<Movie> findByTmdbId(Integer tmdbId);
}
