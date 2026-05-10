package com.axon.auth;

import com.axon.auth.dto.LoginRequest;
import com.axon.auth.dto.TokenResponse;
import com.axon.auth.dto.UserInfoResponse;
import com.axon.auth.jwt.JwtService;
import com.axon.auth.sso.SSOProvider;
import com.axon.user.User;
import com.axon.user.UserRepository;
import com.axon.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final SSOProvider ssoProvider;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.access-token-ttl}")
    private long accessTokenTtl;

    @Transactional
    public TokenResponse login(LoginRequest req) {
        log.info("Login attempt for user: {}", req.username());
        User user = userRepository.findByEmail(req.username())
            .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(req.password(), user.getPassword())) {
            log.warn("Password mismatch for user: {}", req.username());
            throw new IllegalArgumentException("Invalid username or password");
        }

        return new TokenResponse(
            jwtService.generateAccessToken(user),
            jwtService.generateRefreshToken(user),
            accessTokenTtl,
            UserInfoResponse.from(user)
        );
    }

    @Transactional
    public TokenResponse ssoLogin(String code) {
        var info = ssoProvider.exchangeCode(code);
        var user = userRepository
            .findBySsoProviderAndSsoSubject(info.provider(), info.subject())
            .orElseGet(() -> userRepository.save(User.builder()
                .email(info.email())
                .name(info.name())
                .avatarUrl(info.avatarUrl())
                .ssoProvider(info.provider())
                .ssoSubject(info.subject())
                .role(UserRole.USER)
                .build()));

        return new TokenResponse(
            jwtService.generateAccessToken(user),
            jwtService.generateRefreshToken(user),
            accessTokenTtl,
            UserInfoResponse.from(user)
        );
    }
}
