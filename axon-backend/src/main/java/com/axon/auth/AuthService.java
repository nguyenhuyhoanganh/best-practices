package com.axon.auth;

import com.axon.auth.jwt.JwtService;
import com.axon.auth.sso.SSOProvider;
import com.axon.auth.sso.SSOUserInfo;
import com.axon.user.User;
import com.axon.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// P1: orchestrate SSO → upsert user → issue JWT pair (access 15m, refresh 7d)
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SSOProvider ssoProvider;
    private final UserService userService;
    private final JwtService jwtService;

    public User findOrCreateUserFromCode(String code) {
        SSOUserInfo ssoUserInfo = ssoProvider.exchange(code);
        return userService.findOrCreate(ssoUserInfo);
    }

    public String generateAccessToken(User user) {
        return jwtService.generateAccessToken(user.getId().toString(), user.getRole().name());
    }

    public String generateRefreshToken(User user) {
        return jwtService.generateRefreshToken(user.getId().toString());
    }
}
