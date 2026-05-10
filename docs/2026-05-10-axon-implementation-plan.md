# AXon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng AXon — web platform nội bộ để chia sẻ AI best practice, có quy trình kiểm duyệt, ranking theo usage, và tích hợp Agent Builder.

**Architecture:** React 18 SPA giao tiếp với Spring Boot 3 REST API. Backend quản lý auth (SSO pluggable → JWT), CRUD best practice, file storage qua MinIO, approval workflow state machine, và ranking scheduled job. Redis cache trending results.

**Tech Stack:** Java 21 + Spring Boot 3 + Spring Security | React 18 + TypeScript + Vite + TailwindCSS | PostgreSQL 16 | Redis 7 | MinIO | Docker Compose

---

## File Structure

### Backend (`axon-backend/`)
```
src/main/java/com/axon/
├── AXonApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── RedisConfig.java
│   ├── MinioConfig.java
│   └── SchedulingConfig.java
├── auth/
│   ├── sso/SSOProvider.java          (interface)
│   ├── sso/SSOUserInfo.java          (record)
│   ├── sso/MockSSOProvider.java
│   ├── jwt/JwtService.java
│   ├── jwt/JwtAuthFilter.java
│   ├── AuthController.java
│   ├── AuthService.java
│   └── dto/TokenResponse.java
├── user/
│   ├── User.java                     (entity)
│   ├── UserRole.java                 (enum)
│   ├── UserRepository.java
│   ├── UserService.java
│   └── AdminUserController.java
├── bestpractice/
│   ├── BestPractice.java             (entity)
│   ├── BestPracticeType.java         (enum)
│   ├── BestPracticeStatus.java       (enum)
│   ├── BestPracticeRepository.java
│   ├── BestPracticeService.java
│   ├── BestPracticeController.java
│   └── dto/
│       ├── BestPracticeRequest.java
│       ├── BestPracticeResponse.java
│       ├── BestPracticeListItem.java
│       └── ExternalLink.java
├── file/
│   ├── BestPracticeFile.java         (entity)
│   ├── BestPracticeFileRepository.java
│   ├── FileService.java
│   ├── FileController.java
│   └── dto/FileResponse.java
├── approval/
│   ├── Approval.java                 (entity)
│   ├── ApprovalStatus.java           (enum)
│   ├── ApprovalRepository.java
│   ├── ApprovalService.java
│   └── AdminBestPracticeController.java
├── usage/
│   ├── UsageLog.java                 (entity)
│   ├── UsageAction.java              (enum)
│   ├── UsageLogRepository.java
│   ├── UsageService.java
│   └── RankingScheduler.java
├── agentbuilder/
│   ├── AgentBuilderClient.java
│   ├── AgentBuilderController.java
│   └── dto/WorkflowInfo.java
└── notification/
    ├── NotificationService.java      (interface)
    └── EmailNotificationService.java

src/main/resources/
├── application.yml
├── application-dev.yml
└── db/migration/
    ├── V1__create_users.sql
    ├── V2__create_best_practices.sql
    ├── V3__create_files.sql
    ├── V4__create_approvals.sql
    └── V5__create_usage_logs.sql

src/test/java/com/axon/
├── auth/AuthServiceTest.java
├── bestpractice/BestPracticeServiceTest.java
├── approval/ApprovalServiceTest.java
└── usage/RankingSchedulerTest.java
```

### Frontend (`axon-frontend/`)
```
src/
├── main.tsx
├── App.tsx
├── api/
│   ├── client.ts
│   ├── bestPractices.ts
│   ├── auth.ts
│   ├── admin.ts
│   └── agentBuilder.ts
├── types/index.ts
├── store/authStore.ts
├── components/
│   ├── layout/Header.tsx
│   ├── layout/Layout.tsx
│   ├── BestPracticeCard.tsx
│   ├── TypeBadge.tsx
│   ├── StatusBadge.tsx
│   ├── StatusTimeline.tsx
│   ├── FileList.tsx
│   ├── RankingBadge.tsx
│   └── AgentWorkflowEmbed.tsx
└── pages/
    ├── BrowsePage.tsx
    ├── DetailPage.tsx
    ├── SubmitPage.tsx
    ├── MySubmissionsPage.tsx
    ├── admin/AdminDashboard.tsx
    ├── admin/ReviewPage.tsx
    └── auth/SSOCallback.tsx
```

---

## Phase 1 — Foundation

### Task 1: Project Scaffolding + Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `axon-backend/pom.xml`
- Create: `axon-backend/src/main/resources/application.yml`
- Create: `axon-backend/src/main/resources/application-dev.yml`
- Create: `axon-frontend/package.json`
- Create: `axon-frontend/vite.config.ts`
- Create: `axon-frontend/tailwind.config.ts`

- [ ] **Step 1: Tạo Spring Boot project**

Dùng Spring Initializr (https://start.spring.io) với:
- Java 21, Maven
- Dependencies: Spring Web, Spring Data JPA, Spring Security, PostgreSQL Driver, Flyway, Spring Data Redis, Lombok, Spring Boot Actuator, Testcontainers (test scope)

Hoặc dùng CLI:
```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.4.0 \
  -d groupId=com.axon \
  -d artifactId=axon-backend \
  -d javaVersion=21 \
  -d dependencies=web,data-jpa,security,postgresql,flyway,data-redis,lombok,actuator \
  -o axon-backend.zip
unzip axon-backend.zip -d axon-backend
```

Thêm dependencies bổ sung vào `pom.xml`:
```xml
<!-- JWT -->
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-api</artifactId>
  <version>0.12.6</version>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-impl</artifactId>
  <version>0.12.6</version>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-jackson</artifactId>
  <version>0.12.6</version>
  <scope>runtime</scope>
</dependency>
<!-- MinIO -->
<dependency>
  <groupId>io.minio</groupId>
  <artifactId>minio</artifactId>
  <version>8.5.12</version>
</dependency>
<!-- Testcontainers -->
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <scope>test</scope>
</dependency>
```

- [ ] **Step 2: Tạo application.yml**

```yaml
# src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/axon
    username: ${DB_USER:axon}
    password: ${DB_PASSWORD:axon}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379

minio:
  endpoint: ${MINIO_ENDPOINT:http://localhost:9000}
  access-key: ${MINIO_ACCESS_KEY:minioadmin}
  secret-key: ${MINIO_SECRET_KEY:minioadmin}
  bucket: axon-files

jwt:
  secret: ${JWT_SECRET:dev-secret-key-32-chars-minimum!!}
  access-token-ttl: 900
  refresh-token-ttl: 604800

agent-builder:
  base-url: ${AGENT_BUILDER_URL:http://localhost:9090}
  api-key: ${AGENT_BUILDER_API_KEY:dev-key}

management:
  endpoints:
    web:
      exposure:
        include: health,info
```

```yaml
# src/main/resources/application-dev.yml
spring:
  jpa:
    show-sql: true
logging:
  level:
    com.axon: DEBUG
```

- [ ] **Step 3: Tạo Vite + React + TypeScript frontend**

```bash
npm create vite@latest axon-frontend -- --template react-ts
cd axon-frontend
npm install
npm install axios zustand @tanstack/react-query react-router-dom
npm install -D tailwindcss @tailwindcss/typography autoprefixer postcss
npx tailwindcss init -p
```

`tailwind.config.ts`:
```typescript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
}
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
    },
  },
})
```

- [ ] **Step 4: Tạo Docker Compose**

```yaml
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: axon
      POSTGRES_USER: axon
      POSTGRES_PASSWORD: axon
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "axon"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: [miniodata:/data]

volumes:
  pgdata:
  miniodata:
```

- [ ] **Step 5: Start infrastructure và kiểm tra**

```bash
docker compose up -d
# Kiểm tra postgres
docker compose exec postgres pg_isready -U axon
# Expected: /var/run/postgresql:5432 - accepting connections

# Kiểm tra MinIO console
open http://localhost:9001
# Login: minioadmin / minioadmin → tạo bucket "axon-files"
```

- [ ] **Step 6: Commit**

```bash
git init
git add docker-compose.yml axon-backend/ axon-frontend/
git commit -m "feat: project scaffolding — Spring Boot + React + Docker Compose"
```

---

### Task 2: Database Migrations (Flyway)

**Files:**
- Create: `axon-backend/src/main/resources/db/migration/V1__create_users.sql`
- Create: `axon-backend/src/main/resources/db/migration/V2__create_best_practices.sql`
- Create: `axon-backend/src/main/resources/db/migration/V3__create_files.sql`
- Create: `axon-backend/src/main/resources/db/migration/V4__create_approvals.sql`
- Create: `axon-backend/src/main/resources/db/migration/V5__create_usage_logs.sql`

- [ ] **Step 1: Viết V1__create_users.sql**

```sql
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    name         VARCHAR(255) NOT NULL,
    role         user_role NOT NULL DEFAULT 'USER',
    sso_provider VARCHAR(50),
    sso_subject  VARCHAR(255),
    avatar_url   VARCHAR(500),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (sso_provider, sso_subject)
);

CREATE INDEX idx_users_email ON users(email);
```

- [ ] **Step 2: Viết V2__create_best_practices.sql**

```sql
CREATE TYPE bp_type AS ENUM ('SKILL_SET', 'MCP_CONFIG', 'RULE_SET', 'AGENT_WORKFLOW');
CREATE TYPE bp_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'UNDER_REVIEW', 'PUBLISHED', 'REJECTED');

CREATE TABLE best_practices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title             VARCHAR(200) NOT NULL,
    description       TEXT,
    type              bp_type NOT NULL,
    status            bp_status NOT NULL DEFAULT 'DRAFT',
    author_id         UUID NOT NULL REFERENCES users(id),
    usage_guide       TEXT,
    install_guide     TEXT,
    external_links    JSONB NOT NULL DEFAULT '[]'::jsonb,
    agent_workflow_id VARCHAR(100),
    tags              TEXT[] NOT NULL DEFAULT '{}',
    view_count        INTEGER NOT NULL DEFAULT 0,
    download_count    INTEGER NOT NULL DEFAULT 0,
    usage_score       FLOAT NOT NULL DEFAULT 0.0,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at      TIMESTAMP
);

CREATE INDEX idx_bp_status ON best_practices(status);
CREATE INDEX idx_bp_type ON best_practices(type);
CREATE INDEX idx_bp_usage_score ON best_practices(usage_score DESC);
CREATE INDEX idx_bp_author ON best_practices(author_id);
CREATE INDEX idx_bp_tags ON best_practices USING GIN(tags);
```

- [ ] **Step 3: Viết V3, V4, V5**

```sql
-- V3__create_files.sql
CREATE TABLE best_practice_files (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    best_practice_id UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    file_name        VARCHAR(255) NOT NULL,
    file_size        BIGINT NOT NULL,
    mime_type        VARCHAR(100),
    storage_key      VARCHAR(500) NOT NULL,
    uploaded_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_files_bp_id ON best_practice_files(best_practice_id);
```

```sql
-- V4__create_approvals.sql
CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE approvals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    best_practice_id UUID NOT NULL REFERENCES best_practices(id),
    reviewer_id      UUID REFERENCES users(id),
    status           approval_status NOT NULL DEFAULT 'PENDING',
    comment          TEXT,
    reviewed_at      TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_approvals_bp_id ON approvals(best_practice_id);
CREATE INDEX idx_approvals_status ON approvals(status);
```

```sql
-- V5__create_usage_logs.sql
CREATE TYPE usage_action AS ENUM ('VIEW', 'DOWNLOAD', 'WORKFLOW_USED');

CREATE TABLE usage_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    best_practice_id UUID NOT NULL REFERENCES best_practices(id),
    user_id          UUID NOT NULL REFERENCES users(id),
    action           usage_action NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usage_bp_id ON usage_logs(best_practice_id);
CREATE INDEX idx_usage_created_at ON usage_logs(created_at DESC);
```

- [ ] **Step 4: Chạy migration và kiểm tra**

```bash
cd axon-backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Expected log: Flyway: Successfully applied 5 migrations

# Kiểm tra tables
docker compose exec postgres psql -U axon -d axon -c "\dt"
# Expected: users, best_practices, best_practice_files, approvals, usage_logs
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/resources/db/
git commit -m "feat: database schema — 5 Flyway migrations"
```

---

### Task 3: Core Entities & Repositories

**Files:**
- Create: `axon-backend/src/main/java/com/axon/user/User.java`
- Create: `axon-backend/src/main/java/com/axon/user/UserRole.java`
- Create: `axon-backend/src/main/java/com/axon/user/UserRepository.java`
- Create: `axon-backend/src/main/java/com/axon/bestpractice/BestPractice.java`
- Create: `axon-backend/src/main/java/com/axon/bestpractice/BestPracticeType.java`
- Create: `axon-backend/src/main/java/com/axon/bestpractice/BestPracticeStatus.java`
- Create: `axon-backend/src/main/java/com/axon/bestpractice/BestPracticeRepository.java`
- Create: `axon-backend/src/main/java/com/axon/file/BestPracticeFile.java`
- Create: `axon-backend/src/main/java/com/axon/approval/Approval.java`
- Create: `axon-backend/src/main/java/com/axon/usage/UsageLog.java`

- [ ] **Step 1: Tạo User entity**

```java
// com/axon/user/UserRole.java
package com.axon.user;
public enum UserRole { USER, ADMIN }
```

```java
// com/axon/user/User.java
package com.axon.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "users")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id @GeneratedValue @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "user_role", nullable = false)
    private UserRole role = UserRole.USER;

    private String ssoProvider;
    private String ssoSubject;
    private String avatarUrl;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
```

```java
// com/axon/user/UserRepository.java
package com.axon.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findBySsoProviderAndSsoSubject(String provider, String subject);
}
```

- [ ] **Step 2: Tạo BestPractice entity**

```java
// com/axon/bestpractice/BestPracticeType.java
package com.axon.bestpractice;
public enum BestPracticeType { SKILL_SET, MCP_CONFIG, RULE_SET, AGENT_WORKFLOW }
```

```java
// com/axon/bestpractice/BestPracticeStatus.java
package com.axon.bestpractice;
public enum BestPracticeStatus {
    DRAFT, PENDING_REVIEW, UNDER_REVIEW, PUBLISHED, REJECTED;

    public boolean canEdit() { return this == DRAFT || this == REJECTED; }
    public boolean canSubmit() { return this == DRAFT || this == REJECTED; }
    public boolean canApproveOrReject() { return this == UNDER_REVIEW; }
}
```

```java
// com/axon/bestpractice/BestPractice.java
package com.axon.bestpractice;

import com.axon.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "best_practices")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BestPractice {
    @Id @GeneratedValue @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "bp_type", nullable = false)
    private BestPracticeType type;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "bp_status", nullable = false)
    private BestPracticeStatus status = BestPracticeStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "text")
    private String usageGuide;

    @Column(columnDefinition = "text")
    private String installGuide;

    @Column(columnDefinition = "jsonb", nullable = false)
    private String externalLinks = "[]";

    private String agentWorkflowId;

    @Column(columnDefinition = "text[]", nullable = false)
    private String[] tags = new String[]{};

    @Column(nullable = false)
    private Integer viewCount = 0;

    @Column(nullable = false)
    private Integer downloadCount = 0;

    @Column(nullable = false)
    private Double usageScore = 0.0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    private Instant publishedAt;

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }
}
```

```java
// com/axon/bestpractice/BestPracticeRepository.java
package com.axon.bestpractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface BestPracticeRepository extends JpaRepository<BestPractice, UUID> {

    @Query("""
        SELECT bp FROM BestPractice bp
        WHERE bp.status = 'PUBLISHED'
          AND (:type IS NULL OR bp.type = :type)
          AND (:search IS NULL OR lower(bp.title) LIKE lower(concat('%', :search, '%'))
               OR lower(bp.description) LIKE lower(concat('%', :search, '%')))
        """)
    Page<BestPractice> findPublished(BestPracticeType type, String search, Pageable pageable);

    List<BestPractice> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<BestPractice> findByStatusIn(List<BestPracticeStatus> statuses);

    @Query("SELECT bp.id FROM BestPractice bp WHERE bp.status = 'PUBLISHED'")
    List<UUID> findAllPublishedIds();

    @Modifying
    @Query("UPDATE BestPractice bp SET bp.usageScore = :score WHERE bp.id = :id")
    void updateUsageScore(UUID id, double score);

    List<BestPractice> findTop10ByStatusOrderByUsageScoreDesc(BestPracticeStatus status);
}
```

- [ ] **Step 3: Tạo các entity còn lại**

```java
// com/axon/file/BestPracticeFile.java
package com.axon.file;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "best_practice_files")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BestPracticeFile {
    @Id @GeneratedValue @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "best_practice_id", nullable = false)
    private UUID bestPracticeId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private Long fileSize;

    private String mimeType;

    @Column(nullable = false)
    private String storageKey;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();
}
```

```java
// com/axon/approval/ApprovalStatus.java
package com.axon.approval;
public enum ApprovalStatus { PENDING, APPROVED, REJECTED }
```

```java
// com/axon/approval/Approval.java
package com.axon.approval;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "approvals")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Approval {
    @Id @GeneratedValue @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "best_practice_id", nullable = false)
    private UUID bestPracticeId;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "approval_status", nullable = false)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(columnDefinition = "text")
    private String comment;

    private Instant reviewedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
```

```java
// com/axon/usage/UsageAction.java
package com.axon.usage;
public enum UsageAction { VIEW, DOWNLOAD, WORKFLOW_USED }
```

```java
// com/axon/usage/UsageLog.java
package com.axon.usage;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "usage_logs")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UsageLog {
    @Id @GeneratedValue @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "best_practice_id", nullable = false)
    private UUID bestPracticeId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "usage_action", nullable = false)
    private UsageAction action;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
```

- [ ] **Step 4: Chạy app, kiểm tra Hibernate không lỗi**

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Expected: Started AXonApplication in X seconds — no errors
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/
git commit -m "feat: core entities and repositories"
```

---

### Task 4: Auth Module — JWT + Mock SSO

**Files:**
- Create: `com/axon/auth/sso/SSOProvider.java`
- Create: `com/axon/auth/sso/SSOUserInfo.java`
- Create: `com/axon/auth/sso/MockSSOProvider.java`
- Create: `com/axon/auth/jwt/JwtService.java`
- Create: `com/axon/auth/jwt/JwtAuthFilter.java`
- Create: `com/axon/auth/AuthService.java`
- Create: `com/axon/auth/AuthController.java`
- Create: `com/axon/config/SecurityConfig.java`
- Test: `com/axon/auth/AuthServiceTest.java`

- [ ] **Step 1: Viết failing test**

```java
// src/test/java/com/axon/auth/AuthServiceTest.java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository userRepository;
    @Mock JwtService jwtService;
    @Mock SSOProvider ssoProvider;
    @InjectMocks AuthService authService;

    @Test
    void loginWithNewUser_createsUserAndReturnsTokens() {
        var ssoInfo = new SSOUserInfo("mock", "sub123", "huy@co.com", "Huy", null);
        when(ssoProvider.exchangeCode("code123")).thenReturn(ssoInfo);
        when(userRepository.findBySsoProviderAndSsoSubject("mock", "sub123"))
            .thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");

        var result = authService.login("code123");

        assertThat(result.accessToken()).isEqualTo("access-token");
        verify(userRepository).save(argThat(u -> u.getEmail().equals("huy@co.com")));
    }

    @Test
    void loginWithExistingUser_returnsTokensWithoutCreating() {
        var existing = User.builder().id(UUID.randomUUID())
            .email("huy@co.com").name("Huy").role(UserRole.USER).build();
        var ssoInfo = new SSOUserInfo("mock", "sub123", "huy@co.com", "Huy", null);
        when(ssoProvider.exchangeCode("code123")).thenReturn(ssoInfo);
        when(userRepository.findBySsoProviderAndSsoSubject("mock", "sub123"))
            .thenReturn(Optional.of(existing));
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(any())).thenReturn("refresh-token");

        authService.login("code123");

        verify(userRepository, never()).save(any());
    }
}
```

- [ ] **Step 2: Chạy test — phải FAIL**

```bash
./mvnw test -pl axon-backend -Dtest=AuthServiceTest
# Expected: FAIL — AuthService, JwtService, SSOProvider not found
```

- [ ] **Step 3: Implement SSOProvider interface và MockSSOProvider**

```java
// com/axon/auth/sso/SSOUserInfo.java
package com.axon.auth.sso;
public record SSOUserInfo(
    String provider, String subject,
    String email, String name, String avatarUrl
) {}
```

```java
// com/axon/auth/sso/SSOProvider.java
package com.axon.auth.sso;
public interface SSOProvider {
    String getLoginUrl();
    SSOUserInfo exchangeCode(String code);
    String getProviderName();
}
```

```java
// com/axon/auth/sso/MockSSOProvider.java
package com.axon.auth.sso;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class MockSSOProvider implements SSOProvider {
    @Override
    public String getLoginUrl() {
        return "/auth/sso/mock-callback?code=mock-code";
    }

    @Override
    public SSOUserInfo exchangeCode(String code) {
        // Dev: trả về user cố định
        return new SSOUserInfo("mock", "mock-sub-001",
            "dev@company.com", "Dev User", null);
    }

    @Override
    public String getProviderName() { return "mock"; }
}
```

- [ ] **Step 4: Implement JwtService**

```java
// com/axon/auth/jwt/JwtService.java
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
```

- [ ] **Step 5: Implement AuthService**

```java
// com/axon/auth/AuthService.java
package com.axon.auth;

import com.axon.auth.dto.TokenResponse;
import com.axon.auth.jwt.JwtService;
import com.axon.auth.sso.SSOProvider;
import com.axon.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final SSOProvider ssoProvider;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public TokenResponse login(String code) {
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
            900L,
            UserInfoResponse.from(user)
        );
    }
}
```

```java
// com/axon/auth/dto/TokenResponse.java
package com.axon.auth.dto;
public record TokenResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    UserInfoResponse user
) {}
```

```java
// com/axon/auth/dto/UserInfoResponse.java
package com.axon.auth.dto;
import com.axon.user.User;
public record UserInfoResponse(String id, String email, String name, String role, String avatarUrl) {
    public static UserInfoResponse from(User u) {
        return new UserInfoResponse(u.getId().toString(), u.getEmail(),
            u.getName(), u.getRole().name(), u.getAvatarUrl());
    }
}
```

- [ ] **Step 6: Implement JwtAuthFilter + SecurityConfig**

```java
// com/axon/auth/jwt/JwtAuthFilter.java
package com.axon.auth.jwt;

import com.axon.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.validateAndParse(header.substring(7));
                if ("ACCESS".equals(claims.get("type"))) {
                    UUID userId = UUID.fromString(claims.getSubject());
                    userRepository.findById(userId).ifPresent(user -> {
                        var auth = new UsernamePasswordAuthenticationToken(
                            user, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                        );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
                }
            } catch (Exception ignored) {}
        }
        chain.doFilter(req, res);
    }
}
```

```java
// com/axon/config/SecurityConfig.java
package com.axon.config;

import com.axon.auth.jwt.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(c -> c.configurationSource(corsSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**", "/actuator/health").permitAll()
                .requestMatchers("/api/v1/best-practices", "/api/v1/best-practices/trending",
                    "/api/v1/best-practices/{id}").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    CorsConfigurationSource corsSource() {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

- [ ] **Step 7: Implement AuthController**

```java
// com/axon/auth/AuthController.java
package com.axon.auth;

import com.axon.auth.dto.*;
import com.axon.auth.sso.SSOProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.axon.user.User;
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

    @GetMapping("/sso/callback")
    public ResponseEntity<TokenResponse> callback(@RequestParam String code) {
        return ResponseEntity.ok(authService.login(code));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(UserInfoResponse.from(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Refresh token invalidation handled via cookie + Redis on client call
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 8: Chạy test — phải PASS**

```bash
./mvnw test -pl axon-backend -Dtest=AuthServiceTest
# Expected: Tests run: 2, Failures: 0, Errors: 0
```

- [ ] **Step 9: Smoke test auth endpoint**

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
curl -s http://localhost:8080/auth/sso/callback?code=any | jq .
# Expected: { "access_token": "eyJ...", "user": { "email": "dev@company.com" } }
```

- [ ] **Step 10: Commit**

```bash
git add axon-backend/src/main/java/com/axon/auth/ axon-backend/src/main/java/com/axon/config/
git add axon-backend/src/test/java/com/axon/auth/
git commit -m "feat: auth module — JWT + Mock SSO + Spring Security config"
```

---

### Task 5: BestPractice CRUD API

**Files:**
- Create: `com/axon/bestpractice/dto/BestPracticeRequest.java`
- Create: `com/axon/bestpractice/dto/BestPracticeResponse.java`
- Create: `com/axon/bestpractice/dto/BestPracticeListItem.java`
- Create: `com/axon/bestpractice/BestPracticeService.java`
- Create: `com/axon/bestpractice/BestPracticeController.java`
- Test: `com/axon/bestpractice/BestPracticeServiceTest.java`

- [ ] **Step 1: Viết failing tests**

```java
// src/test/java/com/axon/bestpractice/BestPracticeServiceTest.java
@ExtendWith(MockitoExtension.class)
class BestPracticeServiceTest {
    @Mock BestPracticeRepository repository;
    @Mock UsageService usageService;
    @InjectMocks BestPracticeService service;

    private User author;

    @BeforeEach void setup() {
        author = User.builder().id(UUID.randomUUID()).email("a@b.com")
            .name("Author").role(UserRole.USER).build();
    }

    @Test
    void create_returnsDraftBestPractice() {
        var req = new BestPracticeRequest("Title", "Desc",
            BestPracticeType.SKILL_SET, null, null, List.of(), null, List.of("tag1"));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = service.create(req, author);

        assertThat(result.getStatus()).isEqualTo(BestPracticeStatus.DRAFT);
        assertThat(result.getAuthor()).isEqualTo(author);
        assertThat(result.getTitle()).isEqualTo("Title");
    }

    @Test
    void submit_changesDraftToPendingReview() {
        var bp = BestPractice.builder().id(UUID.randomUUID())
            .status(BestPracticeStatus.DRAFT).author(author).build();
        when(repository.findById(bp.getId())).thenReturn(Optional.of(bp));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = service.submit(bp.getId(), author.getId());

        assertThat(result.getStatus()).isEqualTo(BestPracticeStatus.PENDING_REVIEW);
    }

    @Test
    void submit_whenNotDraft_throwsException() {
        var bp = BestPractice.builder().id(UUID.randomUUID())
            .status(BestPracticeStatus.PUBLISHED).author(author).build();
        when(repository.findById(bp.getId())).thenReturn(Optional.of(bp));

        assertThatThrownBy(() -> service.submit(bp.getId(), author.getId()))
            .isInstanceOf(IllegalStateException.class);
    }
}
```

- [ ] **Step 2: Chạy test — phải FAIL**

```bash
./mvnw test -pl axon-backend -Dtest=BestPracticeServiceTest
# Expected: FAIL — BestPracticeService, BestPracticeRequest not found
```

- [ ] **Step 3: Implement DTOs**

```java
// com/axon/bestpractice/dto/BestPracticeRequest.java
package com.axon.bestpractice.dto;

import com.axon.bestpractice.BestPracticeType;
import jakarta.validation.constraints.*;
import java.util.List;

public record BestPracticeRequest(
    @NotBlank @Size(max = 200) String title,
    String description,
    @NotNull BestPracticeType type,
    String usageGuide,
    String installGuide,
    List<ExternalLinkDto> externalLinks,
    String agentWorkflowId,
    List<String> tags
) {}
```

```java
// com/axon/bestpractice/dto/ExternalLinkDto.java
package com.axon.bestpractice.dto;
public record ExternalLinkDto(String label, String url) {}
```

```java
// com/axon/bestpractice/dto/BestPracticeListItem.java
package com.axon.bestpractice.dto;

import com.axon.bestpractice.*;
import com.axon.user.User;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BestPracticeListItem(
    UUID id, String title, String description,
    BestPracticeType type, BestPracticeStatus status,
    List<String> tags, AuthorDto author,
    double usageScore, int viewCount, int downloadCount,
    Instant publishedAt
) {
    public static BestPracticeListItem from(BestPractice bp) {
        String desc = bp.getDescription() != null && bp.getDescription().length() > 200
            ? bp.getDescription().substring(0, 200) + "..." : bp.getDescription();
        return new BestPracticeListItem(
            bp.getId(), bp.getTitle(), desc,
            bp.getType(), bp.getStatus(),
            bp.getTags() != null ? List.of(bp.getTags()) : List.of(),
            AuthorDto.from(bp.getAuthor()),
            bp.getUsageScore(), bp.getViewCount(), bp.getDownloadCount(),
            bp.getPublishedAt()
        );
    }
}
```

```java
// com/axon/bestpractice/dto/AuthorDto.java
package com.axon.bestpractice.dto;
import com.axon.user.User;
import java.util.UUID;
public record AuthorDto(UUID id, String name, String avatarUrl) {
    public static AuthorDto from(User u) {
        return new AuthorDto(u.getId(), u.getName(), u.getAvatarUrl());
    }
}
```

- [ ] **Step 4: Implement BestPracticeService**

```java
// com/axon/bestpractice/BestPracticeService.java
package com.axon.bestpractice;

import com.axon.bestpractice.dto.*;
import com.axon.usage.UsageAction;
import com.axon.usage.UsageService;
import com.axon.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BestPracticeService {
    private final BestPracticeRepository repository;
    private final UsageService usageService;
    private final ObjectMapper objectMapper;

    @Transactional
    public BestPractice create(BestPracticeRequest req, User author) {
        return repository.save(BestPractice.builder()
            .title(req.title())
            .description(req.description())
            .type(req.type())
            .status(BestPracticeStatus.DRAFT)
            .author(author)
            .usageGuide(req.usageGuide())
            .installGuide(req.installGuide())
            .externalLinks(toJson(req.externalLinks()))
            .agentWorkflowId(req.agentWorkflowId())
            .tags(req.tags() != null ? req.tags().toArray(new String[0]) : new String[]{})
            .build());
    }

    @Transactional
    public BestPractice update(UUID id, BestPracticeRequest req, UUID userId) {
        BestPractice bp = findOwnedOrAdmin(id, userId);
        if (!bp.getStatus().canEdit()) throw new IllegalStateException("Cannot edit in status: " + bp.getStatus());
        bp.setTitle(req.title());
        bp.setDescription(req.description());
        bp.setUsageGuide(req.usageGuide());
        bp.setInstallGuide(req.installGuide());
        bp.setExternalLinks(toJson(req.externalLinks()));
        bp.setAgentWorkflowId(req.agentWorkflowId());
        bp.setTags(req.tags() != null ? req.tags().toArray(new String[0]) : new String[]{});
        return repository.save(bp);
    }

    @Transactional
    public BestPractice submit(UUID id, UUID userId) {
        BestPractice bp = findOwnedOrAdmin(id, userId);
        if (!bp.getStatus().canSubmit()) throw new IllegalStateException("Cannot submit in status: " + bp.getStatus());
        bp.setStatus(BestPracticeStatus.PENDING_REVIEW);
        return repository.save(bp);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        BestPractice bp = findOwnedOrAdmin(id, userId);
        if (bp.getStatus() != BestPracticeStatus.DRAFT) throw new IllegalStateException("Can only delete DRAFT");
        repository.delete(bp);
    }

    public Page<BestPracticeListItem> listPublished(BestPracticeType type, String search,
                                                     String sort, Pageable pageable) {
        Sort s = "trending".equals(sort)
            ? Sort.by(Sort.Direction.DESC, "usageScore")
            : Sort.by(Sort.Direction.DESC, "publishedAt");
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), s);
        return repository.findPublished(type, search, sorted).map(BestPracticeListItem::from);
    }

    @Transactional
    public BestPractice getDetail(UUID id, UUID userId) {
        BestPractice bp = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Not found"));
        if (userId != null) usageService.logAsync(id, userId, UsageAction.VIEW);
        return bp;
    }

    private BestPractice findOwnedOrAdmin(UUID id, UUID userId) {
        return repository.findById(id)
            .filter(bp -> bp.getAuthor().getId().equals(userId))
            .orElseThrow(() -> new IllegalArgumentException("Not found or unauthorized"));
    }

    private String toJson(Object obj) {
        try { return obj != null ? objectMapper.writeValueAsString(obj) : "[]"; }
        catch (Exception e) { return "[]"; }
    }
}
```

- [ ] **Step 5: Implement BestPracticeController**

```java
// com/axon/bestpractice/BestPracticeController.java
package com.axon.bestpractice;

import com.axon.bestpractice.dto.*;
import com.axon.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/best-practices")
@RequiredArgsConstructor
public class BestPracticeController {
    private final BestPracticeService service;

    @GetMapping
    public ResponseEntity<?> list(
        @RequestParam(required = false) BestPracticeType type,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "newest") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal User user
    ) {
        size = Math.min(size, 50);
        return ResponseEntity.ok(service.listPublished(type, search, sort, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BestPracticeListItem> detail(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        var bp = service.getDetail(id, user != null ? user.getId() : null);
        return ResponseEntity.ok(BestPracticeListItem.from(bp));
    }

    @PostMapping
    public ResponseEntity<BestPracticeListItem> create(
        @Valid @RequestBody BestPracticeRequest req,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BestPracticeListItem.from(service.create(req, user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BestPracticeListItem> update(
        @PathVariable UUID id,
        @Valid @RequestBody BestPracticeRequest req,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(BestPracticeListItem.from(service.update(id, req, user.getId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        service.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<BestPracticeListItem> submit(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(BestPracticeListItem.from(service.submit(id, user.getId())));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BestPracticeListItem>> mySubmissions(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.listByAuthor(user.getId()));
    }
}
```

- [ ] **Step 6: Chạy test — phải PASS**

```bash
./mvnw test -pl axon-backend -Dtest=BestPracticeServiceTest
# Expected: Tests run: 3, Failures: 0
```

- [ ] **Step 7: Commit**

```bash
git add axon-backend/src/main/java/com/axon/bestpractice/
git add axon-backend/src/test/java/com/axon/bestpractice/
git commit -m "feat: best practice CRUD API with state machine"
```

---

### Task 6: File Upload/Download API

**Files:**
- Create: `com/axon/config/MinioConfig.java`
- Create: `com/axon/file/FileService.java`
- Create: `com/axon/file/FileController.java`
- Create: `com/axon/file/BestPracticeFileRepository.java`
- Create: `com/axon/file/dto/FileResponse.java`

- [ ] **Step 1: MinioConfig**

```java
// com/axon/config/MinioConfig.java
package com.axon.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;

@Configuration
public class MinioConfig {
    @Bean
    public MinioClient minioClient(
        @Value("${minio.endpoint}") String endpoint,
        @Value("${minio.access-key}") String accessKey,
        @Value("${minio.secret-key}") String secretKey
    ) {
        return MinioClient.builder()
            .endpoint(endpoint)
            .credentials(accessKey, secretKey)
            .build();
    }
}
```

- [ ] **Step 2: FileResponse DTO và Repository**

```java
// com/axon/file/dto/FileResponse.java
package com.axon.file.dto;
import com.axon.file.BestPracticeFile;
import java.time.Instant;
import java.util.UUID;
public record FileResponse(UUID id, String fileName, long fileSize, String mimeType, Instant uploadedAt) {
    public static FileResponse from(BestPracticeFile f) {
        return new FileResponse(f.getId(), f.getFileName(), f.getFileSize(), f.getMimeType(), f.getUploadedAt());
    }
}
```

```java
// com/axon/file/BestPracticeFileRepository.java
package com.axon.file;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface BestPracticeFileRepository extends JpaRepository<BestPracticeFile, UUID> {
    List<BestPracticeFile> findByBestPracticeId(UUID bestPracticeId);
}
```

- [ ] **Step 3: FileService**

```java
// com/axon/file/FileService.java
package com.axon.file;

import com.axon.file.dto.FileResponse;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class FileService {
    private final MinioClient minio;
    private final BestPracticeFileRepository repository;
    @Value("${minio.bucket}") private String bucket;

    public FileResponse upload(UUID bpId, MultipartFile file) {
        String fileId = UUID.randomUUID().toString();
        String key = bpId + "/" + fileId + "/" + file.getOriginalFilename();
        try {
            minio.putObject(PutObjectArgs.builder()
                .bucket(bucket).object(key)
                .stream(file.getInputStream(), file.getSize(), -1)
                .contentType(file.getContentType())
                .build());
        } catch (Exception e) {
            throw new RuntimeException("File upload failed", e);
        }
        var saved = repository.save(BestPracticeFile.builder()
            .bestPracticeId(bpId).fileName(file.getOriginalFilename())
            .fileSize(file.getSize()).mimeType(file.getContentType())
            .storageKey(key).build());
        return FileResponse.from(saved);
    }

    public String generateDownloadUrl(UUID fileId) {
        var file = repository.findById(fileId)
            .orElseThrow(() -> new IllegalArgumentException("File not found"));
        try {
            return minio.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .bucket(bucket).object(file.getStorageKey())
                .method(Method.GET).expiry(15, TimeUnit.MINUTES)
                .build());
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate download URL", e);
        }
    }

    public List<FileResponse> listByBestPractice(UUID bpId) {
        return repository.findByBestPracticeId(bpId).stream()
            .map(FileResponse::from).toList();
    }
}
```

- [ ] **Step 4: FileController**

```java
// com/axon/file/FileController.java
package com.axon.file;

import com.axon.file.dto.FileResponse;
import com.axon.usage.*;
import com.axon.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/best-practices/{bpId}/files")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;
    private final UsageService usageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileResponse> upload(
        @PathVariable UUID bpId,
        @RequestParam MultipartFile file
    ) {
        if (file.getSize() > 50 * 1024 * 1024)
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(fileService.upload(bpId, file));
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Void> download(
        @PathVariable UUID bpId,
        @PathVariable UUID fileId,
        @AuthenticationPrincipal User user
    ) {
        String url = fileService.generateDownloadUrl(fileId);
        usageService.logAsync(bpId, user.getId(), UsageAction.DOWNLOAD);
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url)).build();
    }
}
```

- [ ] **Step 5: Implement UsageService (async logging)**

```java
// com/axon/usage/UsageService.java
package com.axon.usage;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsageService {
    private final UsageLogRepository repository;

    @Async
    public void logAsync(UUID bpId, UUID userId, UsageAction action) {
        repository.save(UsageLog.builder()
            .bestPracticeId(bpId).userId(userId).action(action).build());
    }
}
```

- [ ] **Step 6: Smoke test upload**

```bash
# Đảm bảo app đang chạy và có token
TOKEN=$(curl -s http://localhost:8080/auth/sso/callback?code=any | jq -r .access_token)

# Tạo BP trước
BP_ID=$(curl -s -X POST http://localhost:8080/api/v1/best-practices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","type":"SKILL_SET","externalLinks":[],"tags":[]}' | jq -r .id)

# Upload file
curl -s -X POST http://localhost:8080/api/v1/best-practices/$BP_ID/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@README.md" | jq .
# Expected: { "id": "...", "fileName": "README.md", ... }
```

- [ ] **Step 7: Commit**

```bash
git add axon-backend/src/main/java/com/axon/file/
git add axon-backend/src/main/java/com/axon/usage/
git add axon-backend/src/main/java/com/axon/config/MinioConfig.java
git commit -m "feat: file upload/download via MinIO + async usage logging"
```

---

## Phase 2 — Approval & Publish

### Task 7: Approval Service + Admin API

**Files:**
- Create: `com/axon/approval/ApprovalRepository.java`
- Create: `com/axon/approval/ApprovalService.java`
- Create: `com/axon/approval/AdminBestPracticeController.java`
- Create: `com/axon/notification/NotificationService.java`
- Create: `com/axon/notification/EmailNotificationService.java`
- Test: `com/axon/approval/ApprovalServiceTest.java`

- [ ] **Step 1: Viết failing tests**

```java
@ExtendWith(MockitoExtension.class)
class ApprovalServiceTest {
    @Mock BestPracticeRepository bpRepo;
    @Mock ApprovalRepository approvalRepo;
    @Mock NotificationService notificationService;
    @InjectMocks ApprovalService service;

    @Test
    void approve_publishesBestPractice() {
        UUID adminId = UUID.randomUUID();
        var bp = BestPractice.builder().id(UUID.randomUUID())
            .status(BestPracticeStatus.UNDER_REVIEW)
            .author(User.builder().id(UUID.randomUUID()).build()).build();
        var approval = Approval.builder().bestPracticeId(bp.getId())
            .status(ApprovalStatus.PENDING).build();
        when(bpRepo.findById(bp.getId())).thenReturn(Optional.of(bp));
        when(approvalRepo.findTopByBestPracticeIdOrderByCreatedAtDesc(bp.getId()))
            .thenReturn(Optional.of(approval));
        when(bpRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = service.approve(bp.getId(), adminId);

        assertThat(result.getStatus()).isEqualTo(BestPracticeStatus.PUBLISHED);
        assertThat(result.getPublishedAt()).isNotNull();
        verify(notificationService).notifyApproved(any());
    }

    @Test
    void reject_requiresComment() {
        assertThatThrownBy(() -> service.reject(UUID.randomUUID(), UUID.randomUUID(), ""))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("comment");
    }
}
```

- [ ] **Step 2: Chạy test — phải FAIL**

```bash
./mvnw test -pl axon-backend -Dtest=ApprovalServiceTest
# Expected: FAIL
```

- [ ] **Step 3: Implement ApprovalRepository + NotificationService**

```java
// com/axon/approval/ApprovalRepository.java
package com.axon.approval;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface ApprovalRepository extends JpaRepository<Approval, UUID> {
    Optional<Approval> findTopByBestPracticeIdOrderByCreatedAtDesc(UUID bpId);
}
```

```java
// com/axon/notification/NotificationService.java
package com.axon.notification;
import com.axon.bestpractice.BestPractice;
public interface NotificationService {
    void notifyApproved(BestPractice bp);
    void notifyRejected(BestPractice bp, String comment);
    void notifyAdmins(BestPractice bp);
}
```

```java
// com/axon/notification/EmailNotificationService.java
package com.axon.notification;

import com.axon.bestpractice.BestPractice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service @Slf4j @RequiredArgsConstructor
public class EmailNotificationService implements NotificationService {
    @Override
    public void notifyApproved(BestPractice bp) {
        // TODO Phase 4: integrate SMTP — log for now
        log.info("NOTIFY: BP '{}' approved, notify author {}", bp.getTitle(), bp.getAuthor().getEmail());
    }
    @Override
    public void notifyRejected(BestPractice bp, String comment) {
        log.info("NOTIFY: BP '{}' rejected, notify author {} — reason: {}", bp.getTitle(), bp.getAuthor().getEmail(), comment);
    }
    @Override
    public void notifyAdmins(BestPractice bp) {
        log.info("NOTIFY: New BP '{}' pending review", bp.getTitle());
    }
}
```

- [ ] **Step 4: Implement ApprovalService**

```java
// com/axon/approval/ApprovalService.java
package com.axon.approval;

import com.axon.bestpractice.*;
import com.axon.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ApprovalService {
    private final BestPracticeRepository bpRepo;
    private final ApprovalRepository approvalRepo;
    private final NotificationService notificationService;

    @Transactional
    public BestPractice take(UUID bpId, UUID adminId) {
        BestPractice bp = bpRepo.findById(bpId).orElseThrow();
        if (bp.getStatus() != BestPracticeStatus.PENDING_REVIEW)
            throw new IllegalStateException("Must be PENDING_REVIEW to take");
        bp.setStatus(BestPracticeStatus.UNDER_REVIEW);
        approvalRepo.findTopByBestPracticeIdOrderByCreatedAtDesc(bpId)
            .ifPresent(a -> { a.setReviewerId(adminId); approvalRepo.save(a); });
        return bpRepo.save(bp);
    }

    @Transactional
    public BestPractice approve(UUID bpId, UUID adminId) {
        BestPractice bp = bpRepo.findById(bpId).orElseThrow();
        if (!bp.getStatus().canApproveOrReject())
            throw new IllegalStateException("Cannot approve in status: " + bp.getStatus());
        bp.setStatus(BestPracticeStatus.PUBLISHED);
        bp.setPublishedAt(Instant.now());
        bp = bpRepo.save(bp);
        approvalRepo.findTopByBestPracticeIdOrderByCreatedAtDesc(bpId)
            .ifPresent(a -> {
                a.setStatus(ApprovalStatus.APPROVED);
                a.setReviewerId(adminId);
                a.setReviewedAt(Instant.now());
                approvalRepo.save(a);
            });
        notificationService.notifyApproved(bp);
        return bp;
    }

    @Transactional
    public BestPractice reject(UUID bpId, UUID adminId, String comment) {
        if (comment == null || comment.isBlank())
            throw new IllegalArgumentException("Reject requires a comment");
        BestPractice bp = bpRepo.findById(bpId).orElseThrow();
        if (!bp.getStatus().canApproveOrReject())
            throw new IllegalStateException("Cannot reject in status: " + bp.getStatus());
        bp.setStatus(BestPracticeStatus.REJECTED);
        bp = bpRepo.save(bp);
        approvalRepo.findTopByBestPracticeIdOrderByCreatedAtDesc(bpId)
            .ifPresent(a -> {
                a.setStatus(ApprovalStatus.REJECTED);
                a.setReviewerId(adminId);
                a.setComment(comment);
                a.setReviewedAt(Instant.now());
                approvalRepo.save(a);
            });
        notificationService.notifyRejected(bp, comment);
        return bp;
    }

    public List<BestPractice> getQueue() {
        return bpRepo.findByStatusIn(List.of(
            BestPracticeStatus.PENDING_REVIEW, BestPracticeStatus.UNDER_REVIEW));
    }
}
```

- [ ] **Step 5: Admin controller**

```java
// com/axon/approval/AdminBestPracticeController.java
package com.axon.approval;

import com.axon.bestpractice.dto.BestPracticeListItem;
import com.axon.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/best-practices")
@RequiredArgsConstructor
public class AdminBestPracticeController {
    private final ApprovalService approvalService;

    @GetMapping("/queue")
    public ResponseEntity<List<BestPracticeListItem>> queue() {
        return ResponseEntity.ok(approvalService.getQueue().stream()
            .map(BestPracticeListItem::from).toList());
    }

    @PutMapping("/{id}/take")
    public ResponseEntity<BestPracticeListItem> take(
        @PathVariable UUID id, @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(BestPracticeListItem.from(approvalService.take(id, admin.getId())));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<BestPracticeListItem> approve(
        @PathVariable UUID id, @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(BestPracticeListItem.from(approvalService.approve(id, admin.getId())));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<BestPracticeListItem> reject(
        @PathVariable UUID id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(BestPracticeListItem.from(
            approvalService.reject(id, admin.getId(), body.get("comment"))));
    }
}
```

- [ ] **Step 6: Chạy test — phải PASS**

```bash
./mvnw test -pl axon-backend -Dtest=ApprovalServiceTest
# Expected: Tests run: 2, Failures: 0
```

- [ ] **Step 7: Commit**

```bash
git add axon-backend/src/main/java/com/axon/approval/
git add axon-backend/src/main/java/com/axon/notification/
git commit -m "feat: approval workflow — admin approve/reject with notifications"
```

---

## Phase 3 — Ranking & Agent Builder

### Task 8: Ranking Scheduled Job

**Files:**
- Create: `com/axon/usage/UsageLogRepository.java`
- Create: `com/axon/usage/RankingScheduler.java`
- Create: `com/axon/config/RedisConfig.java`
- Create: `com/axon/config/SchedulingConfig.java`
- Test: `com/axon/usage/RankingSchedulerTest.java`

- [ ] **Step 1: Viết failing test**

```java
@ExtendWith(MockitoExtension.class)
class RankingSchedulerTest {
    @Mock UsageLogRepository usageLogRepo;
    @Mock BestPracticeRepository bpRepo;
    @Mock RedisTemplate<String, Object> redis;
    @InjectMocks RankingScheduler scheduler;

    @Test
    void recomputeScores_calculatesWeightedScore() {
        UUID bpId = UUID.randomUUID();
        var now = Instant.now();
        var logs = List.of(
            UsageLog.builder().bestPracticeId(bpId).action(UsageAction.DOWNLOAD).createdAt(now).build(),
            UsageLog.builder().bestPracticeId(bpId).action(UsageAction.VIEW).createdAt(now).build()
        );
        when(bpRepo.findAllPublishedIds()).thenReturn(List.of(bpId));
        when(usageLogRepo.findByBestPracticeIdAndCreatedAtAfter(eq(bpId), any())).thenReturn(logs);
        when(redis.opsForValue()).thenReturn(mock(ValueOperations.class));
        when(bpRepo.findTop10ByStatusOrderByUsageScoreDesc(any())).thenReturn(List.of());

        scheduler.recomputeScores();

        // DOWNLOAD(3.0) + VIEW(0.5) = 3.5, decay week 0 = 1.0 → score = 3.5
        verify(bpRepo).updateUsageScore(eq(bpId), doubleThat(score -> score > 3.0 && score < 4.0));
    }
}
```

- [ ] **Step 2: Chạy test — phải FAIL**

```bash
./mvnw test -pl axon-backend -Dtest=RankingSchedulerTest
# Expected: FAIL
```

- [ ] **Step 3: Implement UsageLogRepository, RedisConfig, SchedulingConfig**

```java
// com/axon/usage/UsageLogRepository.java
package com.axon.usage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
public interface UsageLogRepository extends JpaRepository<UsageLog, UUID> {
    List<UsageLog> findByBestPracticeIdAndCreatedAtAfter(UUID bpId, Instant cutoff);
}
```

```java
// com/axon/config/RedisConfig.java
package com.axon.config;

import org.springframework.context.annotation.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;

@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        var template = new RedisTemplate<String, Object>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

```java
// com/axon/config/SchedulingConfig.java
package com.axon.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration @EnableScheduling @EnableAsync
public class SchedulingConfig {}
```

- [ ] **Step 4: Implement RankingScheduler**

```java
// com/axon/usage/RankingScheduler.java
package com.axon.usage;

import com.axon.bestpractice.*;
import com.axon.bestpractice.dto.BestPracticeListItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Component @Slf4j @RequiredArgsConstructor
public class RankingScheduler {
    private final BestPracticeRepository bpRepo;
    private final UsageLogRepository usageLogRepo;
    private final RedisTemplate<String, Object> redis;

    @Scheduled(fixedRate = 3_600_000)
    public void recomputeScores() {
        log.info("Recomputing usage scores...");
        Instant cutoff = Instant.now().minus(12 * 7, ChronoUnit.DAYS);
        List<UUID> ids = bpRepo.findAllPublishedIds();

        for (UUID bpId : ids) {
            double score = usageLogRepo
                .findByBestPracticeIdAndCreatedAtAfter(bpId, cutoff)
                .stream()
                .mapToDouble(log -> {
                    double weight = switch (log.getAction()) {
                        case VIEW -> 0.5;
                        case DOWNLOAD -> 3.0;
                        case WORKFLOW_USED -> 5.0;
                    };
                    long weeksAgo = ChronoUnit.WEEKS.between(log.getCreatedAt(), Instant.now());
                    return weight * Math.pow(0.8, weeksAgo);
                })
                .sum();
            bpRepo.updateUsageScore(bpId, score);
        }

        List<BestPracticeListItem> trending = bpRepo
            .findTop10ByStatusOrderByUsageScoreDesc(BestPracticeStatus.PUBLISHED)
            .stream().map(BestPracticeListItem::from).toList();
        redis.opsForValue().set("trending", trending, Duration.ofHours(1));
        log.info("Scores recomputed for {} best practices", ids.size());
    }
}
```

- [ ] **Step 5: Trending endpoint**

Thêm vào `BestPracticeController.java`:
```java
@GetMapping("/trending")
public ResponseEntity<?> trending() {
    var cached = redis.opsForValue().get("trending");
    if (cached != null) return ResponseEntity.ok(cached);
    var fresh = bpRepo.findTop10ByStatusOrderByUsageScoreDesc(BestPracticeStatus.PUBLISHED)
        .stream().map(BestPracticeListItem::from).toList();
    return ResponseEntity.ok(fresh);
}
```

- [ ] **Step 6: Chạy test — phải PASS**

```bash
./mvnw test -pl axon-backend -Dtest=RankingSchedulerTest
# Expected: Tests run: 1, Failures: 0
```

- [ ] **Step 7: Commit**

```bash
git add axon-backend/src/main/java/com/axon/usage/
git add axon-backend/src/main/java/com/axon/config/
git commit -m "feat: ranking scheduler — hourly score recompute with time decay + Redis cache"
```

---

### Task 9: Agent Builder Integration

**Files:**
- Create: `com/axon/agentbuilder/AgentBuilderClient.java`
- Create: `com/axon/agentbuilder/AgentBuilderController.java`
- Create: `com/axon/agentbuilder/dto/WorkflowInfo.java`

- [ ] **Step 1: WorkflowInfo DTO**

```java
// com/axon/agentbuilder/dto/WorkflowInfo.java
package com.axon.agentbuilder.dto;
public record WorkflowInfo(String id, String name, String description, String thumbnailUrl) {}
```

- [ ] **Step 2: AgentBuilderClient**

```java
// com/axon/agentbuilder/AgentBuilderClient.java
package com.axon.agentbuilder;

import com.axon.agentbuilder.dto.WorkflowInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service @Slf4j
public class AgentBuilderClient {
    private final RestClient client;

    public AgentBuilderClient(
        @Value("${agent-builder.base-url}") String baseUrl,
        @Value("${agent-builder.api-key}") String apiKey
    ) {
        this.client = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("X-API-Key", apiKey)
            .build();
    }

    public WorkflowInfo getWorkflow(String workflowId) {
        try {
            return client.get()
                .uri("/api/workflows/{id}", workflowId)
                .retrieve()
                .body(WorkflowInfo.class);
        } catch (Exception e) {
            log.warn("Agent Builder unavailable for workflow {}: {}", workflowId, e.getMessage());
            throw new RuntimeException("Agent Builder unavailable", e);
        }
    }
}
```

- [ ] **Step 3: AgentBuilderController**

```java
// com/axon/agentbuilder/AgentBuilderController.java
package com.axon.agentbuilder;

import com.axon.agentbuilder.dto.WorkflowInfo;
import com.axon.usage.*;
import com.axon.user.User;
import com.axon.bestpractice.BestPracticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agent-builder")
@RequiredArgsConstructor
public class AgentBuilderController {
    private final AgentBuilderClient client;
    private final BestPracticeRepository bpRepo;
    private final UsageService usageService;

    @GetMapping("/workflows/{workflowId}")
    public ResponseEntity<WorkflowInfo> getWorkflow(@PathVariable String workflowId) {
        return ResponseEntity.ok(client.getWorkflow(workflowId));
    }

    @PostMapping("/workflows/{workflowId}/use")
    public ResponseEntity<Map<String, String>> useWorkflow(
        @PathVariable String workflowId,
        @AuthenticationPrincipal User user
    ) {
        // Tìm BP có agent_workflow_id = workflowId và log usage
        bpRepo.findByAgentWorkflowId(workflowId).ifPresent(bp ->
            usageService.logAsync(bp.getId(), user.getId(), UsageAction.WORKFLOW_USED));

        String url = client.getWorkflow(workflowId) != null
            ? System.getenv().getOrDefault("AGENT_BUILDER_URL", "") + "/workflows/" + workflowId
            : "";
        return ResponseEntity.ok(Map.of("workflow_url", url));
    }
}
```

Thêm vào `BestPracticeRepository.java`:
```java
Optional<BestPractice> findByAgentWorkflowId(String agentWorkflowId);
```

- [ ] **Step 4: Commit**

```bash
git add axon-backend/src/main/java/com/axon/agentbuilder/
git commit -m "feat: Agent Builder proxy integration — workflow info + usage tracking"
```

---

## Phase 4 — Frontend

### Task 10: FE Types, API Client, Auth Store, Routing

**Files:**
- Create: `axon-frontend/src/types/index.ts`
- Create: `axon-frontend/src/api/client.ts`
- Create: `axon-frontend/src/api/auth.ts`
- Create: `axon-frontend/src/api/bestPractices.ts`
- Create: `axon-frontend/src/api/admin.ts`
- Create: `axon-frontend/src/store/authStore.ts`
- Create: `axon-frontend/src/App.tsx`
- Create: `axon-frontend/src/pages/auth/SSOCallback.tsx`
- Create: `axon-frontend/src/components/layout/Header.tsx`
- Create: `axon-frontend/src/components/layout/Layout.tsx`

- [ ] **Step 1: Types**

```typescript
// src/types/index.ts
export type BPType = 'SKILL_SET' | 'MCP_CONFIG' | 'RULE_SET' | 'AGENT_WORKFLOW';
export type BPStatus = 'DRAFT' | 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED';
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string; email: string; name: string; role: UserRole; avatar_url?: string;
}

export interface ExternalLink { label: string; url: string; }

export interface BestPracticeFile {
  id: string; file_name: string; file_size: number; mime_type: string; uploaded_at: string;
}

export interface BestPracticeListItem {
  id: string; title: string; description: string; type: BPType; status: BPStatus;
  tags: string[]; author: { id: string; name: string; avatar_url?: string };
  usage_score: number; view_count: number; download_count: number; published_at: string;
}

export interface BestPractice extends BestPracticeListItem {
  usage_guide?: string; install_guide?: string;
  external_links: ExternalLink[]; agent_workflow_id?: string;
  files: BestPracticeFile[]; created_at: string;
}

export interface BestPracticeRequest {
  title: string; description: string; type: BPType;
  usage_guide?: string; install_guide?: string;
  external_links: ExternalLink[]; agent_workflow_id?: string; tags: string[];
}

export interface PagedResponse<T> {
  content: T[]; totalElements: number; totalPages: number; page: number;
}
```

- [ ] **Step 2: Auth Store**

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  login: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),
  logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
```

- [ ] **Step 3: API Client với auto-refresh**

```typescript
// src/api/client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const res = await axios.post('/auth/refresh', {}, { withCredentials: true });
        useAuthStore.getState().login(res.data.access_token, res.data.user);
        error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(error.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/auth/sso/login';
      }
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 4: API functions**

```typescript
// src/api/auth.ts
import axios from 'axios';
export const authApi = {
  callback: (code: string) => axios.get(`/auth/sso/callback?code=${code}`),
  me: () => axios.get('/auth/me'),
  logout: () => axios.post('/auth/logout'),
};

// src/api/bestPractices.ts
import { api } from './client';
import type { BestPracticeRequest } from '../types';
export const bpApi = {
  list: (params: object) => api.get('/best-practices', { params }),
  trending: () => api.get('/best-practices/trending'),
  detail: (id: string) => api.get(`/best-practices/${id}`),
  create: (data: BestPracticeRequest) => api.post('/best-practices', data),
  update: (id: string, data: BestPracticeRequest) => api.put(`/best-practices/${id}`, data),
  delete: (id: string) => api.delete(`/best-practices/${id}`),
  submit: (id: string) => api.post(`/best-practices/${id}/submit`),
  mySubmissions: () => api.get('/best-practices/my'),
  uploadFile: (id: string, file: File) => {
    const form = new FormData(); form.append('file', file);
    return api.post(`/best-practices/${id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadFile: (bpId: string, fileId: string) =>
    api.get(`/best-practices/${bpId}/files/${fileId}/download`, { maxRedirects: 0 }),
};

// src/api/admin.ts
import { api } from './client';
export const adminApi = {
  queue: () => api.get('/admin/best-practices/queue'),
  take: (id: string) => api.put(`/admin/best-practices/${id}/take`),
  approve: (id: string) => api.put(`/admin/best-practices/${id}/approve`),
  reject: (id: string, comment: string) => api.put(`/admin/best-practices/${id}/reject`, { comment }),
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  updateRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
};
```

- [ ] **Step 5: App routing + Layout**

```typescript
// src/components/layout/Header.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-6">
      <Link to="/" className="font-bold text-xl text-blue-600">⚡ AXon</Link>
      <nav className="flex gap-4 flex-1">
        <Link to="/" className="text-gray-600 hover:text-gray-900">Browse</Link>
        <Link to="/?sort=trending" className="text-gray-600 hover:text-gray-900">Trending</Link>
      </nav>
      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <Link to="/submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700">
            + Submit
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-2 text-sm text-gray-700">
              {user?.avatar_url ? <img src={user.avatar_url} className="w-8 h-8 rounded-full" alt={user.name} /> : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                  {user?.name[0]}
                </div>
              )}
              <span>{user?.name}</span> ▾
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded shadow-lg border hidden group-hover:block z-10">
              <Link to="/my-submissions" className="block px-4 py-2 text-sm hover:bg-gray-50">My Submissions</Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50">Admin Dashboard</Link>
              )}
              <hr className="my-1" />
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <a href="/auth/sso/login" className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700">
          Sign in
        </a>
      )}
    </header>
  );
}
```

```typescript
// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { BrowsePage } from './pages/BrowsePage';
import { DetailPage } from './pages/DetailPage';
import { SubmitPage } from './pages/SubmitPage';
import { MySubmissionsPage } from './pages/MySubmissionsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReviewPage } from './pages/admin/ReviewPage';
import { SSOCallback } from './pages/auth/SSOCallback';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<SSOCallback />} />
          <Route element={<Layout />}>
            <Route path="/" element={<BrowsePage />} />
            <Route path="/best-practices/:id" element={<DetailPage />} />
          </Route>
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/submit/:id" element={<SubmitPage />} />
            <Route path="/my-submissions" element={<MySubmissionsPage />} />
          </Route>
          <Route element={<RequireAdmin><Layout /></RequireAdmin>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review/:id" element={<ReviewPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

```typescript
// src/pages/auth/SSOCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export function SSOCallback() {
  const [params] = useSearchParams();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get('code');
    if (!code) { navigate('/'); return; }
    authApi.callback(code).then(({ data }) => {
      login(data.access_token, data.user);
      navigate('/');
    }).catch(() => navigate('/'));
  }, []);

  return <div className="flex items-center justify-center h-screen">Đang đăng nhập...</div>;
}
```

- [ ] **Step 6: Commit**

```bash
git add axon-frontend/src/
git commit -m "feat: frontend — types, API client, auth store, routing, layout"
```

---

### Task 11: Browse Page + Core UI Components

**Files:**
- Create: `src/components/TypeBadge.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/RankingBadge.tsx`
- Create: `src/components/BestPracticeCard.tsx`
- Create: `src/pages/BrowsePage.tsx`

- [ ] **Step 1: Shared components**

```typescript
// src/components/TypeBadge.tsx
import type { BPType } from '../types';
const config: Record<BPType, { icon: string; label: string; cls: string }> = {
  SKILL_SET:      { icon: '🔧', label: 'Skill Set',  cls: 'bg-blue-100 text-blue-700' },
  MCP_CONFIG:     { icon: '🔌', label: 'MCP Config', cls: 'bg-green-100 text-green-700' },
  RULE_SET:       { icon: '📋', label: 'Rule Set',   cls: 'bg-orange-100 text-orange-700' },
  AGENT_WORKFLOW: { icon: '⚡', label: 'Workflow',   cls: 'bg-violet-100 text-violet-700' },
};
export function TypeBadge({ type }: { type: BPType }) {
  const c = config[type];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
    {c.icon} {c.label}
  </span>;
}
```

```typescript
// src/components/StatusBadge.tsx
import type { BPStatus } from '../types';
const config: Record<BPStatus, { label: string; cls: string }> = {
  DRAFT:          { label: 'Draft',          cls: 'bg-gray-100 text-gray-600' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700' },
  UNDER_REVIEW:   { label: 'Under Review',   cls: 'bg-blue-100 text-blue-700' },
  PUBLISHED:      { label: 'Published',      cls: 'bg-green-100 text-green-700' },
  REJECTED:       { label: 'Rejected',       cls: 'bg-red-100 text-red-700' },
};
export function StatusBadge({ status }: { status: BPStatus }) {
  const c = config[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
    {c.label}
  </span>;
}
```

```typescript
// src/components/RankingBadge.tsx
export function RankingBadge({ score }: { score: number }) {
  if (score < 10) return null;
  const cls = score >= 100 ? 'text-yellow-500' : score >= 50 ? 'text-gray-400' : 'text-amber-800';
  return <span className={`text-sm font-medium ${cls}`}>★ {score.toFixed(1)}</span>;
}
```

```typescript
// src/components/BestPracticeCard.tsx
import { Link } from 'react-router-dom';
import type { BestPracticeListItem } from '../types';
import { TypeBadge } from './TypeBadge';
import { RankingBadge } from './RankingBadge';

export function BestPracticeCard({ bp }: { bp: BestPracticeListItem }) {
  return (
    <Link to={`/best-practices/${bp.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <TypeBadge type={bp.type} />
        <RankingBadge score={bp.usage_score} />
      </div>
      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{bp.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{bp.description}</p>
      <div className="flex gap-1 mb-3 flex-wrap">
        {bp.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 border-t pt-2 mt-2">
        <div className="flex items-center gap-1 flex-1">
          {bp.author.avatar_url
            ? <img src={bp.author.avatar_url} className="w-5 h-5 rounded-full" alt="" />
            : <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">{bp.author.name[0]}</div>
          }
          <span className="truncate">{bp.author.name}</span>
        </div>
        <span>👁 {bp.view_count}</span>
        <span>⬇ {bp.download_count}</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: BrowsePage**

```typescript
// src/pages/BrowsePage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bpApi } from '../api/bestPractices';
import { BestPracticeCard } from '../components/BestPracticeCard';
import { TypeBadge } from '../components/TypeBadge';
import type { BPType, BestPracticeListItem } from '../types';

const TYPES: BPType[] = ['SKILL_SET', 'MCP_CONFIG', 'RULE_SET', 'AGENT_WORKFLOW'];

export function BrowsePage() {
  const [type, setType] = useState<BPType | ''>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'trending'>('newest');
  const [page, setPage] = useState(0);

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => bpApi.trending().then(r => r.data as BestPracticeListItem[]),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['best-practices', type, search, sort, page],
    queryFn: () => bpApi.list({ type: type || undefined, search: search || undefined, sort, page })
      .then(r => r.data),
  });

  return (
    <div>
      {trending && trending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🔥 Trending Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.slice(0, 3).map(bp => <BestPracticeCard key={bp.id} bp={bp} />)}
          </div>
        </section>
      )}

      <div className="mb-4">
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="🔍 Search best practices..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-6">
        <button onClick={() => { setType(''); setPage(0); }}
          className={`px-3 py-1 rounded-full text-sm border ${!type ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          All Types
        </button>
        {TYPES.map(t => (
          <button key={t} onClick={() => { setType(t); setPage(0); }}
            className={`px-3 py-1 rounded-full text-sm border ${type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {t.replace('_', ' ')}
          </button>
        ))}
        <div className="ml-auto">
          <select value={sort} onChange={e => setSort(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="newest">Newest</option>
            <option value="trending">Most Popular</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : !data?.content?.length ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No best practices found.</p>
          <a href="/submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Submit one</a>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.totalElements} results</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.content.map((bp: BestPracticeListItem) => <BestPracticeCard key={bp.id} bp={bp} />)}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`px-3 py-1 rounded border text-sm ${page === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Start dev server, kiểm tra browse page**

```bash
cd axon-frontend && npm run dev
# Mở http://localhost:5173
# Expected: Browse page hiển thị, search hoạt động
```

- [ ] **Step 4: Commit**

```bash
git add axon-frontend/src/
git commit -m "feat: browse page with search, filter, trending section"
```

---

### Task 12: Detail Page, Submit Form, My Submissions, Admin UI

Do scope còn lại của FE, mỗi page implement theo cùng pattern:
1. Dùng `useQuery`/`useMutation` từ TanStack Query để fetch/mutate
2. Mapping data vào các UI component đã có
3. Handle loading, error, empty state

Chi tiết implement tham khảo wireframe trong UI/UX doc (`2026-05-10-axon-uiux.md`).

**Files:**
- Create: `src/pages/DetailPage.tsx` — gọi `bpApi.detail(id)`, hiển thị FileList, AgentWorkflowEmbed
- Create: `src/pages/SubmitPage.tsx` — 4-step form, `bpApi.create()` → upload files → `bpApi.submit()`
- Create: `src/pages/MySubmissionsPage.tsx` — gọi `bpApi.mySubmissions()`, hiển thị StatusBadge
- Create: `src/pages/admin/AdminDashboard.tsx` — gọi `adminApi.queue()`, `adminApi.stats()`
- Create: `src/pages/admin/ReviewPage.tsx` — detail view + approve/reject panel
- Create: `src/components/FileList.tsx` — list files + download button
- Create: `src/components/AgentWorkflowEmbed.tsx` — fetch workflow info + "Open" button
- Create: `src/components/StatusTimeline.tsx` — approval history timeline

- [ ] **Step 1: Commit sau khi implement xong từng page**

```bash
git add axon-frontend/src/pages/ axon-frontend/src/components/
git commit -m "feat: detail page, submit form, my submissions, admin UI"
```

---

## Phase 5 — Integration & Verification

### Task 13: End-to-End Smoke Test

- [ ] **Step 1: Chạy toàn bộ hệ thống**

```bash
docker compose up -d
cd axon-backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
cd axon-frontend && npm run dev &
```

- [ ] **Step 2: Kiểm tra luồng hoàn chỉnh**

```
1. Mở http://localhost:5173
2. Click "Sign in" → redirect → callback → về Browse page
3. Click "+ Submit" → điền form → upload file → Submit for Review
4. Mở tab khác (same session) → Browse page không thấy BP vừa tạo (chưa published)
5. [Admin] /admin → Queue → Review → Approve
6. Browse page → BP mới xuất hiện
7. Click BP → Download file → kiểm tra download bắt đầu
8. Chờ 1h hoặc trigger ranking job thủ công → kiểm tra trending
```

- [ ] **Step 3: Chạy toàn bộ unit tests**

```bash
cd axon-backend
./mvnw test
# Expected: All tests pass
```

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat: AXon platform — Phase 1-4 complete, all tests passing"
```

---

## Verification Checklist

| Requirement | Cách kiểm tra |
|-------------|--------------|
| Auth SSO mock | `curl /auth/sso/callback?code=any` → trả JWT |
| CRUD best practice | POST/GET/PUT/DELETE `/api/v1/best-practices` với valid JWT |
| File upload/download | Upload file, download → check redirect + file content |
| Submit workflow | DRAFT → submit → PENDING_REVIEW trong DB |
| Admin approve | UNDER_REVIEW → approve → PUBLISHED, hiện trên browse |
| Admin reject | REJECTED + comment, không hiện trên browse |
| Ranking job | Log VIEW/DOWNLOAD → trigger scheduler → usage_score tăng |
| Trending cache | GET `/trending` → trả từ Redis (check Redis CLI) |
| Agent Builder proxy | GET `/api/v1/agent-builder/workflows/:id` → proxy response |
| FE browse + filter | Filter theo type, search keyword → đúng kết quả |
| FE submit form | 4 steps, auto-save draft, submit thành công |
| FE admin review | Queue hiện đúng, approve/reject hoạt động |
