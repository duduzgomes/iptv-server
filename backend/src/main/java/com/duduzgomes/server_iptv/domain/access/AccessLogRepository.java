package com.duduzgomes.server_iptv.domain.access;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    @Query("""
        SELECT a FROM AccessLog a
        WHERE a.user.id = :userId
        AND a.disconnectedAt IS NULL
        """)
    List<AccessLog> findActiveByUserId(Long userId);

    @Query("""
        SELECT COUNT(a) FROM AccessLog a
        WHERE a.user.id = :userId
        AND a.disconnectedAt IS NULL
        """)
    int countActiveByUserId(Long userId);

    @Query("""
        SELECT a FROM AccessLog a
        WHERE a.disconnectedAt IS NULL
        ORDER BY a.connectedAt DESC
        """)
    List<AccessLog> findAllActive();
}
