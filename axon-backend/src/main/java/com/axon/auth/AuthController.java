package com.axon.auth;

import com.axon.auth.dto.RefreshResponse;
import com.axon.auth.dto.TokenResponse;
import com.axon.auth.dto.UserDto;
import com.axon.auth.jwt.JwtService;
import com.axon.user.User;
import com.axon.user.UserService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.UUID;

// P1: POST /auth/login, GET /auth/callback, POST /auth/refresh, POST /auth/logout, GET /auth/me
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final JwtService jwtService;

    @RequestMapping(value = "/login", method = {
        org.springframework.web.bind.annotation.RequestMethod.GET,
        org.springframework.web.bind.annotation.RequestMethod.POST
    })
    public void login(HttpServletResponse response) throws IOException {
        response.sendRedirect("/auth/callback?code=mock-code-dev&state=dev");
    }

    @GetMapping("/callback")
    public ResponseEntity<TokenResponse> callback(
        @RequestParam("code") String code,
        @RequestParam(value = "state", required = false) String state,
        HttpServletResponse response
    ) {
        User user = authService.findOrCreateUserFromCode(code);
        String accessToken = authService.generateAccessToken(user);
        String refreshToken = authService.generateRefreshToken(user);

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
            .httpOnly(true)
            .path("/auth/refresh")
            .maxAge(604800)
            .sameSite("Strict")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok(new TokenResponse(accessToken, 900L, UserDto.from(user)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(
        @CookieValue("refresh_token") String refreshToken
    ) {
        if (!jwtService.isTokenValid(refreshToken)) {
            return ResponseEntity.status(401).build();
        }

        Claims claims = jwtService.parseToken(refreshToken);
        String userId = claims.getSubject();
        User user = userService.findById(UUID.fromString(userId));
        String newAccessToken = authService.generateAccessToken(user);

        return ResponseEntity.ok(new RefreshResponse(newAccessToken, 900L));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie clearCookie = ResponseCookie.from("refresh_token", "")
            .httpOnly(true)
            .path("/auth/refresh")
            .maxAge(0)
            .sameSite("Strict")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
            || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        String userId = (String) authentication.getPrincipal();
        User user = userService.findById(UUID.fromString(userId));
        return ResponseEntity.ok(UserDto.from(user));
    }
}
