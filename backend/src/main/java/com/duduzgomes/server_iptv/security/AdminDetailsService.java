package com.duduzgomes.server_iptv.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.duduzgomes.server_iptv.domain.admin.AdminRepository;

@Service
@RequiredArgsConstructor
public class AdminDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var admin = adminRepository.findByUsername(username)
            .orElseThrow(() ->
                new UsernameNotFoundException("Admin não encontrado: " + username));

        return User.builder()
            .username(admin.getUsername())
            .password(admin.getPassword())
            .roles(admin.getRole().name())
            .build();
    }
}
