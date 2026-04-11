package com.duduzgomes.server_iptv.domain.user;


import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.admin.AdminRepository;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import com.duduzgomes.server_iptv.shared.util.CredentialGenerator;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository      userRepository;
    private final AdminRepository     adminRepository;
    private final CredentialGenerator credentialGenerator;

    public Page<User> listar(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public UserResponseDTO buscarPorId(Long id) {
        var user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        return toDTO(user, user.getPassword());
    }

    @Transactional
    public User criar(int maxConnections, int validadeDias) {
        String username;
        do {
            username = credentialGenerator.gerar();
        } while (userRepository.existsByUsername(username));
      
        String adminUsername = SecurityContextHolder.getContext()
            .getAuthentication().getName();

        var admin = adminRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new NotFoundException("Admin não encontrado"));

        return userRepository.save(User.builder()
            .username(username)
            .password(credentialGenerator.gerar())
            .maxConnections(maxConnections)
            .active(true)
            .expiresAt(LocalDateTime.now().plusDays(validadeDias))
            .createdBy(admin)
            .build());
    }

    @Transactional
    public UserResponseDTO editar(Long id, int maxConnections, int validadeDias) {
        var user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        user.setMaxConnections(maxConnections);
        user.setExpiresAt(LocalDateTime.now().plusDays(validadeDias));

        userRepository.save(user);

        return toDTO(user, user.getPassword());
    }

    @Transactional
    public void alterarStatus(Long id, boolean active) {
        var user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        user.setActive(active);
        userRepository.save(user);
    }

    @Transactional
    public void excluir(Long id) {
        if (!userRepository.existsById(id)) {
            throw new NotFoundException("Usuário não encontrado");
        }
        userRepository.deleteById(id);
    }

    public UserResponseDTO toDTO(User user, String passwordTexto) {
        return UserResponseDTO.builder()
            .id(user.getId())
            .username(user.getUsername())
            .password(passwordTexto)
            .maxConnections(user.getMaxConnections())
            .active(user.getActive())
            .expiresAt(user.getExpiresAt())
            .createdBy(user.getCreatedBy() != null
                ? user.getCreatedBy().getUsername()
                : null)
            .createdAt(user.getCreatedAt())
            .build();
    }
}
