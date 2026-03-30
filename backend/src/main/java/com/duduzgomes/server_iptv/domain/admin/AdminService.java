package com.duduzgomes.server_iptv.domain.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.admin.dto.AdminResponse;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Admin> listar() {
        return adminRepository.findAll();
    }

    @Transactional
    public Admin criar(String username, String password,
                       String email, AdminRole role) {
        if (adminRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username já existe");
        }
        if (adminRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email já existe");
        }

        return adminRepository.save(Admin.builder()
            .username(username)
            .password(passwordEncoder.encode(password))
            .email(email)
            .role(role)
            .active(true)
            .build());
    }

    @Transactional
    public Admin alterarSenha(Long id, String novaSenha) {
        var admin = adminRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Admin não encontrado"));

        admin.setPassword(passwordEncoder.encode(novaSenha));
        return adminRepository.save(admin);
    }

    @Transactional
    public void alterarStatus(Long id, boolean active) {
        var admin = adminRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Admin não encontrado"));

        admin.setActive(active);
        adminRepository.save(admin);
    }

    @Transactional
    public void excluir(Long id) {
        if (!adminRepository.existsById(id)) {
            throw new NotFoundException("Admin não encontrado");
        }
        adminRepository.deleteById(id);
    }

    public AdminResponse toDTO(Admin admin){
        return AdminResponse.builder()
            .id(admin.getId())
            .username( admin.getUsername())
            .email( admin.getEmail())
            .role(admin.getRole())
            .active(admin.getActive()) 
            .createdAt(admin.getCreatedAt()) 
            .updatedAt(admin.getUpdatedAt())
            .build();
    }
}
