package com.duduzgomes.server_iptv.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.duduzgomes.server_iptv.domain.admin.Admin;
import com.duduzgomes.server_iptv.domain.admin.AdminRepository;
import com.duduzgomes.server_iptv.domain.admin.AdminRole;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.default.username:admin}")
    private String defaultUsername;

    @Value("${admin.default.password:admin123}")
    private String defaultPassword;

    @Value("${admin.default.email:admin@iptv.com}")
    private String defaultEmail;

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.existsByUsername(defaultUsername)) {
            log.info("Superadmin já existe — pulando criação");
            return;
        }

        var admin = Admin.builder()
            .username(defaultUsername)
            .password(passwordEncoder.encode(defaultPassword))
            .email(defaultEmail)
            .role(AdminRole.SUPERADMIN)
            .active(true)
            .build();

        adminRepository.save(admin);
        log.info("Superadmin criado — username: {}", defaultUsername);
    }
}
