# P0 Project Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng môi trường dev chạy được: Docker Compose, Flyway migrations V1–V10, BE scaffold boot được (Spring Boot 3.5 + Java 21), FE scaffold khởi động không lỗi (React 19 + Vite + TypeScript).

**Architecture:** Monorepo với `axon-backend/` (Spring Boot) và `axon-frontend/` (Vite + React). Infrastructure qua Docker Compose (PostgreSQL 16, Redis 7, Docker Volume cho file storage — không dùng MinIO). BE dùng Flyway cho migrations, JPA `validate` mode. FE dùng Vite proxy `/api` và `/auth` đến backend port 8080.

**Tech Stack:** Java 21, Spring Boot 3.5, JJWT 0.12.6, Flyway, PostgreSQL 16, Redis 7, React 19, TypeScript 6, Vite 8, TailwindCSS 3, Zustand 5, TanStack Query 5, Axios 1.

**Đã hoàn thành trước đó:**
- `docker-compose.yml`
- `axon-backend/Dockerfile`, `axon-frontend/Dockerfile`
- `axon-backend/pom.xml`
- `axon-backend/src/main/resources/application.yml`, `application-dev.yml`
- `axon-backend/src/main/java/com/axon/AxonBackendApplication.java`

---

## File Map

### axon-backend (tạo mới)
```
src/main/java/com/axon/
├── config/
│   ├── SecurityConfig.java
│   ├── StorageConfig.java
│   ├── RedisConfig.java
│   └── AsyncConfig.java
├── auth/
│   ├── jwt/
│   │   ├── JwtService.java
│   │   └── JwtAuthFilter.java        (stub)
│   ├── sso/
│   │   ├── SSOProvider.java          (stub interface)
│   │   ├── SSOUserInfo.java          (stub record)
│   │   └── MockSSOProvider.java      (stub)
│   ├── AuthController.java           (stub)
│   └── AuthService.java              (stub)
├── user/package-info.java
├── lookup/
│   ├── job/package-info.java
│   ├── aicapability/package-info.java
│   ├── workcategory/package-info.java
│   └── work/package-info.java
├── bestpractice/package-info.java
├── file/package-info.java
├── management/package-info.java
├── interaction/package-info.java
├── analytics/package-info.java
├── dashboard/package-info.java
├── masterdata/package-info.java
├── aiinsight/package-info.java
└── notification/package-info.java

src/main/resources/db/migration/
├── V1__create_lookup_tables.sql
├── V2__create_users.sql
├── V3__create_best_practices.sql
├── V4__create_junction_tables.sql
├── V5__create_bp_files.sql
├── V6__create_bp_likes.sql
├── V7__create_bp_feedback.sql
├── V8__create_bp_downloads.sql
├── V9__create_bp_reviews.sql
└── V10__seed_data.sql

src/test/java/com/axon/
└── auth/jwt/JwtServiceTest.java

axon-backend/.gitignore
```

### axon-frontend (tạo mới)
```
axon-frontend/
├── .gitignore
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── index.html
└── src/
    ├── index.css
    ├── main.tsx
    ├── App.tsx
    ├── types/index.ts
    ├── store/authStore.ts
    ├── api/
    │   ├── client.ts
    │   └── index.ts
    ├── hooks/useAuth.ts
    ├── components/layout/Layout.tsx
    └── pages/
        ├── auth/LoginPage.tsx
        ├── auth/AuthCallback.tsx
        ├── library/LibraryPage.tsx
        ├── detail/DetailPage.tsx
        ├── register/RegisterPage.tsx
        ├── my-practice/MyPracticePage.tsx
        ├── manage/ManagementPage.tsx
        ├── dashboard/DashboardPage.tsx
        ├── admin/AdminPage.tsx
        ├── admin/MasterDataPage.tsx
        └── admin/UserManagementPage.tsx
```

---

## Task 1: BE Config Classes

**Files:**
- Create: `axon-backend/src/main/java/com/axon/config/SecurityConfig.java`
- Create: `axon-backend/src/main/java/com/axon/config/StorageConfig.java`
- Create: `axon-backend/src/main/java/com/axon/config/RedisConfig.java`
- Create: `axon-backend/src/main/java/com/axon/config/AsyncConfig.java`
- Create: `axon-backend/.gitignore`

- [ ] **Step 1.1: Tạo SecurityConfig.java (P0 stub — permit-all)**

```java
// axon-backend/src/main/java/com/axon/config/SecurityConfig.java
package com.axon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

- [ ] **Step 1.2: Tạo StorageConfig.java**

```java
// axon-backend/src/main/java/com/axon/config/StorageConfig.java
package com.axon.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
@ConfigurationProperties(prefix = "storage")
@Getter
@Setter
public class StorageConfig {

    private String volumeBasePath;

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(volumeBasePath));
    }
}
```

- [ ] **Step 1.3: Tạo RedisConfig.java**

```java
// axon-backend/src/main/java/com/axon/config/RedisConfig.java
package com.axon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

- [ ] **Step 1.4: Tạo AsyncConfig.java**

```java
// axon-backend/src/main/java/com/axon/config/AsyncConfig.java
package com.axon.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig implements AsyncConfigurer {

    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("axon-async-");
        executor.initialize();
        return executor;
    }
}
```

- [ ] **Step 1.5: Tạo axon-backend/.gitignore**

```
HELP.md
target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/
.env
*.env.local
.DS_Store
*.iml
.idea/
```

- [ ] **Step 1.6: Commit**

```bash
git add axon-backend/src/main/java/com/axon/config/ axon-backend/.gitignore
git commit -m "feat(p0): BE config classes — Security permit-all, StorageConfig, Redis, Async"
```

---

## Task 2: JwtService — Test First

**Files:**
- Create: `axon-backend/src/test/java/com/axon/auth/jwt/JwtServiceTest.java`
- Create: `axon-backend/src/main/java/com/axon/auth/jwt/JwtService.java`

- [ ] **Step 2.1: Tạo JwtServiceTest.java (failing)**

```java
// axon-backend/src/test/java/com/axon/auth/jwt/JwtServiceTest.java
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
```

- [ ] **Step 2.2: Chạy test để xác nhận FAIL**

```bash
cd axon-backend && mvn test -pl . -Dtest=JwtServiceTest -q 2>&1 | tail -20
```

Expected: `COMPILATION ERROR` — `JwtService` chưa tồn tại.

- [ ] **Step 2.3: Tạo JwtService.java**

```java
// axon-backend/src/main/java/com/axon/auth/jwt/JwtService.java
package com.axon.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import io.jsonwebtoken.security.Keys;

@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-ttl}")
    private long accessTokenTtl;

    @Value("${jwt.refresh-token-ttl}")
    private long refreshTokenTtl;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

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
            log.debug("Invalid JWT token: {}", e.getMessage());
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
}
```

- [ ] **Step 2.4: Chạy test để xác nhận PASS**

```bash
cd axon-backend && mvn test -Dtest=JwtServiceTest -q 2>&1 | tail -10
```

Expected output:
```
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

- [ ] **Step 2.5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/auth/jwt/JwtService.java \
        axon-backend/src/test/java/com/axon/auth/jwt/JwtServiceTest.java
git commit -m "feat(p0): JwtService — generate/validate access+refresh tokens (TDD)"
```

---

## Task 3: Auth Package Stubs

**Files:**
- Create: `axon-backend/src/main/java/com/axon/auth/jwt/JwtAuthFilter.java`
- Create: `axon-backend/src/main/java/com/axon/auth/sso/SSOProvider.java`
- Create: `axon-backend/src/main/java/com/axon/auth/sso/SSOUserInfo.java`
- Create: `axon-backend/src/main/java/com/axon/auth/sso/MockSSOProvider.java`
- Create: `axon-backend/src/main/java/com/axon/auth/AuthController.java`
- Create: `axon-backend/src/main/java/com/axon/auth/AuthService.java`

- [ ] **Step 3.1: Tạo JwtAuthFilter.java (stub — P1)**

```java
// axon-backend/src/main/java/com/axon/auth/jwt/JwtAuthFilter.java
package com.axon.auth.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// P1: Validate Bearer token, set SecurityContext
public class JwtAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(request, response);
    }
}
```

- [ ] **Step 3.2: Tạo SSOProvider.java (interface stub)**

```java
// axon-backend/src/main/java/com/axon/auth/sso/SSOProvider.java
package com.axon.auth.sso;

// P1: exchange(code) → SSOUserInfo
public interface SSOProvider {
    SSOUserInfo exchange(String code);
}
```

- [ ] **Step 3.3: Tạo SSOUserInfo.java (record stub)**

```java
// axon-backend/src/main/java/com/axon/auth/sso/SSOUserInfo.java
package com.axon.auth.sso;

// P1: user info returned from SSO provider
public record SSOUserInfo(
    String email,
    String name,
    String cipId,
    String avatarUrl,
    String department
) {}
```

- [ ] **Step 3.4: Tạo MockSSOProvider.java (stub)**

```java
// axon-backend/src/main/java/com/axon/auth/sso/MockSSOProvider.java
package com.axon.auth.sso;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

// P1: Hardcoded 4 users for dev testing
// user=user1 → USER, creator1 → AX_CREATOR, supporter1 → AX_SUPPORTER, admin1 → ADMIN
@Component
@Profile("dev")
public class MockSSOProvider implements SSOProvider {

    @Override
    public SSOUserInfo exchange(String code) {
        throw new UnsupportedOperationException("MockSSOProvider not implemented yet — P1");
    }
}
```

- [ ] **Step 3.5: Tạo AuthController.java (stub)**

```java
// axon-backend/src/main/java/com/axon/auth/AuthController.java
package com.axon.auth;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// P1: POST /auth/login, GET /auth/callback, POST /auth/refresh, POST /auth/logout, GET /auth/me
@RestController
@RequestMapping("/auth")
public class AuthController {
}
```

- [ ] **Step 3.6: Tạo AuthService.java (stub)**

```java
// axon-backend/src/main/java/com/axon/auth/AuthService.java
package com.axon.auth;

import org.springframework.stereotype.Service;

// P1: orchestrate SSO → upsert user → issue JWT pair
@Service
public class AuthService {
}
```

- [ ] **Step 3.7: Commit**

```bash
git add axon-backend/src/main/java/com/axon/auth/
git commit -m "feat(p0): auth package stubs — JwtAuthFilter, SSOProvider, MockSSOProvider, AuthController"
```

---

## Task 4: Domain Package Stubs

**Files:** `package-info.java` cho mỗi domain package theo DLD §2.

- [ ] **Step 4.1: Tạo tất cả package-info.java**

```java
// axon-backend/src/main/java/com/axon/user/package-info.java
// P2+: User entity, UserRepository, UserService, AdminUserController
package com.axon.user;
```

```java
// axon-backend/src/main/java/com/axon/lookup/package-info.java
// P2: Job, WorkCategory, Work, AiCapability CRUD
package com.axon.lookup;
```

```java
// axon-backend/src/main/java/com/axon/lookup/job/package-info.java
package com.axon.lookup.job;
```

```java
// axon-backend/src/main/java/com/axon/lookup/aicapability/package-info.java
package com.axon.lookup.aicapability;
```

```java
// axon-backend/src/main/java/com/axon/lookup/workcategory/package-info.java
package com.axon.lookup.workcategory;
```

```java
// axon-backend/src/main/java/com/axon/lookup/work/package-info.java
package com.axon.lookup.work;
```

```java
// axon-backend/src/main/java/com/axon/bestpractice/package-info.java
// P3+: BestPractice entity, BestPracticeService, BestPracticeController, MyBestPracticeController
package com.axon.bestpractice;
```

```java
// axon-backend/src/main/java/com/axon/file/package-info.java
// P3: BpFile entity, FileService (Docker volume local filesystem), FileController
package com.axon.file;
```

```java
// axon-backend/src/main/java/com/axon/management/package-info.java
// P4: BpReview entity, ManagementService (approve/reject/close), ManagementController
package com.axon.management;
```

```java
// axon-backend/src/main/java/com/axon/interaction/package-info.java
// P6: BpLike, BpFeedback, BpDownload entities, InteractionService
package com.axon.interaction;
```

```java
// axon-backend/src/main/java/com/axon/analytics/package-info.java
// P5: AnalyticsService, AnalyticsController — BP analytics for AX Creator
package com.axon.analytics;
```

```java
// axon-backend/src/main/java/com/axon/dashboard/package-info.java
// P7: DashboardService (Redis cache TTL 15m), DashboardController
package com.axon.dashboard;
```

```java
// axon-backend/src/main/java/com/axon/masterdata/package-info.java
// P2: Admin CRUD for Job, WorkCategory, Work, AiCapability; bulk upload Excel/CSV
package com.axon.masterdata;
```

```java
// axon-backend/src/main/java/com/axon/aiinsight/package-info.java
// P9: AiInsightController — GET /api/v1/ai-insight (hardcoded, no DB)
package com.axon.aiinsight;
```

```java
// axon-backend/src/main/java/com/axon/notification/package-info.java
// P4: NotificationService interface, EmailNotificationService impl (JavaMailSender)
package com.axon.notification;
```

- [ ] **Step 4.2: Commit**

```bash
git add axon-backend/src/main/java/com/axon/user/ \
        axon-backend/src/main/java/com/axon/lookup/ \
        axon-backend/src/main/java/com/axon/bestpractice/ \
        axon-backend/src/main/java/com/axon/file/ \
        axon-backend/src/main/java/com/axon/management/ \
        axon-backend/src/main/java/com/axon/interaction/ \
        axon-backend/src/main/java/com/axon/analytics/ \
        axon-backend/src/main/java/com/axon/dashboard/ \
        axon-backend/src/main/java/com/axon/masterdata/ \
        axon-backend/src/main/java/com/axon/aiinsight/ \
        axon-backend/src/main/java/com/axon/notification/
git commit -m "feat(p0): domain package stubs — all packages per DLD §2"
```

---

## Task 5: Flyway V1–V3

**Files:**
- Create: `axon-backend/src/main/resources/db/migration/V1__create_lookup_tables.sql`
- Create: `axon-backend/src/main/resources/db/migration/V2__create_users.sql`
- Create: `axon-backend/src/main/resources/db/migration/V3__create_best_practices.sql`

- [ ] **Step 5.1: Tạo V1__create_lookup_tables.sql**

```sql
-- V1: Lookup tables
-- Thêm display_order, is_active, updated_at so với DLD gốc để dễ mở rộng

CREATE TABLE jobs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(256) NOT NULL UNIQUE,
    description  TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_capabilities (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(256) NOT NULL UNIQUE,
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE work_categories (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       UUID NOT NULL REFERENCES jobs(id),
    name         VARCHAR(256) NOT NULL,
    description  TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, name)
);

CREATE TABLE works (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id           UUID NOT NULL REFERENCES jobs(id),
    work_category_id UUID NOT NULL REFERENCES work_categories(id),
    name             VARCHAR(256) NOT NULL,
    code             VARCHAR(50) NOT NULL UNIQUE,
    description      TEXT,
    display_order    INT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 5.2: Tạo V2__create_users.sql**

```sql
-- V2: Users
CREATE TYPE user_role AS ENUM ('USER', 'AX_CREATOR', 'AX_SUPPORTER', 'ADMIN');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    cip_id        VARCHAR(100) UNIQUE,
    role          user_role NOT NULL DEFAULT 'USER',
    department    VARCHAR(256),
    avatar_url    VARCHAR(500),
    last_login_at TIMESTAMP,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_cip_id ON users(cip_id);
```

- [ ] **Step 5.3: Tạo V3__create_best_practices.sql**

```sql
-- V3: Best Practices
-- submitted_at riêng biệt với created_at — management queue sort theo ngày submit gần nhất
CREATE TYPE bp_type   AS ENUM ('WEB', 'TOOL', 'EXTENSION');
CREATE TYPE bp_status AS ENUM ('REQUESTED', 'REJECTED', 'PUBLISHED');

CREATE TABLE best_practices (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(200) NOT NULL,
    description          TEXT,
    thumbnail_url        VARCHAR(500),
    installation_guide   TEXT,
    type                 bp_type NOT NULL,
    web_content          VARCHAR(256),
    key_value            TEXT,
    ai_tools_description TEXT,
    work_id              UUID REFERENCES works(id),
    status               bp_status NOT NULL DEFAULT 'REQUESTED',
    close_reason         TEXT,
    submitted_at         TIMESTAMP,
    view_count           INT NOT NULL DEFAULT 0,
    like_count           INT NOT NULL DEFAULT 0,
    download_count       INT NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at         TIMESTAMP
);

CREATE INDEX idx_bp_status     ON best_practices(status);
CREATE INDEX idx_bp_type       ON best_practices(type);
CREATE INDEX idx_bp_work       ON best_practices(work_id);
CREATE INDEX idx_bp_like_count ON best_practices(like_count DESC);
CREATE INDEX idx_bp_view_count ON best_practices(view_count DESC);
```

- [ ] **Step 5.4: Commit**

```bash
git add axon-backend/src/main/resources/db/migration/V1__create_lookup_tables.sql \
        axon-backend/src/main/resources/db/migration/V2__create_users.sql \
        axon-backend/src/main/resources/db/migration/V3__create_best_practices.sql
git commit -m "feat(p0): Flyway V1-V3 — lookup tables, users, best_practices"
```

---

## Task 6: Flyway V4–V7

**Files:**
- Create: `axon-backend/src/main/resources/db/migration/V4__create_junction_tables.sql`
- Create: `axon-backend/src/main/resources/db/migration/V5__create_bp_files.sql`
- Create: `axon-backend/src/main/resources/db/migration/V6__create_bp_likes.sql`
- Create: `axon-backend/src/main/resources/db/migration/V7__create_bp_feedback.sql`

- [ ] **Step 6.1: Tạo V4__create_junction_tables.sql**

```sql
-- V4: Junction tables
CREATE TABLE bp_creators (
    bp_id   UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (bp_id, user_id)
);

CREATE TABLE bp_jobs (
    bp_id  UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id),
    PRIMARY KEY (bp_id, job_id)
);

CREATE TABLE bp_ai_capabilities (
    bp_id            UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    ai_capability_id UUID NOT NULL REFERENCES ai_capabilities(id),
    PRIMARY KEY (bp_id, ai_capability_id)
);
```

- [ ] **Step 6.2: Tạo V5__create_bp_files.sql**

```sql
-- V5: BP Files (Docker volume local filesystem — không dùng MinIO)
-- uploaded_by để track ai upload trong trường hợp có nhiều creators
CREATE TABLE bp_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100),
    file_path   VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bp_files_bp_id ON bp_files(bp_id);
```

- [ ] **Step 6.3: Tạo V6__create_bp_likes.sql**

```sql
-- V6: BP Likes (toggle like — unique per user per BP)
CREATE TABLE bp_likes (
    bp_id      UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bp_id, user_id)
);
```

- [ ] **Step 6.4: Tạo V7__create_bp_feedback.sql**

```sql
-- V7: BP Feedback
CREATE TABLE bp_feedback (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id      UUID NOT NULL REFERENCES best_practices(id),
    user_id    UUID NOT NULL REFERENCES users(id),
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_bp_id ON bp_feedback(bp_id);
```

- [ ] **Step 6.5: Commit**

```bash
git add axon-backend/src/main/resources/db/migration/V4__create_junction_tables.sql \
        axon-backend/src/main/resources/db/migration/V5__create_bp_files.sql \
        axon-backend/src/main/resources/db/migration/V6__create_bp_likes.sql \
        axon-backend/src/main/resources/db/migration/V7__create_bp_feedback.sql
git commit -m "feat(p0): Flyway V4-V7 — junction tables, bp_files, bp_likes, bp_feedback"
```

---

## Task 7: Flyway V8–V10

**Files:**
- Create: `axon-backend/src/main/resources/db/migration/V8__create_bp_downloads.sql`
- Create: `axon-backend/src/main/resources/db/migration/V9__create_bp_reviews.sql`
- Create: `axon-backend/src/main/resources/db/migration/V10__seed_data.sql`

- [ ] **Step 7.1: Tạo V8__create_bp_downloads.sql**

```sql
-- V8: BP Downloads (async tracking sau khi stream file thành công)
CREATE TABLE bp_downloads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id         UUID NOT NULL REFERENCES best_practices(id),
    user_id       UUID NOT NULL REFERENCES users(id),
    downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_downloads_bp_id ON bp_downloads(bp_id);
CREATE INDEX idx_downloads_date  ON bp_downloads(downloaded_at DESC);
```

- [ ] **Step 7.2: Tạo V9__create_bp_reviews.sql**

```sql
-- V9: BP Review History
-- action CLOSED = BP PUBLISHED → REJECTED bởi supporter (close action)
-- action REJECTED = BP REQUESTED → REJECTED bởi reviewer
-- Phân biệt close vs reject qua action field, không qua bp_status
CREATE TYPE review_action AS ENUM ('APPROVED', 'REJECTED', 'CLOSED');

CREATE TABLE bp_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id),
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action      review_action NOT NULL,
    comment     TEXT,
    reviewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_bp_id ON bp_reviews(bp_id);
```

- [ ] **Step 7.3: Tạo V10__seed_data.sql**

```sql
-- V10: Seed data — 4 jobs, 5 AI capabilities (là default)
INSERT INTO jobs (name, display_order) VALUES
    ('Code Implementation', 1),
    ('Research',            2),
    ('Operation',           3),
    ('Report',              4);

INSERT INTO ai_capabilities (name, is_default, display_order) VALUES
    ('Q&A',                          TRUE, 1),
    ('Workflow Assistant',            TRUE, 2),
    ('Autonomous AI Agent',           TRUE, 3),
    ('AI-based Tools & Applications', TRUE, 4),
    ('AI Orchestration',              TRUE, 5);
```

- [ ] **Step 7.4: Commit**

```bash
git add axon-backend/src/main/resources/db/migration/V8__create_bp_downloads.sql \
        axon-backend/src/main/resources/db/migration/V9__create_bp_reviews.sql \
        axon-backend/src/main/resources/db/migration/V10__seed_data.sql
git commit -m "feat(p0): Flyway V8-V10 — bp_downloads, bp_reviews, seed data"
```

---

## Task 8: Frontend Config Files

**Files:**
- Create: `axon-frontend/.gitignore`
- Create: `axon-frontend/package.json`
- Create: `axon-frontend/vite.config.ts`
- Create: `axon-frontend/tsconfig.json`
- Create: `axon-frontend/tsconfig.app.json`
- Create: `axon-frontend/tsconfig.node.json`
- Create: `axon-frontend/tailwind.config.js`
- Create: `axon-frontend/postcss.config.js`
- Create: `axon-frontend/eslint.config.js`
- Create: `axon-frontend/index.html`

- [ ] **Step 8.1: Tạo axon-frontend/.gitignore**

```
node_modules/
dist/
.env*.local
*.local
.DS_Store
```

- [ ] **Step 8.2: Tạo package.json**

```json
{
  "name": "axon-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.100.9",
    "axios": "^1.16.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-router-dom": "^7.15.0",
    "zustand": "^5.0.13"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/typography": "^0.5.19",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.5.0",
    "eslint": "^10.2.1",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.5.0",
    "postcss": "^8.5.14",
    "tailwindcss": "^3.4.1",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.58.2",
    "vite": "^8.0.10"
  }
}
```

- [ ] **Step 8.3: Tạo vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 8.4: Tạo tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 8.5: Tạo tsconfig.app.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

- [ ] **Step 8.6: Tạo tsconfig.node.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 8.7: Tạo tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 8.8: Tạo postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 8.9: Tạo eslint.config.js**

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
```

- [ ] **Step 8.10: Tạo index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AXon — Best Practice Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8.11: Commit**

```bash
git add axon-frontend/.gitignore axon-frontend/package.json axon-frontend/vite.config.ts \
        axon-frontend/tsconfig*.json axon-frontend/tailwind.config.js \
        axon-frontend/postcss.config.js axon-frontend/eslint.config.js axon-frontend/index.html
git commit -m "feat(p0): FE config — package.json, Vite, TypeScript, Tailwind, ESLint"
```

---

## Task 9: Frontend Types + Store + API Client

**Files:**
- Create: `axon-frontend/src/types/index.ts`
- Create: `axon-frontend/src/store/authStore.ts`
- Create: `axon-frontend/src/api/client.ts`
- Create: `axon-frontend/src/api/index.ts`
- Create: `axon-frontend/src/hooks/useAuth.ts`

- [ ] **Step 9.1: Tạo src/types/index.ts**

```typescript
// axon-frontend/src/types/index.ts
export type BPType = 'WEB' | 'TOOL' | 'EXTENSION';
export type BPStatus = 'REQUESTED' | 'REJECTED' | 'PUBLISHED';
export type UserRole = 'USER' | 'AX_CREATOR' | 'AX_SUPPORTER' | 'ADMIN';
export type ReviewAction = 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  department?: string;
}

export interface Job {
  id: string;
  name: string;
  display_order?: number;
}

export interface AiCapability {
  id: string;
  name: string;
  is_default?: boolean;
}

export interface WorkCategory {
  id: string;
  name: string;
}

export interface Work {
  id: string;
  name: string;
  code: string;
  work_category: WorkCategory;
}

export interface BpFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface BestPracticeListItem {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  type: BPType;
  status: BPStatus;
  job: Job[];
  work?: Work;
  creators: Pick<User, 'id' | 'name' | 'avatar_url'>[];
  like_count: number;
  view_count: number;
  download_count: number;
  is_liked_by_current_user: boolean;
  published_at?: string;
}

export interface BestPractice extends BestPracticeListItem {
  installation_guide?: string;
  web_content?: string;
  key_value?: string;
  ai_capability: AiCapability[];
  ai_tools_description?: string;
  close_reason?: string;
  files: BpFile[];
  created_at: string;
}

export interface BestPracticeRequest {
  name: string;
  description: string;
  thumbnail_url?: string;
  installation_guide?: string;
  type: BPType;
  web_content?: string;
  key_value?: string;
  ai_tools_description?: string;
  work_id?: string;
  job_ids: string[];
  ai_capability_ids: string[];
  creator_ids: string[];
}

export interface Feedback {
  id: string;
  content: string;
  user: Pick<User, 'id' | 'name' | 'avatar_url'>;
  created_at: string;
}

export interface BpReview {
  id: string;
  action: ReviewAction;
  comment?: string;
  reviewer: Pick<User, 'id' | 'name'>;
  reviewed_at: string;
}

export interface Analytics {
  view_count: number;
  download_count: number;
  like_count: number;
  feedback_count: number;
  recent_feedback: Feedback[];
  downloads_by_week: { week: string; count: number }[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
}

export interface DashboardStats {
  total_submitters: number;
  total_published_bps: number;
  by_job: { job: Job; count: number }[];
  by_ai_capability: { capability: AiCapability; count: number }[];
  by_department: { department: string; count: number }[];
  top5_bps_by_work: { work: Work; bp_count: number }[];
  total_usage: number;
  active_users: number;
  usage_trend: { month: string; count: number }[];
  top5_usage: { bp: Pick<BestPracticeListItem, 'id' | 'name'>; usage_count: number }[];
}

export interface AiInsightClassification {
  name: string;
  description: string;
  embodiments: string[];
  scope: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}
```

- [ ] **Step 9.2: Tạo src/store/authStore.ts**

```typescript
// axon-frontend/src/store/authStore.ts
// accessToken lưu in-memory (không localStorage — tránh XSS)
// refreshToken được set bởi backend qua HttpOnly cookie
import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true }),

  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),

  setUser: (user) => set({ user }),

  setAccessToken: (accessToken) => set({ accessToken }),
}));
```

- [ ] **Step 9.3: Tạo src/api/client.ts**

```typescript
// axon-frontend/src/api/client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      const newToken: string = data.access_token;
      useAuthStore.getState().setAccessToken(newToken);
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
```

- [ ] **Step 9.4: Tạo src/api/index.ts**

```typescript
// axon-frontend/src/api/index.ts
import { apiClient } from './client';
import type {
  BestPractice, BestPracticeListItem, BestPracticeRequest,
  Feedback, PagedResponse, User, Job, AiCapability, Work, WorkCategory,
  DashboardStats, AiInsightClassification, TokenResponse, Analytics,
} from '../types';

// Auth
export const loginMock = (user: string) =>
  apiClient.post<TokenResponse>(`/auth/login?user=${user}`);

export const logout = () =>
  apiClient.post<void>('/auth/logout');

export const getMe = () =>
  apiClient.get<User>('/auth/me');

// Best Practices
export const getBestPractices = (params?: Record<string, unknown>) =>
  apiClient.get<PagedResponse<BestPracticeListItem>>('/api/v1/best-practices', { params });

export const getBestPractice = (id: string) =>
  apiClient.get<BestPractice>(`/api/v1/best-practices/${id}`);

export const createBestPractice = (data: BestPracticeRequest) =>
  apiClient.post<BestPractice>('/api/v1/best-practices', data);

export const updateBestPractice = (id: string, data: Partial<BestPracticeRequest>) =>
  apiClient.put<BestPractice>(`/api/v1/best-practices/${id}`, data);

export const deleteBestPractice = (id: string) =>
  apiClient.delete<void>(`/api/v1/best-practices/${id}`);

export const toggleLike = (id: string) =>
  apiClient.post<{ like_count: number; is_liked: boolean }>(`/api/v1/best-practices/${id}/like`);

export const getMyBestPractices = (params?: Record<string, unknown>) =>
  apiClient.get<PagedResponse<BestPracticeListItem>>('/api/v1/my-best-practices', { params });

export const getBpAnalytics = (id: string) =>
  apiClient.get<Analytics>(`/api/v1/best-practices/${id}/analytics`);

// Feedback
export const getFeedback = (bpId: string, params?: Record<string, unknown>) =>
  apiClient.get<PagedResponse<Feedback>>(`/api/v1/best-practices/${bpId}/feedback`, { params });

export const submitFeedback = (bpId: string, content: string) =>
  apiClient.post<Feedback>(`/api/v1/best-practices/${bpId}/feedback`, { content });

// Management (AX_SUPPORTER+)
export const getManagementBestPractices = (params?: Record<string, unknown>) =>
  apiClient.get<PagedResponse<BestPracticeListItem>>('/api/v1/management/best-practices', { params });

export const approveBestPractice = (id: string) =>
  apiClient.put<BestPractice>(`/api/v1/management/best-practices/${id}/approve`);

export const rejectBestPractice = (id: string, comment: string) =>
  apiClient.put<BestPractice>(`/api/v1/management/best-practices/${id}/reject`, { comment });

export const closeBestPractice = (id: string, reason: string) =>
  apiClient.put<BestPractice>(`/api/v1/management/best-practices/${id}/close`, { reason });

// Lookup / Reference Data
export const getJobs = () =>
  apiClient.get<Job[]>('/api/v1/jobs');

export const getAiCapabilities = () =>
  apiClient.get<AiCapability[]>('/api/v1/ai-capabilities');

export const getWorkCategories = () =>
  apiClient.get<WorkCategory[]>('/api/v1/work-categories');

export const getWorks = (workCategoryId?: string) =>
  apiClient.get<Work[]>('/api/v1/works', { params: { workCategoryId } });

// Dashboard
export const getDashboard = (params?: { startDate?: string; endDate?: string }) =>
  apiClient.get<DashboardStats>('/api/v1/dashboard', { params });

// AI Insight
export const getAiInsight = () =>
  apiClient.get<{ classifications: AiInsightClassification[] }>('/api/v1/ai-insight');

// Admin — Users
export const getAdminUsers = (params?: Record<string, unknown>) =>
  apiClient.get<PagedResponse<User>>('/api/v1/admin/users', { params });

export const updateUserRole = (userId: string, role: string) =>
  apiClient.put<User>(`/api/v1/admin/users/${userId}/role`, { role });
```

- [ ] **Step 9.5: Tạo src/hooks/useAuth.ts**

```typescript
// axon-frontend/src/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';

export const useIsCreator = () => {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'AX_CREATOR' || role === 'AX_SUPPORTER' || role === 'ADMIN';
};

export const useIsSupporter = () => {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'AX_SUPPORTER' || role === 'ADMIN';
};

export const useIsAdmin = () => {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'ADMIN';
};
```

- [ ] **Step 9.6: Commit**

```bash
git add axon-frontend/src/types/ axon-frontend/src/store/ \
        axon-frontend/src/api/ axon-frontend/src/hooks/
git commit -m "feat(p0): FE types, authStore (in-memory token), API client (auto-refresh), hooks"
```

---

## Task 10: Frontend App Shell

**Files:**
- Create: `axon-frontend/src/index.css`
- Create: `axon-frontend/src/main.tsx`
- Create: `axon-frontend/src/App.tsx`
- Create: `axon-frontend/src/components/layout/Layout.tsx`

- [ ] **Step 10.1: Tạo src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10.2: Tạo src/main.tsx**

```tsx
// axon-frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 10.3: Tạo src/App.tsx**

```tsx
// axon-frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { AuthCallback } from './pages/auth/AuthCallback';
import { LibraryPage } from './pages/library/LibraryPage';
import { DetailPage } from './pages/detail/DetailPage';
import { RegisterPage } from './pages/register/RegisterPage';
import { MyPracticePage } from './pages/my-practice/MyPracticePage';
import { ManagementPage } from './pages/manage/ManagementPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AdminPage } from './pages/admin/AdminPage';
import { MasterDataPage } from './pages/admin/MasterDataPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { useAuthStore } from './store/authStore';
import type { UserRole } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireRole({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<LibraryPage />} />
            <Route path="/best-practices/:id" element={<DetailPage />} />

            {/* AX_CREATOR+ */}
            <Route path="/register" element={
              <RequireRole roles={['AX_CREATOR', 'AX_SUPPORTER', 'ADMIN']}>
                <RegisterPage />
              </RequireRole>
            } />
            <Route path="/best-practices/:id/edit" element={
              <RequireRole roles={['AX_CREATOR', 'AX_SUPPORTER', 'ADMIN']}>
                <RegisterPage />
              </RequireRole>
            } />
            <Route path="/my-practice" element={
              <RequireRole roles={['AX_CREATOR', 'AX_SUPPORTER', 'ADMIN']}>
                <MyPracticePage />
              </RequireRole>
            } />

            {/* AX_SUPPORTER+ */}
            <Route path="/manage" element={
              <RequireRole roles={['AX_SUPPORTER', 'ADMIN']}>
                <ManagementPage />
              </RequireRole>
            } />

            {/* All authenticated */}
            <Route path="/dashboard" element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            } />

            {/* ADMIN only */}
            <Route path="/admin" element={
              <RequireRole roles={['ADMIN']}>
                <AdminPage />
              </RequireRole>
            } />
            <Route path="/admin/master-data" element={
              <RequireRole roles={['ADMIN']}>
                <MasterDataPage />
              </RequireRole>
            } />
            <Route path="/admin/users" element={
              <RequireRole roles={['ADMIN']}>
                <UserManagementPage />
              </RequireRole>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 10.4: Tạo src/components/layout/Layout.tsx**

```tsx
// axon-frontend/src/components/layout/Layout.tsx
// P1 sẽ thêm Navbar, Sidebar khi có auth
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 10.5: Commit**

```bash
git add axon-frontend/src/index.css axon-frontend/src/main.tsx \
        axon-frontend/src/App.tsx axon-frontend/src/components/
git commit -m "feat(p0): FE app shell — main.tsx, App.tsx routes, Layout placeholder"
```

---

## Task 11: Frontend Placeholder Pages

**Files:** 11 page components — mỗi file chỉ là placeholder `<div>`.

- [ ] **Step 11.1: Tạo tất cả placeholder pages**

```tsx
// axon-frontend/src/pages/auth/LoginPage.tsx
export function LoginPage() {
  return <div className="p-8 text-center">Login Page — P1</div>;
}
```

```tsx
// axon-frontend/src/pages/auth/AuthCallback.tsx
export function AuthCallback() {
  return <div className="p-8 text-center">Auth Callback — P1</div>;
}
```

```tsx
// axon-frontend/src/pages/library/LibraryPage.tsx
export function LibraryPage() {
  return <div className="p-8">Library Page — P3</div>;
}
```

```tsx
// axon-frontend/src/pages/detail/DetailPage.tsx
export function DetailPage() {
  return <div className="p-8">Detail Page — P3</div>;
}
```

```tsx
// axon-frontend/src/pages/register/RegisterPage.tsx
export function RegisterPage() {
  return <div className="p-8">Register BP Page — P3</div>;
}
```

```tsx
// axon-frontend/src/pages/my-practice/MyPracticePage.tsx
export function MyPracticePage() {
  return <div className="p-8">My Practice Page — P5</div>;
}
```

```tsx
// axon-frontend/src/pages/manage/ManagementPage.tsx
export function ManagementPage() {
  return <div className="p-8">Management Page — P4</div>;
}
```

```tsx
// axon-frontend/src/pages/dashboard/DashboardPage.tsx
export function DashboardPage() {
  return <div className="p-8">Dashboard Page — P7</div>;
}
```

```tsx
// axon-frontend/src/pages/admin/AdminPage.tsx
export function AdminPage() {
  return <div className="p-8">Admin Page — P8/P9</div>;
}
```

```tsx
// axon-frontend/src/pages/admin/MasterDataPage.tsx
export function MasterDataPage() {
  return <div className="p-8">Master Data Management — P2</div>;
}
```

```tsx
// axon-frontend/src/pages/admin/UserManagementPage.tsx
export function UserManagementPage() {
  return <div className="p-8">User Management — P8</div>;
}
```

- [ ] **Step 11.2: Verify TypeScript compile không lỗi**

```bash
cd axon-frontend && npm install && npm run build 2>&1 | tail -20
```

Expected:
```
✓ built in Xs
```

Nếu có lỗi TypeScript: fix ngay trước khi commit.

- [ ] **Step 11.3: Commit**

```bash
git add axon-frontend/src/pages/
git commit -m "feat(p0): FE placeholder pages — all routes stubbed"
```

---

## Task 12: Integration Verification

Xác nhận P0 Definition of Done.

- [ ] **Step 12.1: Khởi động Docker Compose**

```bash
docker-compose up -d postgres redis
```

Wait 5s cho healthcheck pass.

- [ ] **Step 12.2: Verify Flyway migrations chạy**

```bash
docker-compose up axon-backend
```

Expected trong logs:
```
Successfully applied 10 migrations to schema "public"
Started AxonBackendApplication in X.XXX seconds
```

- [ ] **Step 12.3: Verify health endpoint**

```bash
curl http://localhost:8080/actuator/health
```

Expected:
```json
{"status":"UP"}
```

- [ ] **Step 12.4: Verify Swagger UI**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui.html
```

Expected: `302` (redirect to `/swagger-ui/index.html`) hoặc `200`.

- [ ] **Step 12.5: Verify FE dev server**

```bash
cd axon-frontend && npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

Expected: `200`.

- [ ] **Step 12.6: Final commit + push**

```bash
git push origin claude/setup-project-structure-F1RPi
```

Expected:
```
To http://...
   xxxxxxx..xxxxxxx  claude/setup-project-structure-F1RPi -> claude/setup-project-structure-F1RPi
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Docker Compose (PostgreSQL, Redis, Docker Volume) — Task 1 infra (already done)
- ✅ BE pom.xml đúng deps — already done
- ✅ application.yml (storage.volume-base-path, JWT, mail) — already done
- ✅ SecurityConfig permit-all — Task 1
- ✅ StorageConfig, RedisConfig, AsyncConfig — Task 1
- ✅ JwtService (thật) với TDD — Task 2
- ✅ Auth stubs (JwtAuthFilter, SSOProvider, MockSSOProvider) — Task 3
- ✅ Domain packages theo DLD §2 — Task 4
- ✅ Flyway V1-V10 với extended columns — Tasks 5-7
- ✅ FE config (package.json, Vite, TS, Tailwind) — Task 8
- ✅ FE types đầy đủ từ DLD §5.1 — Task 9
- ✅ authStore (in-memory token) — Task 9
- ✅ API client (auto-refresh 401) — Task 9
- ✅ useAuth hooks — Task 9
- ✅ App.tsx với RequireAuth/RequireRole — Task 10
- ✅ 11 placeholder pages — Task 11
- ✅ Verification — Task 12

**Type consistency:** `UserRole`, `BPType`, `BPStatus`, `ReviewAction` defined in Task 9, dùng nhất quán trong App.tsx (Task 10) và api/index.ts (Task 9). ✅

**No placeholders in code:** Tất cả stubs có comment `// PX: ...` rõ ràng. ✅
