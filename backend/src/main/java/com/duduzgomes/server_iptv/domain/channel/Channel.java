package com.duduzgomes.server_iptv.domain.channel;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.duduzgomes.server_iptv.domain.category.Category;

@Entity
@Table(name = "channels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(length = 500)
    private String logoUrl;

    @Column(nullable = false, length = 500)
    private String sourceUrl;

    @Column(nullable = false, unique = true, length = 100)
    private String streamKey;

    @Column(length = 100)
    private String epgChannelId;

    @Column(nullable = false)
    private Integer num;

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
