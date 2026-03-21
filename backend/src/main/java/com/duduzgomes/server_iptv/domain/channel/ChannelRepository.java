package com.duduzgomes.server_iptv.domain.channel;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChannelRepository extends JpaRepository<Channel, Long> {

    List<Channel> findByActiveTrueOrderByNum();
    List<Channel> findByCategoryIdAndActiveTrue(Long categoryId);
    Optional<Channel> findByStreamKey(String streamKey);

}
