package com.duduzgomes.server_iptv.domain.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/admins")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<List<Admin>> listar() {
        return ResponseEntity.ok(adminService.listar());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Admin> criar(@Valid @RequestBody CriarAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminService.criar(
                request.username(),
                request.password(),
                request.email(),
                request.role()
            ));
    }

    @PatchMapping("/{id}/senha")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> alterarSenha(
        @PathVariable Long id,
        @RequestBody AlterarSenhaRequest request
    ) {
        adminService.alterarSenha(id, request.senha());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> alterarStatus(
        @PathVariable Long id,
        @RequestParam boolean active
    ) {
        adminService.alterarStatus(id, active);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        adminService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    record CriarAdminRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String email,
        @NotNull  AdminRole role
    ) {}

    record AlterarSenhaRequest(
        @NotBlank String senha
    ) {}
}
