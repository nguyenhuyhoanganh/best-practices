package com.axon.auth.jwt;

import com.axon.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessTtl;
    private final long refreshTtl;
    private final StringRedisTemplate redis;

    public JwtService(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.access-token-ttl}") long accessTtl,
        @Value("${jwt.refresh-token-ttl}") long refreshTtl,
        StringRedisTemplate redis
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtl = accessTtl;
        this.refreshTtl = refreshTtl;
        this.redis = redis;
    }

    public String generateAccessToken(User user) {
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("role", user.getRole().name())
            .claim("type", "ACCESS")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessTtl * 1000))
            .signWith(key)
            .compact();
    }

    public String generateRefreshToken(User user) {
        String jti = UUID.randomUUID().toString();
        String token = Jwts.builder()
            .subject(user.getId().toString())
            .claim("type", "REFRESH")
            .id(jti)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshTtl * 1000))
            .signWith(key)
            .compact();
        redis.opsForValue().set("refresh:" + jti, user.getId().toString(),
            Duration.ofSeconds(refreshTtl));
        return token;
    }

    public Claims validateAndParse(String token) {
        return Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).getPayload();
    }

    public void invalidateRefreshToken(String jti) {
        redis.delete("refresh:" + jti);
    }

    public boolean isRefreshTokenValid(String jti) {
        return redis.hasKey("refresh:" + jti);
    }
}
