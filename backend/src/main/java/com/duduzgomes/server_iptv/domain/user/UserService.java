package com.duduzgomes.server_iptv.domain.user;


import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.admin.AdminRepository;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import com.duduzgomes.server_iptv.shared.util.CredentialGenerator;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository      userRepository;
    private final AdminRepository     adminRepository;
    private final CredentialGenerator credentialGenerator;

    public List<User> listar() {
        return userRepository.findAll();
    }

    public User buscarPorId(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
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
    public User editar(Long id,
                       int maxConnections,
                       int validadeDias) {
        var user = buscarPorId(id);
        user.setMaxConnections(maxConnections);
        user.setExpiresAt(LocalDateTime.now().plusDays(validadeDias));
        return userRepository.save(user);
    }

    @Transactional
    public User renovar(Long id, int dias) {
        var user = buscarPorId(id);

        LocalDateTime base = user.getExpiresAt()
            .isBefore(LocalDateTime.now()) ? LocalDateTime.now() : user.getExpiresAt();

        user.setExpiresAt(base.plusDays(dias));
        return userRepository.save(user);
    }

    @Transactional
    public void alterarStatus(Long id, boolean active) {
        var user = buscarPorId(id);
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
