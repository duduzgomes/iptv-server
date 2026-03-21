package com.duduzgomes.server_iptv.domain.access;

import lombok.*;
import java.time.LocalDateTime;
import com.duduzgomes.server_iptv.domain.user.User;
import jakarta.persistence.*;
import jakarta.persistence.Id;

@Entity
@Table(name = "access_logs",
    indexes = {
        @Index(name = "idx_access_user", columnList = "user_id, disconnected_at"),
        @Index(name = "idx_access_active", columnList = "disconnected_at")
    }
)
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccessContentType contentType;

    @Column(nullable = false)
    private Long contentId;

    @Column(nullable = false, length = 45)
    private String ipAddress;

    @Column(nullable = false)
    private LocalDateTime connectedAt;

    private LocalDateTime disconnectedAt;

    @PrePersist
    void prePersist() {
        connectedAt = LocalDateTime.now();
    }
}