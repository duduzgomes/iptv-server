package com.duduzgomes.server_iptv.domain.access;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    @Query("""
        SELECT a FROM AccessLog a
        WHERE a.user.id = :userId
        AND a.disconnectedAt IS NULL
        AND a.expiresAt > CURRENT_TIMESTAMP
        """)
    List<AccessLog> findActiveByUserId(Long userId);

    @Query("""
        SELECT COUNT(a) FROM AccessLog a
        WHERE a.user.id = :userId
        AND a.disconnectedAt IS NULL
        AND a.expiresAt > CURRENT_TIMESTAMP
        """)
    int countActiveByUserId(Long userId);

    @Query("""
        SELECT a FROM AccessLog a
        WHERE a.disconnectedAt IS NULL
        AND a.expiresAt > CURRENT_TIMESTAMP
        ORDER BY a.connectedAt DESC
        """)
    List<AccessLog> findAllActive();

    @Query("""
        SELECT a FROM AccessLog a
        WHERE a.user.id = :userId
        AND a.ipUserAgent = :ipUserAgent
        AND a.contentType = :contentType
        AND a.contentId = :contentId
        AND a.disconnectedAt IS NULL
        AND a.expiresAt > CURRENT_TIMESTAMP
        """)
    Optional<AccessLog> findActiveByUserAndIpAndContent(
        Long userId,
        String ipUserAgent,
        AccessContentType contentType,
        Long contentId
    );

    @Modifying
    @Query("""
        UPDATE AccessLog a
        SET a.disconnectedAt = CURRENT_TIMESTAMP
        WHERE a.disconnectedAt IS NULL
        AND a.expiresAt < :agora
        """)
    int encerrarExpiradas(LocalDateTime agora);

    
}
