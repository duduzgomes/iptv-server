package com.duduzgomes.server_iptv.domain.series;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.duduzgomes.server_iptv.domain.category.Category;
import com.duduzgomes.server_iptv.domain.series.season.Season;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "series")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Series {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer tmdbId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    @Column(length = 255)
    private String genre;

    @Column(columnDefinition = "TEXT")
    private String castMembers;

    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(length = 500)
    private String posterUrl;

    @Column(length = 500)
    private String backdropUrl;

    @Column(length = 500)
    private String trailerUrl;

    @Column(length = 50)
    private String status;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @JsonIgnore
    @OneToMany(mappedBy = "series", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("number ASC")
    private List<Season> seasons;

    private LocalDateTime tmdbUpdatedAt;

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
