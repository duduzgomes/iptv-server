package com.duduzgomes.server_iptv.domain.series.episode;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.duduzgomes.server_iptv.domain.series.season.Season;
import com.duduzgomes.server_iptv.domain.vod.VodStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "episodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Episode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    private Integer tmdbId;

    @Column(nullable = false)
    private Integer number;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    @Column(length = 500)
    private String posterUrl;

    private Integer duration;
    private LocalDate airDate;

    @Column(length = 500)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VodStatus vodStatus = VodStatus.PENDING;

    @Column(length = 500)
    private String minioKey;

    @Column(length = 500)
    private String hlsPath;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
