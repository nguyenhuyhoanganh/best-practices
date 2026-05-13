package com.axon.auth.jwt;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
            "test-secret-key-minimum-32-bytes-long-for-hs256-algo!!");
        ReflectionTestUtils.setField(jwtService, "accessTokenTtl", 900L);
        ReflectionTestUtils.setField(jwtService, "refreshTokenTtl", 604800L);
    }

    @Test
    void generateAccessToken_containsSubjectAndRole() {
        String token = jwtService.generateAccessToken("user-123", "AX_CREATOR");
        Claims claims = jwtService.parseToken(token);
        assertEquals("user-123", claims.getSubject());
        assertEquals("AX_CREATOR", claims.get("role", String.class));
    }

    @Test
    void generateRefreshToken_hasNoRoleClaim() {
        String token = jwtService.generateRefreshToken("user-123");
        Claims claims = jwtService.parseToken(token);
        assertEquals("user-123", claims.getSubject());
        assertNull(claims.get("role"));
    }

    @Test
    void isTokenValid_withValidToken_returnsTrue() {
        String token = jwtService.generateAccessToken("user-123", "USER");
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void isTokenValid_withInvalidToken_returnsFalse() {
        assertFalse(jwtService.isTokenValid("not.a.valid.token"));
    }

    @Test
    void isTokenValid_withTamperedToken_returnsFalse() {
        String token = jwtService.generateAccessToken("user-123", "USER");
        assertFalse(jwtService.isTokenValid(token + "tampered"));
    }

    @Test
    void parseToken_extractsCorrectExpiry() {
        String token = jwtService.generateAccessToken("user-456", "ADMIN");
        Claims claims = jwtService.parseToken(token);
        long diffSeconds = (claims.getExpiration().getTime() - claims.getIssuedAt().getTime()) / 1000;
        assertEquals(900L, diffSeconds, 2L);
    }
}
