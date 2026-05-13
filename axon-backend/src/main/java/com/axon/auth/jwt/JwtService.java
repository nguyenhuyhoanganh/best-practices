package com.axon.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-ttl}")
    private long accessTokenTtl;

    @Value("${jwt.refresh-token-ttl}")
    private long refreshTokenTtl;

    public String generateAccessToken(String userId, String role) {
        return buildToken(userId, role, accessTokenTtl);
    }

    public String generateRefreshToken(String userId) {
        return buildToken(userId, null, refreshTokenTtl);
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith(signingKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    private String buildToken(String userId, String role, long ttlSeconds) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
            .subject(userId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(ttlSeconds)))
            .signWith(signingKey());
        if (role != null) {
            builder.claim("role", role);
        }
        return builder.compact();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
