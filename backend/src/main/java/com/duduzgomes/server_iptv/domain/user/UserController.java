package com.duduzgomes.server_iptv.domain.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService         userService;

    @GetMapping
    public ResponseEntity<List<User>> listar() {
        return ResponseEntity.ok(userService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(userService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> criar(@Valid @RequestBody CriarUserRequest request) {
        var user = userService.criar(request.maxConnections(), request.validadeDias());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.toDTO(user, user.getPassword()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> editar(
        @PathVariable Long id,
        @Valid @RequestBody EditarUserRequest request
    ) {
        return ResponseEntity.ok(
            userService.editar(id, request.maxConnections(), request.validadeDias())
        );
    }

    @PatchMapping("/{id}/renovar")
    public ResponseEntity<User> renovar(
        @PathVariable Long id,
        @RequestParam @Min(1) int dias
    ) {
        return ResponseEntity.ok(userService.renovar(id, dias));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> alterarStatus(
        @PathVariable Long id,
        @RequestParam boolean active
    ) {
        userService.alterarStatus(id, active);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        userService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    record CriarUserRequest(
        @Min(1) int maxConnections,
        @Min(1) int validadeDias
    ) {}

    record EditarUserRequest(
        @Min(1) int maxConnections,
        @Min(1) int validadeDias
    ) {}
}
