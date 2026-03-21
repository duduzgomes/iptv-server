package com.duduzgomes.server_iptv.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    // busca só usuários ativos e não expirados
    @Query("""
        SELECT u FROM User u
        WHERE u.username = :username
        AND u.active = true
        AND u.expiresAt > CURRENT_TIMESTAMP
        """)
    Optional<User> findActiveByUsername(String username);
}