package com.axon.auth;

import com.axon.auth.dto.LoginRequest;
import com.axon.auth.dto.TokenResponse;
import com.axon.auth.dto.UserInfoResponse;
import com.axon.auth.sso.SSOProvider;
import com.axon.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final SSOProvider ssoProvider;

    @GetMapping("/sso/login")
    public ResponseEntity<Void> login() {
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(ssoProvider.getLoginUrl()))
            .build();
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/sso/callback")
    public ResponseEntity<TokenResponse> callback(@RequestParam String code) {
        return ResponseEntity.ok(authService.ssoLogin(code));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(UserInfoResponse.from(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
