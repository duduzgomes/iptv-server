package com.duduzgomes.server_iptv.domain.category;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByContentTypeAndActiveTrue(ContentType contentType);
}
