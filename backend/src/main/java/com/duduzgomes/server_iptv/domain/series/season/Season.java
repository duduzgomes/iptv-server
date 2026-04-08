package com.duduzgomes.server_iptv.domain.series.season;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.duduzgomes.server_iptv.domain.series.Series;
import com.duduzgomes.server_iptv.domain.series.episode.Episode;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "seasons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Season {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id", nullable = false)
    private Series series;

    private Integer tmdbId;

    @Column(nullable = false)
    private Integer number;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    @Column(length = 500)
    private String posterUrl;

    private Integer year;

    @JsonIgnore
    @OneToMany(mappedBy = "season", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("number ASC")
    private List<Episode> episodes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
