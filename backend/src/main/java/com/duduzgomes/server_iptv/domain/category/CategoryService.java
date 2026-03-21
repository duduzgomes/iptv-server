package com.duduzgomes.server_iptv.domain.category;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> listar() {
        return categoryRepository.findAll();
    }

    public List<Category> listarPorTipo(ContentType contentType) {
        return categoryRepository.findByContentTypeAndActiveTrue(contentType);
    }

    @Transactional
    public Category criar(String name, ContentType contentType) {
        return categoryRepository.save(Category.builder()
            .name(name)
            .contentType(contentType)
            .active(true)
            .build());
    }

    @Transactional
    public Category editar(Long id, String name) {
        var category = categoryRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
        category.setName(name);
        return categoryRepository.save(category);
    }

    @Transactional
    public void alterarStatus(Long id, boolean active) {
        var category = categoryRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
        category.setActive(active);
        categoryRepository.save(category);
    }

    @Transactional
    public void excluir(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Categoria não encontrada");
        }
        categoryRepository.deleteById(id);
    }
}
