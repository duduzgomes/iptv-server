package com.duduzgomes.server_iptv.domain.category;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> listar( @RequestParam(required = false) ContentType type) {
        if (type != null) {
            return ResponseEntity.ok(categoryService.listarPorTipo(type));
        }
        return ResponseEntity.ok(categoryService.listar());
    }

    @PostMapping
    public ResponseEntity<Category> criar( @Valid @RequestBody CriarCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(categoryService.criar(request.name(), request.contentType()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> editar(
        @PathVariable Long id,
        @Valid @RequestBody EditarCategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.editar(id, request.name()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> alterarStatus(
        @PathVariable Long id,
        @RequestParam boolean active
    ) {
        categoryService.alterarStatus(id, active);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        categoryService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    record CriarCategoryRequest(
        @NotBlank String name,
        @NotNull  ContentType contentType
    ) {}

    record EditarCategoryRequest(
        @NotBlank String name
    ) {}
}
