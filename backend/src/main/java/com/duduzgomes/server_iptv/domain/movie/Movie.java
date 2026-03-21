package com.duduzgomes.server_iptv.domain.movie;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.duduzgomes.server_iptv.domain.category.Category;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

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

    @Column(length = 255)
    private String originalTitle;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    private Integer year;

    @Column(length = 255)
    private String genre;

    @Column(columnDefinition = "TEXT")
    private String cast;

    @Column(length = 255)
    private String director;

    @Column(precision = 3, scale = 1)
    private Double rating;

    @Column(length = 500)
    private String posterUrl;

    @Column(length = 500)
    private String backdropUrl;

    @Column(length = 500)
    private String trailerUrl;

    @Column(nullable = false, length = 500)
    private String filePath;

    private Integer duration;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

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
