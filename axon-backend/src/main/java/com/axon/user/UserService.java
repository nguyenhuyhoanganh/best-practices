package com.axon.user;

import com.axon.auth.sso.SSOUserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User findOrCreate(SSOUserInfo sso) {
        return userRepository.findByEmail(sso.email())
            .map(existing -> {
                existing.setLastLoginAt(LocalDateTime.now());
                return userRepository.save(existing);
            })
            .orElseGet(() -> {
                User newUser = User.builder()
                    .email(sso.email())
                    .name(sso.name())
                    .cipId(sso.cipId())
                    .avatarUrl(sso.avatarUrl())
                    .department(sso.department())
                    .role(UserRole.USER)
                    .lastLoginAt(LocalDateTime.now())
                    .build();
                log.info("Creating new user: {}", sso.email());
                return userRepository.save(newUser);
            });
    }

    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }
}
