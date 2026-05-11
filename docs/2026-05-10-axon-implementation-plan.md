# AXon v2.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng AXon — web platform nội bộ Samsung để AX Creator đăng ký AI best practice, AX Supporter kiểm duyệt/publish/close, người dùng browse-tìm-like-feedback-download, có dashboard monitoring cho Supporter và analytics riêng cho Creator.

**Architecture:** React 18 SPA + Spring Boot 3 REST API. Backend: SSO pluggable (Mock dev, CIP/AD prod) → JWT. State machine REQUESTED↔REJECTED↔PUBLISHED↔CLOSED. Files lưu MinIO + presigned URL TTL 15 phút. Email notification cho mọi transition. Dashboard cache qua Redis TTL 15 phút.

**Tech Stack:** Java 21 + Spring Boot 3.4 + Spring Security | React 18 + TypeScript + Vite + TailwindCSS + Zustand + TanStack Query | PostgreSQL 16 | Redis 7 | MinIO | Flyway | Docker Compose

**References:** `docs/2026-05-10-axon-requirements.md`, `docs/2026-05-10-axon-hld.md`, `docs/2026-05-10-axon-dld.md`, `docs/2026-05-10-axon-design.md`

---

## File Structure

### Backend (`axon-backend/`)

```
src/main/java/com/axon/
├── AXonApplication.java
├── config/
│   ├── SecurityConfig.java          -- Spring Security, CORS, JWT filter chain
│   ├── RedisConfig.java
│   ├── MinioConfig.java
│   └── WebMvcConfig.java
├── common/
│   ├── ApiError.java                -- error response DTO
│   ├── GlobalExceptionHandler.java
│   ├── PagedResponse.java
│   └── exception/                   -- ForbiddenException, NotFoundException, InvalidStateException, ConflictException
├── auth/
│   ├── sso/SSOProvider.java         -- interface
│   ├── sso/SSOUserInfo.java         -- record(email, name, cipId, avatarUrl, departmentName)
│   ├── sso/MockSSOProvider.java     -- dev profile only
│   ├── jwt/JwtService.java
│   ├── jwt/JwtAuthFilter.java
│   ├── AuthController.java          -- /auth/login, /callback, /refresh, /logout, /me
│   ├── AuthService.java
│   └── dto/{TokenResponse, UserInfoResponse}.java
├── user/
│   ├── User.java                    -- @Entity
│   ├── UserRole.java                -- enum USER, AX_CREATOR, AX_SUPPORTER, ADMIN
│   ├── UserRepository.java
│   ├── UserService.java
│   ├── AdminUserController.java     -- /api/v1/admin/users
│   └── dto/{UserItem, UpdateRoleRequest}.java
├── lookup/
│   ├── job/                         -- Job entity + repo + service + public controller + admin controller
│   ├── aicapability/
│   ├── workcategory/
│   ├── work/                        -- Work links to WorkCategory; service blocks delete if BPs reference
│   ├── department/
│   ├── aitool/
│   └── common/LookupInUseException.java
├── bestpractice/
│   ├── BestPractice.java
│   ├── BestPracticeType.java        -- enum WEB, TOOL, EXTENSION
│   ├── BestPracticeStatus.java
│   ├── BestPracticeRepository.java
│   ├── BestPracticeQueryRepository.java -- JPA Specification or Criteria for filter+sort
│   ├── BestPracticeService.java     -- CRUD + state machine + key masking
│   ├── BestPracticeController.java  -- public + user endpoints
│   ├── MyBestPracticeController.java
│   └── dto/{BestPracticeRequest, BestPracticeResponse, BestPracticeListItem, BestPracticeFilterRequest}.java
├── file/
│   ├── BpFile.java
│   ├── BpFileRepository.java
│   ├── FileService.java
│   ├── FileController.java
│   └── dto/FileResponse.java
├── management/
│   ├── BpReview.java
│   ├── ReviewAction.java            -- enum APPROVED, REJECTED, CLOSED
│   ├── BpReviewRepository.java
│   ├── ManagementService.java
│   ├── ManagementController.java
│   └── dto/{ApproveRequest, RejectRequest, CloseRequest, ReviewItem}.java
├── interaction/
│   ├── BpLike.java + BpLikeRepository
│   ├── BpFeedback.java + BpFeedbackRepository
│   ├── BpDownload.java + BpDownloadRepository
│   ├── InteractionService.java      -- toggleLike, submitFeedback, logDownload
│   └── dto/{LikeResponse, FeedbackResponse, FeedbackRequest}.java
├── analytics/
│   ├── AnalyticsService.java
│   ├── AnalyticsController.java     -- /best-practices/:id/analytics
│   └── dto/AnalyticsResponse.java
├── dashboard/
│   ├── DashboardService.java        -- @Cacheable(redis, ttl 15m)
│   ├── DashboardController.java
│   └── dto/DashboardResponse.java
└── notification/
    ├── NotificationService.java     -- interface
    └── EmailNotificationService.java -- JavaMailSender impl

src/main/resources/
├── application.yml
├── application-dev.yml
└── db/migration/
    ├── V1__create_lookups.sql
    ├── V2__create_users.sql
    ├── V3__create_best_practices.sql
    ├── V4__create_junctions.sql
    ├── V5__create_files.sql
    ├── V6__create_likes.sql
    ├── V7__create_feedback.sql
    ├── V8__create_downloads.sql
    ├── V9__create_reviews.sql
    └── V10__seed_lookups.sql

src/test/java/com/axon/
├── auth/AuthServiceTest.java
├── user/UserServiceTest.java
├── lookup/job/JobServiceTest.java
├── bestpractice/BestPracticeServiceTest.java
├── bestpractice/BestPracticeStateMachineTest.java
├── bestpractice/BestPracticeQueryTest.java       -- @SpringBootTest + Testcontainers
├── file/FileServiceTest.java
├── management/ManagementServiceTest.java
├── interaction/InteractionServiceTest.java
├── analytics/AnalyticsServiceTest.java
└── dashboard/DashboardServiceTest.java
```

### Frontend (`axon-frontend/`)

```
src/
├── main.tsx
├── App.tsx                            -- routing tree
├── types/index.ts                     -- shared type defs (mirror BE DTOs)
├── api/
│   ├── client.ts                      -- axios + JWT interceptor + refresh logic
│   ├── auth.ts
│   ├── bestPractices.ts
│   ├── files.ts
│   ├── management.ts
│   ├── interactions.ts
│   ├── analytics.ts
│   ├── dashboard.ts
│   ├── lookups.ts
│   └── admin.ts
├── store/authStore.ts                 -- Zustand (user, accessToken, helpers)
├── hooks/
│   ├── useAuth.ts
│   └── useRoleGuard.ts
├── components/
│   ├── layout/{Layout,Header,RoleNav}.tsx
│   ├── guards/{RequireAuth,RequireRole}.tsx
│   ├── library/{BPCard,FilterPanel,SortDropdown,SearchBar,Paginator,CreatorAvatars}.tsx
│   ├── detail/{InfoBlock,FilesBlock,LikeButton,FeedbackForm,FeedbackList,KeyValueBlock}.tsx
│   ├── register/{StepBasic,StepCategorization,StepContent,StepReview,CreatorPicker,LookupMultiSelect}.tsx
│   ├── management/{StatusFilter,ReviewActions}.tsx
│   ├── dashboard/{StatCard,TopList}.tsx
│   ├── admin/{UserRow,LookupTable}.tsx
│   └── shared/{TypeBadge,StatusBadge,Spinner,Pill,ConfirmDialog,Toast}.tsx
└── pages/
    ├── LibraryPage.tsx
    ├── DetailPage.tsx
    ├── RegisterPage.tsx               -- both create + edit
    ├── MyBPsPage.tsx
    ├── ManagementPage.tsx
    ├── ReviewPage.tsx
    ├── DashboardPage.tsx
    ├── auth/AuthCallback.tsx
    └── admin/
        ├── AdminUsersPage.tsx
        └── AdminLookupsPage.tsx
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
- Create: `axon-frontend/src/index.css`

- [ ] **Step 1: Generate Spring Boot project**

```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.4.0 \
  -d groupId=com.axon \
  -d artifactId=axon-backend \
  -d javaVersion=21 \
  -d dependencies=web,data-jpa,security,postgresql,flyway,data-redis,lombok,actuator,mail,validation \
  -o axon-backend.zip
unzip axon-backend.zip -d axon-backend
```

Append to `axon-backend/pom.xml` `<dependencies>`:

```xml
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
<dependency>
  <groupId>io.minio</groupId>
  <artifactId>minio</artifactId>
  <version>8.5.12</version>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
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

- [ ] **Step 2: Write application.yml**

```yaml
# src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/axon
    username: ${DB_USER:axon}
    password: ${DB_PASSWORD:axon}
  jpa:
    hibernate.ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration
  data.redis:
    host: ${REDIS_HOST:localhost}
    port: 6379
  cache:
    type: redis
  mail:
    host: ${SMTP_HOST:localhost}
    port: ${SMTP_PORT:1025}

minio:
  endpoint:   ${MINIO_ENDPOINT:http://localhost:9000}
  access-key: ${MINIO_ACCESS_KEY:minioadmin}
  secret-key: ${MINIO_SECRET_KEY:minioadmin}
  bucket:     axon-files

jwt:
  secret:            ${JWT_SECRET:dev-secret-key-minimum-256-bits-long-do-not-use-prod!!}
  access-token-ttl:  900
  refresh-token-ttl: 604800

sso:
  provider: ${SSO_PROVIDER:mock}      # mock | cipad

cipad:
  base-url:      ${CIP_AD_URL:}
  client-id:     ${CIP_AD_CLIENT_ID:}
  client-secret: ${CIP_AD_CLIENT_SECRET:}
  redirect-uri:  ${CIP_AD_REDIRECT_URI:http://localhost:5173/auth/callback}

notification.email.from: ${NOTIFICATION_FROM:axon@company.local}

management.endpoints.web.exposure.include: health,info
```

```yaml
# src/main/resources/application-dev.yml
spring:
  jpa.show-sql: true
logging.level.com.axon: DEBUG
```

- [ ] **Step 3: Scaffold Vite + React + TypeScript**

```bash
npm create vite@latest axon-frontend -- --template react-ts
cd axon-frontend
npm install
npm install axios zustand @tanstack/react-query react-router-dom@6 react-hook-form
npm install -D tailwindcss@3 @tailwindcss/typography autoprefixer postcss @types/node
npx tailwindcss init -p
```

`tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
```

`src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':  'http://localhost:8080',
      '/auth': 'http://localhost:8080',
    },
  },
});
```

- [ ] **Step 4: Write docker-compose.yml**

```yaml
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

  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]

volumes:
  pgdata:
  miniodata:
```

- [ ] **Step 5: Start infra and verify**

```bash
docker compose up -d
docker compose exec postgres pg_isready -U axon
# Expected: accepting connections

# MinIO console
open http://localhost:9001
# Login minioadmin/minioadmin → create bucket "axon-files"

# MailHog UI
open http://localhost:8025
```

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml axon-backend/ axon-frontend/
git commit -m "feat: project scaffolding — Spring Boot 3 + Vite/React + Docker Compose"
```

---

### Task 2: Flyway Migrations (V1–V10)

**Files:**
- Create: `axon-backend/src/main/resources/db/migration/V1__create_lookups.sql`
- Create: `axon-backend/src/main/resources/db/migration/V2__create_users.sql`
- Create: `axon-backend/src/main/resources/db/migration/V3__create_best_practices.sql`
- Create: `axon-backend/src/main/resources/db/migration/V4__create_junctions.sql`
- Create: `axon-backend/src/main/resources/db/migration/V5__create_files.sql`
- Create: `axon-backend/src/main/resources/db/migration/V6__create_likes.sql`
- Create: `axon-backend/src/main/resources/db/migration/V7__create_feedback.sql`
- Create: `axon-backend/src/main/resources/db/migration/V8__create_downloads.sql`
- Create: `axon-backend/src/main/resources/db/migration/V9__create_reviews.sql`
- Create: `axon-backend/src/main/resources/db/migration/V10__seed_lookups.sql`

- [ ] **Step 1: V1 — Lookups**

```sql
-- V1__create_lookups.sql
CREATE TABLE jobs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE ai_capabilities (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE work_categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE works (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100) NOT NULL,
    work_category_id UUID NOT NULL REFERENCES work_categories(id)
);
CREATE INDEX idx_works_category ON works(work_category_id);

CREATE TABLE departments (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ai_tools (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);
```

- [ ] **Step 2: V2 — Users**

```sql
-- V2__create_users.sql
CREATE TYPE user_role AS ENUM ('USER', 'AX_CREATOR', 'AX_SUPPORTER', 'ADMIN');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    cip_id        VARCHAR(100) UNIQUE,
    role          user_role NOT NULL DEFAULT 'USER',
    department_id UUID REFERENCES departments(id),
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_cip_id ON users(cip_id);
CREATE INDEX idx_users_role   ON users(role);
```

- [ ] **Step 3: V3 — Best Practices**

```sql
-- V3__create_best_practices.sql
CREATE TYPE bp_type   AS ENUM ('WEB', 'TOOL', 'EXTENSION');
CREATE TYPE bp_status AS ENUM ('REQUESTED', 'REJECTED', 'PUBLISHED', 'CLOSED');

CREATE TABLE best_practices (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(200) NOT NULL,
    description        TEXT,
    thumbnail_url      VARCHAR(500),
    installation_guide TEXT,
    type               bp_type NOT NULL,
    web_content        VARCHAR(256),
    key_value          TEXT,
    work_id            UUID REFERENCES works(id),
    status             bp_status NOT NULL DEFAULT 'REQUESTED',
    close_reason       TEXT,
    view_count         INT NOT NULL DEFAULT 0,
    like_count         INT NOT NULL DEFAULT 0,
    download_count     INT NOT NULL DEFAULT 0,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at       TIMESTAMP
);
CREATE INDEX idx_bp_status         ON best_practices(status);
CREATE INDEX idx_bp_type           ON best_practices(type);
CREATE INDEX idx_bp_work           ON best_practices(work_id);
CREATE INDEX idx_bp_like_count     ON best_practices(like_count DESC);
CREATE INDEX idx_bp_view_count     ON best_practices(view_count DESC);
CREATE INDEX idx_bp_download_count ON best_practices(download_count DESC);
CREATE INDEX idx_bp_published_at   ON best_practices(published_at DESC);
```

- [ ] **Step 4: V4 — Junctions**

```sql
-- V4__create_junctions.sql
CREATE TABLE bp_creators (
    bp_id   UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    PRIMARY KEY (bp_id, user_id)
);
CREATE INDEX idx_bp_creators_user ON bp_creators(user_id);

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

CREATE TABLE bp_ai_tools (
    bp_id      UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    ai_tool_id UUID NOT NULL REFERENCES ai_tools(id),
    PRIMARY KEY (bp_id, ai_tool_id)
);

CREATE TABLE bp_departments (
    bp_id         UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id),
    PRIMARY KEY (bp_id, department_id)
);
```

- [ ] **Step 5: V5–V9 (files, likes, feedback, downloads, reviews)**

```sql
-- V5__create_files.sql
CREATE TABLE bp_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100),
    storage_key VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bp_files_bp_id ON bp_files(bp_id);
```

```sql
-- V6__create_likes.sql
CREATE TABLE bp_likes (
    bp_id      UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bp_id, user_id)
);
CREATE INDEX idx_bp_likes_user ON bp_likes(user_id);
```

```sql
-- V7__create_feedback.sql
CREATE TABLE bp_feedback (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id      UUID NOT NULL REFERENCES best_practices(id),
    user_id    UUID NOT NULL REFERENCES users(id),
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_feedback_bp_id      ON bp_feedback(bp_id);
CREATE INDEX idx_feedback_created_at ON bp_feedback(created_at DESC);
```

```sql
-- V8__create_downloads.sql
CREATE TABLE bp_downloads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id         UUID NOT NULL REFERENCES best_practices(id),
    user_id       UUID NOT NULL REFERENCES users(id),
    downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_downloads_bp_id ON bp_downloads(bp_id);
CREATE INDEX idx_downloads_date  ON bp_downloads(downloaded_at DESC);
```

```sql
-- V9__create_reviews.sql
CREATE TYPE review_action AS ENUM ('APPROVED', 'REJECTED', 'CLOSED');

CREATE TABLE bp_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id),
    reviewer_id UUID REFERENCES users(id),
    action      review_action NOT NULL,
    comment     TEXT,
    reviewed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_bp_id ON bp_reviews(bp_id);
```

- [ ] **Step 6: V10 — Seed lookups**

```sql
-- V10__seed_lookups.sql
INSERT INTO jobs (name, display_order) VALUES
    ('Code Implementation', 1),
    ('Research', 2),
    ('Operation', 3),
    ('Report', 4);

INSERT INTO ai_capabilities (name, display_order) VALUES
    ('Q&A', 1),
    ('Workflow Assistant', 2),
    ('Auto AI Agent', 3),
    ('AI Orchestration', 4);

INSERT INTO ai_tools (name, display_order) VALUES
    ('Claude', 1),
    ('Cursor', 2),
    ('GitHub Copilot', 3),
    ('ChatGPT', 4);

INSERT INTO work_categories (name) VALUES
    ('Development'),
    ('Quality'),
    ('Documentation');

INSERT INTO works (name, work_category_id)
SELECT 'Code Review', id FROM work_categories WHERE name='Development';
INSERT INTO works (name, work_category_id)
SELECT 'Unit Testing', id FROM work_categories WHERE name='Quality';
INSERT INTO works (name, work_category_id)
SELECT 'API Docs', id FROM work_categories WHERE name='Documentation';

INSERT INTO departments (name) VALUES
    ('Platform'),
    ('Mobile'),
    ('Data'),
    ('QA');
```

- [ ] **Step 7: Run migration**

```bash
cd axon-backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Expected log: Flyway: Successfully applied 10 migrations
docker compose exec postgres psql -U axon -d axon -c "\dt"
# Expected tables: jobs, ai_capabilities, work_categories, works, departments, ai_tools,
#                  users, best_practices, bp_creators, bp_jobs, bp_ai_capabilities,
#                  bp_ai_tools, bp_departments, bp_files, bp_likes, bp_feedback,
#                  bp_downloads, bp_reviews
```

- [ ] **Step 8: Commit**

```bash
git add axon-backend/src/main/resources/db/migration/
git commit -m "feat: database schema — 10 Flyway migrations (lookups, BP, junctions, interactions)"
```

---

### Task 3: Core Entities & Repositories

**Files:**
- Create: `axon-backend/src/main/java/com/axon/user/{UserRole.java, User.java, UserRepository.java}`
- Create: `axon-backend/src/main/java/com/axon/lookup/job/{Job.java, JobRepository.java}` (and same pattern for `aicapability`, `workcategory`, `work`, `department`, `aitool`)
- Create: `axon-backend/src/main/java/com/axon/bestpractice/{BestPracticeType.java, BestPracticeStatus.java, BestPractice.java, BestPracticeRepository.java}`
- Create: `axon-backend/src/main/java/com/axon/file/{BpFile.java, BpFileRepository.java}`
- Create: `axon-backend/src/main/java/com/axon/interaction/{BpLike.java, BpLikeRepository.java, BpFeedback.java, BpFeedbackRepository.java, BpDownload.java, BpDownloadRepository.java}`
- Create: `axon-backend/src/main/java/com/axon/management/{ReviewAction.java, BpReview.java, BpReviewRepository.java}`
- Create: `axon-backend/src/test/java/com/axon/bestpractice/BestPracticeRepositoryIT.java`

- [ ] **Step 1: Enums**

```java
// user/UserRole.java
package com.axon.user;
public enum UserRole { USER, AX_CREATOR, AX_SUPPORTER, ADMIN }
```

```java
// bestpractice/BestPracticeType.java
package com.axon.bestpractice;
public enum BestPracticeType { WEB, TOOL, EXTENSION }
```

```java
// bestpractice/BestPracticeStatus.java
package com.axon.bestpractice;
public enum BestPracticeStatus { REQUESTED, REJECTED, PUBLISHED, CLOSED }
```

```java
// management/ReviewAction.java
package com.axon.management;
public enum ReviewAction { APPROVED, REJECTED, CLOSED }
```

- [ ] **Step 2: Lookup entities — Job (pattern for all 6)**

```java
// lookup/job/Job.java
package com.axon.lookup.job;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity @Table(name = "jobs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {
    @Id @GeneratedValue private UUID id;
    @Column(nullable=false, unique=true) private String name;
    @Column(name="display_order", nullable=false) private int displayOrder;
}
```

```java
// lookup/job/JobRepository.java
package com.axon.lookup.job;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findAllByOrderByDisplayOrderAsc();
    boolean existsByName(String name);
}
```

Repeat the same pattern for: `AiCapability`, `WorkCategory`, `Work`, `Department`, `AiTool`. `Work` has an additional `@ManyToOne WorkCategory workCategory`.

```java
// lookup/work/Work.java
package com.axon.lookup.work;

import com.axon.lookup.workcategory.WorkCategory;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity @Table(name = "works")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Work {
    @Id @GeneratedValue private UUID id;
    @Column(nullable=false) private String name;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="work_category_id", nullable=false)
    private WorkCategory workCategory;
}
```

```java
// lookup/work/WorkRepository.java
package com.axon.lookup.work;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface WorkRepository extends JpaRepository<Work, UUID> {
    List<Work> findAllByWorkCategoryId(UUID workCategoryId);
}
```

- [ ] **Step 3: User entity + repository**

```java
// user/User.java
package com.axon.user;

import com.axon.lookup.department.Department;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue private UUID id;
    @Column(nullable=false, unique=true) private String email;
    @Column(nullable=false) private String name;
    @Column(name="cip_id", unique=true) private String cipId;
    @Enumerated(EnumType.STRING) @Column(columnDefinition="user_role") private UserRole role;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="department_id") private Department department;
    @Column(name="avatar_url") private String avatarUrl;
    @Column(name="created_at", updatable=false) private Instant createdAt;

    @PrePersist void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (role == null) role = UserRole.USER;
    }
}
```

```java
// user/UserRepository.java
package com.axon.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByCipId(String cipId);
    boolean existsByDepartmentId(UUID departmentId);
}
```

Add a Hibernate type mapping for the Postgres enum. Use `@JdbcType` if needed, or a custom converter. Pragmatic approach: cast in SQL using `CREATE CAST` is overkill — use `@Enumerated(EnumType.STRING)` with `columnDefinition="varchar"` and change the migration to `VARCHAR` if enum cast fails. Acceptable alternative: use `@org.hibernate.annotations.JdbcType(PostgreSQLEnumJdbcType.class)`.

- [ ] **Step 4: BestPractice entity (with relations)**

```java
// bestpractice/BestPractice.java
package com.axon.bestpractice;

import com.axon.lookup.aicapability.AiCapability;
import com.axon.lookup.aitool.AiTool;
import com.axon.lookup.department.Department;
import com.axon.lookup.job.Job;
import com.axon.lookup.work.Work;
import com.axon.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity @Table(name = "best_practices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BestPractice {
    @Id @GeneratedValue private UUID id;
    @Column(nullable=false) private String name;
    @Column(columnDefinition="text") private String description;
    @Column(name="thumbnail_url") private String thumbnailUrl;
    @Column(name="installation_guide", columnDefinition="text") private String installationGuide;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private BestPracticeType type;
    @Column(name="web_content", length=256) private String webContent;
    @Column(name="key_value", columnDefinition="text") private String keyValue;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="work_id") private Work work;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private BestPracticeStatus status;
    @Column(name="close_reason", columnDefinition="text") private String closeReason;
    @Column(name="view_count", nullable=false) private int viewCount;
    @Column(name="like_count", nullable=false) private int likeCount;
    @Column(name="download_count", nullable=false) private int downloadCount;
    @Column(name="created_at", updatable=false) private Instant createdAt;
    @Column(name="updated_at") private Instant updatedAt;
    @Column(name="published_at") private Instant publishedAt;

    @ManyToMany @JoinTable(name="bp_creators",
        joinColumns=@JoinColumn(name="bp_id"),
        inverseJoinColumns=@JoinColumn(name="user_id"))
    @Builder.Default private Set<User> creators = new HashSet<>();

    @ManyToMany @JoinTable(name="bp_jobs",
        joinColumns=@JoinColumn(name="bp_id"),
        inverseJoinColumns=@JoinColumn(name="job_id"))
    @Builder.Default private Set<Job> jobs = new HashSet<>();

    @ManyToMany @JoinTable(name="bp_ai_capabilities",
        joinColumns=@JoinColumn(name="bp_id"),
        inverseJoinColumns=@JoinColumn(name="ai_capability_id"))
    @Builder.Default private Set<AiCapability> aiCapabilities = new HashSet<>();

    @ManyToMany @JoinTable(name="bp_ai_tools",
        joinColumns=@JoinColumn(name="bp_id"),
        inverseJoinColumns=@JoinColumn(name="ai_tool_id"))
    @Builder.Default private Set<AiTool> aiTools = new HashSet<>();

    @ManyToMany @JoinTable(name="bp_departments",
        joinColumns=@JoinColumn(name="bp_id"),
        inverseJoinColumns=@JoinColumn(name="department_id"))
    @Builder.Default private Set<Department> departments = new HashSet<>();

    @PrePersist void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (status == null) status = BestPracticeStatus.REQUESTED;
    }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
}
```

- [ ] **Step 5: BestPracticeRepository with atomic counter updates**

```java
// bestpractice/BestPracticeRepository.java
package com.axon.bestpractice;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface BestPracticeRepository
        extends JpaRepository<BestPractice, UUID>, JpaSpecificationExecutor<BestPractice> {

    @Modifying @Query("UPDATE BestPractice b SET b.viewCount = b.viewCount + 1 WHERE b.id = :id")
    int incrementViewCount(@Param("id") UUID id);

    @Modifying @Query("UPDATE BestPractice b SET b.likeCount = b.likeCount + 1 WHERE b.id = :id")
    int incrementLikeCount(@Param("id") UUID id);

    @Modifying @Query("UPDATE BestPractice b SET b.likeCount = b.likeCount - 1 WHERE b.id = :id AND b.likeCount > 0")
    int decrementLikeCount(@Param("id") UUID id);

    @Modifying @Query("UPDATE BestPractice b SET b.downloadCount = b.downloadCount + 1 WHERE b.id = :id")
    int incrementDownloadCount(@Param("id") UUID id);
}
```

- [ ] **Step 6: Interaction + file + review repositories**

```java
// file/BpFile.java
package com.axon.file;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="bp_files")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BpFile {
    @Id @GeneratedValue private UUID id;
    @Column(name="bp_id", nullable=false) private UUID bpId;
    @Column(name="file_name", nullable=false) private String fileName;
    @Column(name="file_size", nullable=false) private long fileSize;
    @Column(name="mime_type") private String mimeType;
    @Column(name="storage_key", nullable=false) private String storageKey;
    @Column(name="uploaded_at", updatable=false) private Instant uploadedAt;
    @PrePersist void pre() { if (uploadedAt == null) uploadedAt = Instant.now(); }
}
```

```java
// file/BpFileRepository.java
package com.axon.file;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface BpFileRepository extends JpaRepository<BpFile, UUID> {
    List<BpFile> findAllByBpId(UUID bpId);
}
```

```java
// interaction/BpLike.java
package com.axon.interaction;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="bp_likes")
@IdClass(BpLike.Key.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BpLike {
    @Id @Column(name="bp_id")   private UUID bpId;
    @Id @Column(name="user_id") private UUID userId;
    @Column(name="created_at", updatable=false) private Instant createdAt;
    @PrePersist void pre() { if (createdAt == null) createdAt = Instant.now(); }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Key implements Serializable {
        private UUID bpId;
        private UUID userId;
    }
}
```

```java
// interaction/BpLikeRepository.java
package com.axon.interaction;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface BpLikeRepository extends JpaRepository<BpLike, BpLike.Key> {
    boolean existsByBpIdAndUserId(UUID bpId, UUID userId);
    @Modifying @Query("DELETE FROM BpLike l WHERE l.bpId=:bp AND l.userId=:u")
    int deleteByBpIdAndUserId(@Param("bp") UUID bpId, @Param("u") UUID userId);
}
```

```java
// interaction/BpFeedback.java
package com.axon.interaction;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="bp_feedback")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BpFeedback {
    @Id @GeneratedValue private UUID id;
    @Column(name="bp_id",   nullable=false) private UUID bpId;
    @Column(name="user_id", nullable=false) private UUID userId;
    @Column(nullable=false, columnDefinition="text") private String content;
    @Column(name="created_at", updatable=false) private Instant createdAt;
    @PrePersist void pre() { if (createdAt == null) createdAt = Instant.now(); }
}
```

```java
// interaction/BpFeedbackRepository.java
package com.axon.interaction;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BpFeedbackRepository extends JpaRepository<BpFeedback, UUID> {
    Page<BpFeedback> findAllByBpIdOrderByCreatedAtDesc(UUID bpId, Pageable p);
    long countByBpId(UUID bpId);
    List<BpFeedback> findTop5ByBpIdOrderByCreatedAtDesc(UUID bpId);
}
```

```java
// interaction/BpDownload.java + BpDownloadRepository.java
@Entity @Table(name="bp_downloads")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BpDownload {
    @Id @GeneratedValue private UUID id;
    @Column(name="bp_id",   nullable=false) private UUID bpId;
    @Column(name="user_id", nullable=false) private UUID userId;
    @Column(name="downloaded_at", updatable=false) private Instant downloadedAt;
    @PrePersist void pre() { if (downloadedAt == null) downloadedAt = Instant.now(); }
}

public interface BpDownloadRepository extends JpaRepository<BpDownload, UUID> {
    long countByBpId(UUID bpId);
}
```

```java
// management/BpReview.java + BpReviewRepository.java
@Entity @Table(name="bp_reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BpReview {
    @Id @GeneratedValue private UUID id;
    @Column(name="bp_id",       nullable=false) private UUID bpId;
    @Column(name="reviewer_id")                 private UUID reviewerId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private ReviewAction action;
    @Column(columnDefinition="text") private String comment;
    @Column(name="reviewed_at", updatable=false) private Instant reviewedAt;
    @PrePersist void pre() { if (reviewedAt == null) reviewedAt = Instant.now(); }

    public static BpReview approved(UUID bpId, UUID reviewer) {
        return BpReview.builder().bpId(bpId).reviewerId(reviewer).action(ReviewAction.APPROVED).build();
    }
    public static BpReview rejected(UUID bpId, UUID reviewer, String comment) {
        return BpReview.builder().bpId(bpId).reviewerId(reviewer).action(ReviewAction.REJECTED).comment(comment).build();
    }
    public static BpReview closed(UUID bpId, UUID reviewer, String reason) {
        return BpReview.builder().bpId(bpId).reviewerId(reviewer).action(ReviewAction.CLOSED).comment(reason).build();
    }
}

public interface BpReviewRepository extends JpaRepository<BpReview, UUID> {
    List<BpReview> findAllByBpIdOrderByReviewedAtDesc(UUID bpId);
}
```

- [ ] **Step 7: Write Testcontainers integration test for BestPracticeRepository**

```java
// src/test/java/com/axon/bestpractice/BestPracticeRepositoryIT.java
package com.axon.bestpractice;

import com.axon.AXonApplication;
import com.axon.user.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = AXonApplication.class)
@Testcontainers
class BestPracticeRepositoryIT {
    @Container static PostgreSQLContainer<?> pg =
        new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("axon");

    @DynamicPropertySource static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",      pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);
    }

    @Autowired BestPracticeRepository bpRepo;
    @Autowired UserRepository userRepo;

    @Test void canPersistAndIncrement() {
        User u = userRepo.save(User.builder().email("a@x").name("A").role(UserRole.AX_CREATOR).build());
        BestPractice bp = BestPractice.builder()
            .name("Demo").type(BestPracticeType.WEB).webContent("https://x")
            .status(BestPracticeStatus.REQUESTED).build();
        bp.getCreators().add(u);
        bp = bpRepo.save(bp);

        assertThat(bpRepo.incrementViewCount(bp.getId())).isEqualTo(1);
        BestPractice reloaded = bpRepo.findById(bp.getId()).orElseThrow();
        assertThat(reloaded.getViewCount()).isEqualTo(1);
    }
}
```

- [ ] **Step 8: Run integration test, expect PASS**

```bash
cd axon-backend
./mvnw test -Dtest=BestPracticeRepositoryIT
# Expected: BUILD SUCCESS, 1 test passed
```

- [ ] **Step 9: Commit**

```bash
git add axon-backend/src/main/java/ axon-backend/src/test/
git commit -m "feat: core entities + repositories with Testcontainers integration"
```

---

### Task 4: Auth — SSO Provider, JWT, Filter, Controller

**Files:**
- Create: `auth/sso/{SSOProvider.java, SSOUserInfo.java, MockSSOProvider.java}`
- Create: `auth/jwt/{JwtService.java, JwtAuthFilter.java}`
- Create: `auth/{AuthService.java, AuthController.java}`
- Create: `auth/dto/{TokenResponse.java, UserInfoResponse.java}`
- Create: `user/UserService.java`
- Create: `config/SecurityConfig.java`
- Create: `common/exception/*` (NotFoundException, ForbiddenException, InvalidStateException, ConflictException) + `common/{ApiError.java, GlobalExceptionHandler.java}`
- Create: `src/test/java/com/axon/auth/AuthServiceTest.java`
- Create: `src/test/java/com/axon/auth/JwtServiceTest.java`

- [ ] **Step 1: Write failing JwtService test**

```java
// src/test/java/com/axon/auth/JwtServiceTest.java
package com.axon.auth;

import com.axon.auth.jwt.JwtService;
import com.axon.user.UserRole;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    JwtService jwt = new JwtService("test-secret-key-with-minimum-256-bits-padding!!", 900, 604800);

    @Test void generatesAndValidatesAccessToken() {
        UUID userId = UUID.randomUUID();
        String token = jwt.generateAccessToken(userId, UserRole.AX_CREATOR);

        assertThat(jwt.validate(token)).isTrue();
        assertThat(jwt.extractUserId(token)).isEqualTo(userId);
        assertThat(jwt.extractRole(token)).isEqualTo(UserRole.AX_CREATOR);
    }
}
```

Run: `./mvnw test -Dtest=JwtServiceTest`
Expected: FAIL — JwtService not implemented.

- [ ] **Step 2: Implement JwtService**

```java
// auth/jwt/JwtService.java
package com.axon.auth.jwt;

import com.axon.user.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessTtlSec;
    private final long refreshTtlSec;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-ttl}") long accessTtlSec,
            @Value("${jwt.refresh-token-ttl}") long refreshTtlSec) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlSec = accessTtlSec;
        this.refreshTtlSec = refreshTtlSec;
    }

    public String generateAccessToken(UUID userId, UserRole role) {
        return Jwts.builder()
            .subject(userId.toString())
            .claim("role", role.name())
            .claim("typ", "access")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessTtlSec * 1000))
            .signWith(key).compact();
    }

    public String generateRefreshToken(UUID userId) {
        return Jwts.builder()
            .subject(userId.toString())
            .claim("typ", "refresh")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshTtlSec * 1000))
            .signWith(key).compact();
    }

    public boolean validate(String token) {
        try { parse(token); return true; } catch (JwtException e) { return false; }
    }

    public UUID extractUserId(String token) { return UUID.fromString(parse(token).getSubject()); }
    public UserRole extractRole(String token) { return UserRole.valueOf(parse(token).get("role", String.class)); }
    public long getAccessTtlSec() { return accessTtlSec; }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
```

Run: `./mvnw test -Dtest=JwtServiceTest`
Expected: PASS.

- [ ] **Step 3: SSO abstraction + mock**

```java
// auth/sso/SSOUserInfo.java
package com.axon.auth.sso;
public record SSOUserInfo(String email, String name, String cipId, String avatarUrl, String departmentName) {}
```

```java
// auth/sso/SSOProvider.java
package com.axon.auth.sso;
public interface SSOProvider {
    String buildAuthorizeUrl(String state);
    SSOUserInfo exchange(String code);
}
```

```java
// auth/sso/MockSSOProvider.java
package com.axon.auth.sso;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class MockSSOProvider implements SSOProvider {
    @Override public String buildAuthorizeUrl(String state) {
        return "http://localhost:5173/auth/callback?code=mock-code&state=" + state;
    }
    @Override public SSOUserInfo exchange(String code) {
        if (!"mock-code".equals(code)) throw new IllegalArgumentException("invalid mock code");
        return new SSOUserInfo("dev@axon.local", "Dev User", "DEV001", null, "Platform");
    }
}
```

- [ ] **Step 4: UserService**

```java
// user/UserService.java
package com.axon.user;

import com.axon.auth.sso.SSOUserInfo;
import com.axon.lookup.department.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service @RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepo;
    private final DepartmentRepository deptRepo;

    @Transactional
    public User upsertFromSSO(SSOUserInfo info) {
        return userRepo.findByCipId(info.cipId())
            .map(u -> {
                u.setName(info.name());
                u.setAvatarUrl(info.avatarUrl());
                return u;
            })
            .orElseGet(() -> userRepo.save(User.builder()
                .email(info.email())
                .name(info.name())
                .cipId(info.cipId())
                .role(UserRole.USER)
                .avatarUrl(info.avatarUrl())
                .department(resolveDept(info.departmentName()))
                .build()));
    }

    private Department resolveDept(String name) {
        if (name == null) return null;
        return deptRepo.findByName(name).orElse(null);
    }
}
```

Add `Optional<Department> findByName(String name);` to `DepartmentRepository`.

- [ ] **Step 5: AuthService + DTOs + Controller**

```java
// auth/dto/TokenResponse.java
package com.axon.auth.dto;
import com.axon.auth.dto.UserInfoResponse;
public record TokenResponse(String accessToken, String refreshToken, long expiresIn, UserInfoResponse user) {}
```

```java
// auth/dto/UserInfoResponse.java
package com.axon.auth.dto;
import com.axon.user.User;
public record UserInfoResponse(String id, String email, String name, String role, String avatarUrl, String department) {
    public static UserInfoResponse of(User u) {
        return new UserInfoResponse(
            u.getId().toString(), u.getEmail(), u.getName(),
            u.getRole().name(), u.getAvatarUrl(),
            u.getDepartment() != null ? u.getDepartment().getName() : null);
    }
}
```

```java
// auth/AuthService.java
package com.axon.auth;

import com.axon.auth.dto.*;
import com.axon.auth.jwt.JwtService;
import com.axon.auth.sso.*;
import com.axon.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class AuthService {
    private final SSOProvider sso;
    private final UserService userService;
    private final UserRepository userRepo;
    private final JwtService jwt;

    public String authorizeUrl(String state) { return sso.buildAuthorizeUrl(state); }

    public TokenResponse handleCallback(String code) {
        SSOUserInfo info = sso.exchange(code);
        User user = userService.upsertFromSSO(info);
        String access = jwt.generateAccessToken(user.getId(), user.getRole());
        String refresh = jwt.generateRefreshToken(user.getId());
        return new TokenResponse(access, refresh, jwt.getAccessTtlSec(), UserInfoResponse.of(user));
    }

    public TokenResponse refresh(String refreshToken) {
        if (!jwt.validate(refreshToken)) throw new IllegalArgumentException("invalid refresh");
        var userId = jwt.extractUserId(refreshToken);
        var user = userRepo.findById(userId).orElseThrow();
        String access = jwt.generateAccessToken(user.getId(), user.getRole());
        return new TokenResponse(access, refreshToken, jwt.getAccessTtlSec(), UserInfoResponse.of(user));
    }
}
```

```java
// auth/AuthController.java
package com.axon.auth;

import com.axon.auth.dto.*;
import com.axon.user.*;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.Map;

@RestController @RequestMapping("/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @GetMapping("/login")
    public void login(@RequestParam(defaultValue = "init") String state, HttpServletResponse res) throws IOException {
        res.sendRedirect(authService.authorizeUrl(state));
    }

    @GetMapping("/callback")
    public TokenResponse callback(@RequestParam String code) { return authService.handleCallback(code); }

    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody Map<String, String> body) { return authService.refresh(body.get("refresh_token")); }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() { return ResponseEntity.noContent().build(); }

    @GetMapping("/me")
    public UserInfoResponse me(@AuthenticationPrincipal User user) { return UserInfoResponse.of(user); }
}
```

- [ ] **Step 6: JWT filter + SecurityConfig**

```java
// auth/jwt/JwtAuthFilter.java
package com.axon.auth.jwt;

import com.axon.user.*;
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

@Component @RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserRepository userRepo;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwt.validate(token)) {
                var userId = jwt.extractUserId(token);
                userRepo.findById(userId).ifPresent(user -> {
                    var auth = new UsernamePasswordAuthenticationToken(
                        user, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }
        chain.doFilter(req, res);
    }
}
```

```java
// config/SecurityConfig.java
package com.axon.config;

import com.axon.auth.jwt.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration @EnableMethodSecurity @RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtFilter;

    @Bean SecurityFilterChain chain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())
            .cors(c -> c.configurationSource(corsSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/auth/**", "/actuator/health").permitAll()
                .requestMatchers("GET", "/api/v1/jobs", "/api/v1/ai-capabilities",
                                 "/api/v1/work-categories", "/api/v1/works",
                                 "/api/v1/departments", "/api/v1/ai-tools").permitAll()
                .requestMatchers("GET", "/api/v1/best-practices", "/api/v1/best-practices/*").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private CorsConfigurationSource corsSource() {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:5173"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
```

- [ ] **Step 7: Global exception handling**

```java
// common/ApiError.java
package com.axon.common;
import java.time.Instant;
public record ApiError(String error, String message, Instant timestamp) {
    public static ApiError of(String error, String msg) { return new ApiError(error, msg, Instant.now()); }
}
```

```java
// common/exception/*.java (one file each, similar pattern)
package com.axon.common.exception;
public class NotFoundException        extends RuntimeException { public NotFoundException(String m){super(m);} }
public class ForbiddenException       extends RuntimeException { public ForbiddenException(String m){super(m);} }
public class InvalidStateException    extends RuntimeException { public InvalidStateException(String m){super(m);} }
public class ConflictException        extends RuntimeException { public ConflictException(String m){super(m);} }
public class BadRequestException      extends RuntimeException { public BadRequestException(String m){super(m);} }
```

```java
// common/GlobalExceptionHandler.java
package com.axon.common;

import com.axon.common.exception.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> notFound(NotFoundException e) {
        return ResponseEntity.status(404).body(ApiError.of("RESOURCE_NOT_FOUND", e.getMessage()));
    }
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> forbidden(ForbiddenException e) {
        return ResponseEntity.status(403).body(ApiError.of("FORBIDDEN", e.getMessage()));
    }
    @ExceptionHandler(InvalidStateException.class)
    public ResponseEntity<ApiError> invalidState(InvalidStateException e) {
        return ResponseEntity.status(422).body(ApiError.of("INVALID_STATE_TRANSITION", e.getMessage()));
    }
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> conflict(ConflictException e) {
        return ResponseEntity.status(409).body(ApiError.of("LOOKUP_IN_USE", e.getMessage()));
    }
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> badRequest(BadRequestException e) {
        return ResponseEntity.status(400).body(ApiError.of("VALIDATION_ERROR", e.getMessage()));
    }
}
```

- [ ] **Step 8: AuthService test**

```java
// src/test/java/com/axon/auth/AuthServiceTest.java
package com.axon.auth;

import com.axon.auth.jwt.JwtService;
import com.axon.auth.sso.*;
import com.axon.user.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest @ActiveProfiles("dev") @Testcontainers
class AuthServiceTest {
    @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void p(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",      pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);
    }

    @Autowired AuthService auth;
    @Autowired UserRepository userRepo;

    @Test void mockCallbackUpsertsUserAndIssuesTokens() {
        var resp = auth.handleCallback("mock-code");
        assertThat(resp.accessToken()).isNotBlank();
        assertThat(resp.refreshToken()).isNotBlank();
        assertThat(resp.user().email()).isEqualTo("dev@axon.local");
        assertThat(userRepo.findByCipId("DEV001")).isPresent();
    }
}
```

Run: `./mvnw test -Dtest=AuthServiceTest`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add axon-backend/src/main/java/com/axon/{auth,config,common,user/UserService.java} axon-backend/src/test/java/com/axon/auth/
git commit -m "feat: auth — Mock SSO + JWT + filter + global exception handling"
```

---

## Phase 2 — Lookup & Reference Data

### Task 5: Public Lookup APIs (6 lookups)

**Files (one folder per lookup):**
- Create: `lookup/job/{JobService.java, JobController.java, dto/JobItem.java}`
- Create: `lookup/aicapability/{AiCapabilityService.java, AiCapabilityController.java, dto/AiCapabilityItem.java}`
- Create: `lookup/workcategory/{WorkCategoryService.java, WorkCategoryController.java, dto/WorkCategoryItem.java}`
- Create: `lookup/work/{WorkService.java, WorkController.java, dto/WorkItem.java}`
- Create: `lookup/department/{DepartmentService.java, DepartmentController.java, dto/DepartmentItem.java}`
- Create: `lookup/aitool/{AiToolService.java, AiToolController.java, dto/AiToolItem.java}`
- Create: `src/test/java/com/axon/lookup/job/JobControllerIT.java`

- [ ] **Step 1: DTOs and Service — pattern with Job**

```java
// lookup/job/dto/JobItem.java
package com.axon.lookup.job.dto;
import com.axon.lookup.job.Job;
public record JobItem(String id, String name, int displayOrder, long bpCount) {
    public static JobItem of(Job j, long bpCount) {
        return new JobItem(j.getId().toString(), j.getName(), j.getDisplayOrder(), bpCount);
    }
}
```

```java
// lookup/job/JobService.java
package com.axon.lookup.job;

import com.axon.bestpractice.BestPracticeRepository;
import com.axon.common.exception.*;
import com.axon.lookup.job.dto.JobItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class JobService {
    private final JobRepository repo;
    private final BestPracticeRepository bpRepo;

    public List<JobItem> listPublic() {
        return repo.findAllByOrderByDisplayOrderAsc().stream()
            .map(j -> JobItem.of(j, 0)).toList();
    }

    public List<JobItem> listForAdmin() {
        var jobs = repo.findAllByOrderByDisplayOrderAsc();
        Map<UUID, Long> counts = bpRepo.countByJobIdGrouped();  // see Step 5
        return jobs.stream().map(j -> JobItem.of(j, counts.getOrDefault(j.getId(), 0L))).toList();
    }

    @Transactional
    public Job create(String name, int displayOrder) {
        if (repo.existsByName(name)) throw new BadRequestException("Job name already exists");
        return repo.save(Job.builder().name(name).displayOrder(displayOrder).build());
    }

    @Transactional
    public Job update(UUID id, String name, int displayOrder) {
        Job j = repo.findById(id).orElseThrow(() -> new NotFoundException("Job not found"));
        j.setName(name); j.setDisplayOrder(displayOrder);
        return j;
    }

    @Transactional
    public void delete(UUID id) {
        long inUse = bpRepo.countByJobId(id);
        if (inUse > 0) throw new ConflictException("Job đang được dùng bởi " + inUse + " best practice(s)");
        repo.deleteById(id);
    }
}
```

Add to `BestPracticeRepository`:

```java
@Query("SELECT COUNT(b) FROM BestPractice b JOIN b.jobs j WHERE j.id = :jobId")
long countByJobId(@Param("jobId") UUID jobId);

@Query("SELECT j.id, COUNT(b) FROM BestPractice b JOIN b.jobs j GROUP BY j.id")
List<Object[]> countByJobIdGroupedRaw();

default Map<UUID, Long> countByJobIdGrouped() {
    return countByJobIdGroupedRaw().stream()
        .collect(Collectors.toMap(r -> (UUID) r[0], r -> (Long) r[1]));
}
```

(Add equivalent count queries for: `aiCapability`, `aiTool`, `work`, `workCategory` via Work, `department`.)

- [ ] **Step 2: Public controller — Job (pattern for all)**

```java
// lookup/job/JobController.java
package com.axon.lookup.job;

import com.axon.lookup.job.dto.JobItem;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/jobs") @RequiredArgsConstructor
public class JobController {
    private final JobService service;
    @GetMapping public List<JobItem> list() { return service.listPublic(); }
}
```

Create analogous controllers for the other 5 lookups (each at `/api/v1/<lookup-name>`).

- [ ] **Step 3: Work controller with workCategory filter**

```java
// lookup/work/WorkController.java
package com.axon.lookup.work;

import com.axon.lookup.work.dto.WorkItem;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/works") @RequiredArgsConstructor
public class WorkController {
    private final WorkService service;

    @GetMapping
    public List<WorkItem> list(@RequestParam(required = false) UUID workCategoryId) {
        return workCategoryId == null ? service.listAll() : service.listByCategory(workCategoryId);
    }
}
```

- [ ] **Step 4: Integration test**

```java
// src/test/java/com/axon/lookup/job/JobControllerIT.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class JobControllerIT {
    @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void p(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",      pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);
    }

    @Autowired TestRestTemplate http;

    @Test void returnsSeededJobs() {
        var resp = http.getForEntity("/api/v1/jobs", JobItem[].class);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).extracting(JobItem::name)
            .contains("Code Implementation", "Research", "Operation", "Report");
    }
}
```

Run: `./mvnw test -Dtest=JobControllerIT` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/lookup/ axon-backend/src/test/java/com/axon/lookup/
git commit -m "feat: public lookup APIs for 6 taxonomies + integration test"
```

---

### Task 6: Admin Lookup CRUD (with in-use guard)

**Files:**
- Create: `lookup/job/AdminJobController.java`
- Create: same admin controller per lookup folder
- Create: `lookup/common/AdminAuth.java` (helper or `@PreAuthorize` directly)
- Create: `src/test/java/com/axon/lookup/job/AdminJobControllerIT.java`

- [ ] **Step 1: Write failing test**

```java
// src/test/java/com/axon/lookup/job/AdminJobControllerIT.java
@SpringBootTest(webEnvironment=RANDOM_PORT) @Testcontainers
class AdminJobControllerIT {
    @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void p(DynamicPropertyRegistry r) { /* same */ }

    @Autowired TestRestTemplate http;
    @Autowired JwtService jwt; @Autowired UserRepository userRepo;

    String adminBearer() {
        var admin = userRepo.save(User.builder().email("a@a").name("A").role(UserRole.ADMIN).build());
        return "Bearer " + jwt.generateAccessToken(admin.getId(), UserRole.ADMIN);
    }

    @Test void adminCanCreateJob() {
        var headers = new HttpHeaders(); headers.set("Authorization", adminBearer());
        var body = Map.of("name", "New Job", "display_order", 99);
        var req = new HttpEntity<>(body, headers);
        var resp = http.exchange("/api/v1/admin/jobs", HttpMethod.POST, req, JobItem.class);
        assertThat(resp.getStatusCode().value()).isEqualTo(201);
        assertThat(resp.getBody().name()).isEqualTo("New Job");
    }

    @Test void deleteBlockedIfInUse() {
        // ... seed a BP referencing a job, attempt delete, expect 409 LOOKUP_IN_USE
    }
}
```

Run: FAIL — controller not implemented.

- [ ] **Step 2: Admin controller — Job (pattern)**

```java
// lookup/job/AdminJobController.java
package com.axon.lookup.job;

import com.axon.lookup.job.dto.JobItem;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/api/v1/admin/jobs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminJobController {
    private final JobService service;

    @GetMapping public List<JobItem> list() { return service.listForAdmin(); }

    @PostMapping
    public ResponseEntity<JobItem> create(@RequestBody @Valid CreateRequest req) {
        var j = service.create(req.name(), req.displayOrder());
        return ResponseEntity.status(201).body(JobItem.of(j, 0));
    }

    @PutMapping("/{id}")
    public JobItem update(@PathVariable UUID id, @RequestBody @Valid UpdateRequest req) {
        var j = service.update(id, req.name(), req.displayOrder());
        return JobItem.of(j, 0);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateRequest(@NotBlank String name, int displayOrder) {}
    public record UpdateRequest(@NotBlank String name, int displayOrder) {}
}
```

Create analogous `Admin*Controller` for the other 5 lookups. For **WorkCategory** the delete check is "any Works belong to this category"; for **Work** and **Department** the check is "any BPs reference this". Departments additionally must check "no users reference it".

- [ ] **Step 3: AdminWorkController with workCategoryId**

```java
// lookup/work/AdminWorkController.java
@RestController @RequestMapping("/api/v1/admin/works")
@PreAuthorize("hasRole('ADMIN')") @RequiredArgsConstructor
public class AdminWorkController {
    private final WorkService service;

    @PostMapping
    public ResponseEntity<WorkItem> create(@RequestBody @Valid CreateRequest req) {
        return ResponseEntity.status(201).body(WorkItem.of(service.create(req.name(), req.workCategoryId())));
    }
    @PutMapping("/{id}")
    public WorkItem update(@PathVariable UUID id, @RequestBody @Valid UpdateRequest req) {
        return WorkItem.of(service.update(id, req.name(), req.workCategoryId()));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) { service.delete(id); return ResponseEntity.noContent().build(); }

    public record CreateRequest(@NotBlank String name, @NotNull UUID workCategoryId) {}
    public record UpdateRequest(@NotBlank String name, @NotNull UUID workCategoryId) {}
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
./mvnw test -Dtest=AdminJobControllerIT
# Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/lookup/ axon-backend/src/test/java/com/axon/lookup/
git commit -m "feat: admin lookup CRUD for 6 taxonomies — with in-use guard"
```

---

## Phase 3 — Best Practice Core

### Task 7: BP DTOs + Query Specifications

**Files:**
- Create: `bestpractice/dto/{BestPracticeRequest.java, BestPracticeResponse.java, BestPracticeListItem.java, BestPracticeFilterRequest.java, CreatorRef.java, LookupRef.java, WorkRef.java}`
- Create: `bestpractice/BestPracticeSpecs.java` (Specification builder for filter + search)
- Create: `bestpractice/BestPracticeMapper.java` (DTO mapper with key masking)
- Create: `src/test/java/com/axon/bestpractice/BestPracticeSpecsTest.java`

- [ ] **Step 1: DTOs**

```java
// bestpractice/dto/LookupRef.java
package com.axon.bestpractice.dto;
public record LookupRef(String id, String name) {}
```

```java
// bestpractice/dto/CreatorRef.java
package com.axon.bestpractice.dto;
public record CreatorRef(String id, String name, String avatarUrl) {}
```

```java
// bestpractice/dto/WorkRef.java
package com.axon.bestpractice.dto;
public record WorkRef(String id, String name, LookupRef workCategory) {}
```

```java
// bestpractice/dto/BestPracticeRequest.java
package com.axon.bestpractice.dto;

import com.axon.bestpractice.BestPracticeType;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public record BestPracticeRequest(
    @NotBlank @Size(max=200) String name,
    String description,
    @Size(max=500) String thumbnailUrl,
    String installationGuide,
    @NotNull BestPracticeType type,
    @Size(max=256) String webContent,
    String keyValue,
    UUID workId,
    @NotEmpty List<UUID> jobIds,
    @NotEmpty List<UUID> aiCapabilityIds,
    List<UUID> aiToolIds,
    List<UUID> departmentIds,
    @NotEmpty List<UUID> creatorIds
) {}
```

```java
// bestpractice/dto/BestPracticeFilterRequest.java
package com.axon.bestpractice.dto;
import java.util.UUID;
public record BestPracticeFilterRequest(
    String search,
    UUID jobId, UUID aiCapabilityId, UUID workCategoryId, UUID workId,
    UUID departmentId, String type, UUID aiToolId,
    String sortBy, String sortDir, Integer page, Integer size
) {}
```

```java
// bestpractice/dto/BestPracticeListItem.java
package com.axon.bestpractice.dto;
import java.time.Instant;
import java.util.List;
public record BestPracticeListItem(
    String id, String name, String description, String thumbnailUrl,
    String type, String status,
    List<LookupRef> job, WorkRef work,
    List<CreatorRef> creators,
    int likeCount, int viewCount, int downloadCount,
    boolean isLikedByCurrentUser,
    Instant publishedAt
) {}
```

```java
// bestpractice/dto/BestPracticeResponse.java
package com.axon.bestpractice.dto;
import java.time.Instant;
import java.util.List;
public record BestPracticeResponse(
    String id, String name, String description, String thumbnailUrl,
    String type, String status,
    String installationGuide, String webContent, String keyValue,
    List<LookupRef> job, List<LookupRef> aiCapability, List<LookupRef> aiTool,
    WorkRef work, List<LookupRef> departments,
    List<CreatorRef> creators, List<FileRef> files,
    int likeCount, int viewCount, int downloadCount,
    boolean isLikedByCurrentUser,
    Instant createdAt, Instant publishedAt
) {
    public record FileRef(String id, String fileName, long fileSize, String mimeType, Instant uploadedAt) {}
}
```

- [ ] **Step 2: BestPracticeMapper with key masking**

```java
// bestpractice/BestPracticeMapper.java
package com.axon.bestpractice;

import com.axon.bestpractice.dto.*;
import com.axon.file.BpFile;
import com.axon.interaction.BpLikeRepository;
import com.axon.lookup.aicapability.AiCapability;
import com.axon.lookup.aitool.AiTool;
import com.axon.lookup.department.Department;
import com.axon.lookup.job.Job;
import com.axon.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.*;

@Component @RequiredArgsConstructor
public class BestPracticeMapper {
    private final BpLikeRepository likeRepo;

    public BestPracticeListItem toListItem(BestPractice b, User currentUser) {
        return new BestPracticeListItem(
            b.getId().toString(), b.getName(), truncate(b.getDescription(), 200),
            b.getThumbnailUrl(), b.getType().name(), b.getStatus().name(),
            b.getJobs().stream().map(this::jobRef).toList(),
            b.getWork() != null ? new WorkRef(
                b.getWork().getId().toString(), b.getWork().getName(),
                new LookupRef(b.getWork().getWorkCategory().getId().toString(),
                              b.getWork().getWorkCategory().getName())) : null,
            b.getCreators().stream().map(this::creatorRef).toList(),
            b.getLikeCount(), b.getViewCount(), b.getDownloadCount(),
            currentUser != null && likeRepo.existsByBpIdAndUserId(b.getId(), currentUser.getId()),
            b.getPublishedAt()
        );
    }

    public BestPracticeResponse toResponse(BestPractice b, List<BpFile> files, User currentUser) {
        boolean canSeeKey = currentUser != null && (
            currentUser.getRole() == UserRole.ADMIN
         || currentUser.getRole() == UserRole.AX_SUPPORTER
         || b.getCreators().stream().anyMatch(c -> c.getId().equals(currentUser.getId())));

        return new BestPracticeResponse(
            b.getId().toString(), b.getName(), b.getDescription(), b.getThumbnailUrl(),
            b.getType().name(), b.getStatus().name(),
            b.getInstallationGuide(), b.getWebContent(),
            canSeeKey ? b.getKeyValue() : null,
            b.getJobs().stream().map(this::jobRef).toList(),
            b.getAiCapabilities().stream().map(this::aiCapRef).toList(),
            b.getAiTools().stream().map(this::aiToolRef).toList(),
            b.getWork() != null ? new WorkRef(
                b.getWork().getId().toString(), b.getWork().getName(),
                new LookupRef(b.getWork().getWorkCategory().getId().toString(),
                              b.getWork().getWorkCategory().getName())) : null,
            b.getDepartments().stream().map(this::deptRef).toList(),
            b.getCreators().stream().map(this::creatorRef).toList(),
            files.stream().map(f -> new BestPracticeResponse.FileRef(
                f.getId().toString(), f.getFileName(), f.getFileSize(),
                f.getMimeType(), f.getUploadedAt())).toList(),
            b.getLikeCount(), b.getViewCount(), b.getDownloadCount(),
            currentUser != null && likeRepo.existsByBpIdAndUserId(b.getId(), currentUser.getId()),
            b.getCreatedAt(), b.getPublishedAt()
        );
    }

    private LookupRef jobRef(Job j)              { return new LookupRef(j.getId().toString(), j.getName()); }
    private LookupRef aiCapRef(AiCapability a)   { return new LookupRef(a.getId().toString(), a.getName()); }
    private LookupRef aiToolRef(AiTool t)        { return new LookupRef(t.getId().toString(), t.getName()); }
    private LookupRef deptRef(Department d)      { return new LookupRef(d.getId().toString(), d.getName()); }
    private CreatorRef creatorRef(User u)        { return new CreatorRef(u.getId().toString(), u.getName(), u.getAvatarUrl()); }
    private String truncate(String s, int n)     { return s == null ? null : (s.length() <= n ? s : s.substring(0, n) + "…"); }
}
```

- [ ] **Step 3: BestPracticeSpecs — JPA Specifications**

```java
// bestpractice/BestPracticeSpecs.java
package com.axon.bestpractice;

import com.axon.bestpractice.dto.BestPracticeFilterRequest;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import java.util.UUID;

public class BestPracticeSpecs {

    public static Specification<BestPractice> publishedOnly() {
        return (root, q, cb) -> cb.equal(root.get("status"), BestPracticeStatus.PUBLISHED);
    }

    public static Specification<BestPractice> ofCreator(UUID userId) {
        return (root, q, cb) -> {
            Join<Object, Object> creators = root.join("creators", JoinType.INNER);
            q.distinct(true);
            return cb.equal(creators.get("id"), userId);
        };
    }

    public static Specification<BestPractice> withFilter(BestPracticeFilterRequest f) {
        return (root, q, cb) -> {
            var p = cb.conjunction();
            if (f.search() != null && !f.search().isBlank()) {
                String like = "%" + f.search().toLowerCase() + "%";
                p = cb.and(p, cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("description")), like)));
            }
            if (f.jobId() != null)
                p = cb.and(p, cb.equal(root.join("jobs").get("id"), f.jobId()));
            if (f.aiCapabilityId() != null)
                p = cb.and(p, cb.equal(root.join("aiCapabilities").get("id"), f.aiCapabilityId()));
            if (f.aiToolId() != null)
                p = cb.and(p, cb.equal(root.join("aiTools").get("id"), f.aiToolId()));
            if (f.departmentId() != null)
                p = cb.and(p, cb.equal(root.join("departments").get("id"), f.departmentId()));
            if (f.workId() != null)
                p = cb.and(p, cb.equal(root.get("work").get("id"), f.workId()));
            if (f.workCategoryId() != null)
                p = cb.and(p, cb.equal(root.get("work").get("workCategory").get("id"), f.workCategoryId()));
            if (f.type() != null)
                p = cb.and(p, cb.equal(root.get("type"), BestPracticeType.valueOf(f.type())));
            q.distinct(true);
            return p;
        };
    }
}
```

- [ ] **Step 4: Specs test**

```java
// src/test/java/com/axon/bestpractice/BestPracticeSpecsTest.java
@SpringBootTest @Testcontainers
class BestPracticeSpecsTest {
    @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void p(DynamicPropertyRegistry r) { /* same */ }

    @Autowired BestPracticeRepository repo;
    @Autowired UserRepository userRepo;
    @Autowired JobRepository jobRepo;

    @Test void filterByJobReturnsOnlyMatching() {
        var u = userRepo.save(User.builder().email("c@x").name("C").role(UserRole.AX_CREATOR).build());
        var jobs = jobRepo.findAll();
        var bp1 = saveBp(u, "BP1", BestPracticeStatus.PUBLISHED, jobs.get(0));
        var bp2 = saveBp(u, "BP2", BestPracticeStatus.PUBLISHED, jobs.get(1));

        var f = new BestPracticeFilterRequest(null, jobs.get(0).getId(), null, null, null, null, null, null,
                                              null, null, 0, 20);
        var spec = BestPracticeSpecs.publishedOnly().and(BestPracticeSpecs.withFilter(f));
        var results = repo.findAll(spec);
        assertThat(results).extracting(BestPractice::getName).containsExactly("BP1");
    }
}
```

Run, expect PASS.

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/bestpractice/ axon-backend/src/test/java/com/axon/bestpractice/BestPracticeSpecsTest.java
git commit -m "feat: BP DTOs + JPA Specifications + mapper with key masking"
```

---

### Task 8: BP Create + Edit + Delete

**Files:**
- Create: `bestpractice/BestPracticeService.java`
- Create: `bestpractice/BestPracticeController.java` (POST/PUT/DELETE only)
- Create: `bestpractice/MyBestPracticeController.java` (GET /my-best-practices)
- Create: `src/test/java/com/axon/bestpractice/BestPracticeServiceTest.java`

- [ ] **Step 1: Write failing service test**

```java
// src/test/java/com/axon/bestpractice/BestPracticeServiceTest.java
@SpringBootTest @ActiveProfiles("dev") @Testcontainers
class BestPracticeServiceTest {
    /* container boilerplate same as above */

    @Autowired BestPracticeService svc;
    @Autowired UserRepository userRepo;
    @Autowired JobRepository jobRepo;
    @Autowired AiCapabilityRepository capRepo;

    @Test void createAsCreatorYieldsRequestedStatus() {
        var creator = userRepo.save(User.builder()
            .email("a@x").name("A").role(UserRole.AX_CREATOR).build());

        var req = new BestPracticeRequest(
            "My BP", "Desc", null, "Guide", BestPracticeType.WEB,
            "https://wiki/x", "secret-key", null,
            List.of(jobRepo.findAll().get(0).getId()),
            List.of(capRepo.findAll().get(0).getId()),
            List.of(), List.of(),
            List.of(creator.getId()));

        var resp = svc.create(req, creator);

        assertThat(resp.status()).isEqualTo("REQUESTED");
        assertThat(resp.creators()).hasSize(1);
    }

    @Test void cannotDeletePublishedBp() {
        // create BP, simulate PUBLISHED, attempt delete, expect InvalidStateException
    }

    @Test void editPublishedHidesAndRevertsToRequested() {
        // create BP as PUBLISHED, run edit, expect status=REQUESTED, publishedAt=null
    }
}
```

Run, expect FAIL (service not implemented).

- [ ] **Step 2: Implement BestPracticeService — create + edit + delete**

```java
// bestpractice/BestPracticeService.java
package com.axon.bestpractice;

import com.axon.bestpractice.dto.*;
import com.axon.common.exception.*;
import com.axon.file.BpFileRepository;
import com.axon.lookup.aicapability.AiCapabilityRepository;
import com.axon.lookup.aitool.AiToolRepository;
import com.axon.lookup.department.DepartmentRepository;
import com.axon.lookup.job.JobRepository;
import com.axon.lookup.work.WorkRepository;
import com.axon.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class BestPracticeService {
    private final BestPracticeRepository repo;
    private final UserRepository userRepo;
    private final JobRepository jobRepo;
    private final AiCapabilityRepository capRepo;
    private final AiToolRepository toolRepo;
    private final DepartmentRepository deptRepo;
    private final WorkRepository workRepo;
    private final BpFileRepository fileRepo;
    private final BestPracticeMapper mapper;

    @Transactional
    public BestPracticeResponse create(BestPracticeRequest req, User currentUser) {
        validateTypeContent(req);
        if (!req.creatorIds().contains(currentUser.getId()))
            throw new BadRequestException("Current user must be in creator_ids");

        var bp = BestPractice.builder()
            .name(req.name()).description(req.description())
            .thumbnailUrl(req.thumbnailUrl()).installationGuide(req.installationGuide())
            .type(req.type()).webContent(req.webContent()).keyValue(req.keyValue())
            .status(BestPracticeStatus.REQUESTED)
            .build();

        if (req.workId() != null) bp.setWork(workRepo.findById(req.workId()).orElseThrow());
        bp.getCreators().addAll(userRepo.findAllById(req.creatorIds()));
        bp.getJobs().addAll(jobRepo.findAllById(req.jobIds()));
        bp.getAiCapabilities().addAll(capRepo.findAllById(req.aiCapabilityIds()));
        if (req.aiToolIds() != null)    bp.getAiTools().addAll(toolRepo.findAllById(req.aiToolIds()));
        if (req.departmentIds() != null) bp.getDepartments().addAll(deptRepo.findAllById(req.departmentIds()));

        if (currentUser.getRole() == UserRole.USER) {
            userRepo.findById(currentUser.getId()).ifPresent(u -> { u.setRole(UserRole.AX_CREATOR); });
        }

        bp = repo.save(bp);
        return mapper.toResponse(bp, fileRepo.findAllByBpId(bp.getId()), currentUser);
    }

    @Transactional
    public BestPracticeResponse update(UUID id, BestPracticeRequest req, User currentUser) {
        var bp = repo.findById(id).orElseThrow(() -> new NotFoundException("BP not found"));
        ensureOwner(bp, currentUser);
        if (bp.getStatus() == BestPracticeStatus.CLOSED)
            throw new InvalidStateException("Cannot edit CLOSED BP");
        if (bp.getStatus() == BestPracticeStatus.PUBLISHED) {
            bp.setStatus(BestPracticeStatus.REQUESTED);
            bp.setPublishedAt(null);
        }
        validateTypeContent(req);
        bp.setName(req.name());
        bp.setDescription(req.description());
        bp.setThumbnailUrl(req.thumbnailUrl());
        bp.setInstallationGuide(req.installationGuide());
        bp.setType(req.type());
        bp.setWebContent(req.webContent());
        bp.setKeyValue(req.keyValue());
        bp.setWork(req.workId() != null ? workRepo.findById(req.workId()).orElseThrow() : null);
        bp.getJobs().clear();           bp.getJobs().addAll(jobRepo.findAllById(req.jobIds()));
        bp.getAiCapabilities().clear(); bp.getAiCapabilities().addAll(capRepo.findAllById(req.aiCapabilityIds()));
        bp.getAiTools().clear();
        if (req.aiToolIds() != null)    bp.getAiTools().addAll(toolRepo.findAllById(req.aiToolIds()));
        bp.getDepartments().clear();
        if (req.departmentIds() != null) bp.getDepartments().addAll(deptRepo.findAllById(req.departmentIds()));
        return mapper.toResponse(bp, fileRepo.findAllByBpId(bp.getId()), currentUser);
    }

    @Transactional
    public void delete(UUID id, User currentUser) {
        var bp = repo.findById(id).orElseThrow(() -> new NotFoundException("BP not found"));
        ensureOwner(bp, currentUser);
        if (bp.getStatus() == BestPracticeStatus.PUBLISHED || bp.getStatus() == BestPracticeStatus.CLOSED)
            throw new InvalidStateException("Cannot delete BP in status " + bp.getStatus());
        repo.delete(bp);
    }

    private void ensureOwner(BestPractice bp, User currentUser) {
        boolean owner = bp.getCreators().stream().anyMatch(c -> c.getId().equals(currentUser.getId()));
        if (!owner && currentUser.getRole() != UserRole.ADMIN)
            throw new ForbiddenException("Not an owner of this BP");
    }

    private void validateTypeContent(BestPracticeRequest req) {
        if (req.type() == BestPracticeType.WEB) {
            if (req.webContent() == null || req.webContent().isBlank())
                throw new BadRequestException("WEB type requires web_content");
            if (req.webContent().length() > 256)
                throw new BadRequestException("web_content exceeds 256 chars");
        }
    }
}
```

- [ ] **Step 3: Controller**

```java
// bestpractice/BestPracticeController.java (subset for create/edit/delete)
@RestController @RequestMapping("/api/v1/best-practices") @RequiredArgsConstructor
public class BestPracticeController {
    private final BestPracticeService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','AX_CREATOR','AX_SUPPORTER','ADMIN')")
    public ResponseEntity<BestPracticeResponse> create(
            @RequestBody @Valid BestPracticeRequest req,
            @AuthenticationPrincipal User u) {
        return ResponseEntity.status(201).body(service.create(req, u));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BestPracticeResponse update(@PathVariable UUID id,
                                       @RequestBody @Valid BestPracticeRequest req,
                                       @AuthenticationPrincipal User u) {
        return service.update(id, req, u);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User u) {
        service.delete(id, u);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Run tests**

```bash
./mvnw test -Dtest=BestPracticeServiceTest
# Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/bestpractice/ axon-backend/src/test/java/com/axon/bestpractice/BestPracticeServiceTest.java
git commit -m "feat: BP create/edit/delete with state-aware rules + auto-role-upgrade on first create"
```

---

### Task 9: BP Browse List — filter / sort / search / pagination

**Files:**
- Modify: `bestpractice/BestPracticeService.java`
- Modify: `bestpractice/BestPracticeController.java` (add GET endpoints)
- Create: `bestpractice/SortMapper.java`
- Create: `src/test/java/com/axon/bestpractice/BestPracticeBrowseIT.java`

- [ ] **Step 1: SortMapper for whitelisted sort keys**

```java
// bestpractice/SortMapper.java
package com.axon.bestpractice;

import org.springframework.data.domain.Sort;
import java.util.*;

public class SortMapper {
    private static final Map<String, String> ALLOWED = Map.of(
        "name", "name",
        "likeCount", "likeCount",
        "viewCount", "viewCount",
        "downloadCount", "downloadCount",
        "publishedAt", "publishedAt"
    );
    // jobName/workName/workCategoryName handled as in-memory secondary sort after page load

    public static Sort resolve(String sortBy, String sortDir) {
        String prop = ALLOWED.getOrDefault(sortBy == null ? "publishedAt" : sortBy, "publishedAt");
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, prop);
    }
}
```

- [ ] **Step 2: Browse method on service**

Append to `BestPracticeService`:

```java
public PagedResponse<BestPracticeListItem> browse(BestPracticeFilterRequest f, User currentUser) {
    int page = f.page() == null ? 0 : f.page();
    int size = f.size() == null ? 20 : Math.min(f.size(), 50);
    var pageable = PageRequest.of(page, size, SortMapper.resolve(f.sortBy(), f.sortDir()));
    var spec = BestPracticeSpecs.publishedOnly().and(BestPracticeSpecs.withFilter(f));
    Page<BestPractice> result = repo.findAll(spec, pageable);
    var content = result.getContent().stream().map(b -> mapper.toListItem(b, currentUser)).toList();
    if (isAlphabeticalRelation(f.sortBy())) {
        content = sortAlphabetically(content, f.sortBy(), f.sortDir());
    }
    return new PagedResponse<>(content, result.getTotalElements(), result.getTotalPages(), page);
}

private boolean isAlphabeticalRelation(String key) {
    return "jobName".equals(key) || "workName".equals(key) || "workCategoryName".equals(key);
}

private List<BestPracticeListItem> sortAlphabetically(List<BestPracticeListItem> items, String key, String dir) {
    Comparator<BestPracticeListItem> cmp = switch (key) {
        case "jobName" -> Comparator.comparing(i -> i.job().isEmpty() ? "" : i.job().get(0).name());
        case "workName" -> Comparator.comparing(i -> i.work() == null ? "" : i.work().name());
        case "workCategoryName" -> Comparator.comparing(i ->
            i.work() == null || i.work().workCategory() == null ? "" : i.work().workCategory().name());
        default -> Comparator.comparing(BestPracticeListItem::name);
    };
    if ("desc".equalsIgnoreCase(dir)) cmp = cmp.reversed();
    return items.stream().sorted(cmp).toList();
}
```

Add `PagedResponse`:

```java
// common/PagedResponse.java
package com.axon.common;
import java.util.List;
public record PagedResponse<T>(List<T> content, long totalElements, int totalPages, int page) {}
```

- [ ] **Step 3: Controller endpoints**

Append to `BestPracticeController`:

```java
@GetMapping
public PagedResponse<BestPracticeListItem> browse(
        BestPracticeFilterRequest filter,
        @AuthenticationPrincipal(errorOnInvalidType=false) User currentUser) {
    return service.browse(filter, currentUser);
}
```

- [ ] **Step 4: Integration test**

```java
// src/test/java/com/axon/bestpractice/BestPracticeBrowseIT.java
@Test void filterByJobAndPaginate() {
    // seed 25 published BPs distributed across 2 jobs
    var resp = http.getForEntity(
        "/api/v1/best-practices?jobId=" + jobId + "&page=0&size=10", PagedResponse.class);
    assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
    // assert page 0 has 10 items, totalElements matches seeded count
}
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/{bestpractice,common} axon-backend/src/test/java/com/axon/bestpractice/BestPracticeBrowseIT.java
git commit -m "feat: BP browse — filter/sort/search/pagination + alphabetical sort for relations"
```

---

### Task 10: BP Detail + View Count + My BPs

**Files:**
- Modify: `bestpractice/BestPracticeService.java`
- Modify: `bestpractice/BestPracticeController.java` (GET /:id)
- Create: `bestpractice/MyBestPracticeController.java`

- [ ] **Step 1: Service methods**

```java
@Transactional
public BestPracticeResponse detail(UUID id, User currentUser) {
    var bp = repo.findById(id).orElseThrow(() -> new NotFoundException("BP not found"));
    boolean canSee = bp.getStatus() == BestPracticeStatus.PUBLISHED
        || (currentUser != null && (
              currentUser.getRole() == UserRole.AX_SUPPORTER
           || currentUser.getRole() == UserRole.ADMIN
           || bp.getCreators().stream().anyMatch(c -> c.getId().equals(currentUser.getId()))));
    if (!canSee) throw new NotFoundException("BP not found");
    repo.incrementViewCount(id);
    return mapper.toResponse(bp, fileRepo.findAllByBpId(id), currentUser);
}

public PagedResponse<BestPracticeListItem> myBps(String search, String status, int page, int size, User currentUser) {
    var spec = BestPracticeSpecs.ofCreator(currentUser.getId());
    if (status != null) {
        var s = BestPracticeStatus.valueOf(status);
        spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), s));
    }
    if (search != null && !search.isBlank()) {
        String like = "%" + search.toLowerCase() + "%";
        spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("name")), like));
    }
    var pageable = PageRequest.of(page, Math.min(size, 50),
        Sort.by(Sort.Direction.DESC, "updatedAt"));
    var result = repo.findAll(spec, pageable);
    return new PagedResponse<>(
        result.getContent().stream().map(b -> mapper.toListItem(b, currentUser)).toList(),
        result.getTotalElements(), result.getTotalPages(), page);
}
```

- [ ] **Step 2: Detail endpoint + My BPs controller**

```java
// BestPracticeController.java append:
@GetMapping("/{id}")
public BestPracticeResponse detail(@PathVariable UUID id,
                                   @AuthenticationPrincipal(errorOnInvalidType=false) User u) {
    return service.detail(id, u);
}
```

```java
// bestpractice/MyBestPracticeController.java
@RestController @RequestMapping("/api/v1/my-best-practices") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AX_CREATOR','AX_SUPPORTER','ADMIN')")
public class MyBestPracticeController {
    private final BestPracticeService service;

    @GetMapping
    public PagedResponse<BestPracticeListItem> myList(
            @RequestParam(required=false) String search,
            @RequestParam(required=false) String status,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size,
            @AuthenticationPrincipal User u) {
        return service.myBps(search, status, page, size, u);
    }
}
```

- [ ] **Step 3: Test detail increments view + key masking**

Append to `BestPracticeServiceTest`:

```java
@Test void detailIncrementsView_keyMaskedForUser() {
    var creator = userRepo.save(User.builder().email("c@x").name("C").role(UserRole.AX_CREATOR).build());
    var user    = userRepo.save(User.builder().email("u@x").name("U").role(UserRole.USER).build());
    var bp = createPublishedBp(creator, "secret");

    var resp = svc.detail(bp.getId(), user);
    assertThat(resp.keyValue()).isNull();
    assertThat(svc.detail(bp.getId(), user).viewCount()).isEqualTo(2);

    var resp2 = svc.detail(bp.getId(), creator);
    assertThat(resp2.keyValue()).isEqualTo("secret");
}
```

Run, expect PASS.

- [ ] **Step 4: Commit**

```bash
git add axon-backend/src/main/java/com/axon/bestpractice/ axon-backend/src/test/java/com/axon/bestpractice/
git commit -m "feat: BP detail with view++/key masking + My BPs listing"
```

---

### Task 11: File Upload + Download (MinIO + Presigned URL)

**Files:**
- Create: `config/MinioConfig.java`
- Create: `file/{FileService.java, FileController.java, dto/FileResponse.java}`
- Modify: `bestpractice/BestPracticeService.java` (download endpoint helper)
- Create: `src/test/java/com/axon/file/FileServiceTest.java` (skip MinIO container; mock client)

- [ ] **Step 1: MinioConfig**

```java
// config/MinioConfig.java
@Configuration
public class MinioConfig {
    @Value("${minio.endpoint}")   private String endpoint;
    @Value("${minio.access-key}") private String accessKey;
    @Value("${minio.secret-key}") private String secretKey;
    @Value("${minio.bucket}")     private String bucket;

    @Bean MinioClient minioClient() {
        return MinioClient.builder().endpoint(endpoint)
            .credentials(accessKey, secretKey).build();
    }
    @Bean(name="bucketName") String bucketName() { return bucket; }
}
```

- [ ] **Step 2: FileService**

```java
// file/FileService.java
@Service @RequiredArgsConstructor
public class FileService {
    private final MinioClient minio;
    private final BpFileRepository repo;
    private final BestPracticeRepository bpRepo;
    private final BpDownloadRepository downloadRepo;
    @Value("${minio.bucket}") private String bucket;

    @Transactional
    public BpFile upload(UUID bpId, MultipartFile file) throws Exception {
        var bp = bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        if (bp.getType() == BestPracticeType.WEB)
            throw new BadRequestException("WEB type does not support file upload");
        if (file.getSize() > 50L * 1024 * 1024)
            throw new BadRequestException("File exceeds 50MB");

        String fileId = UUID.randomUUID().toString();
        String key = bpId + "/" + fileId + "/" + file.getOriginalFilename();
        minio.putObject(PutObjectArgs.builder()
            .bucket(bucket).object(key)
            .stream(file.getInputStream(), file.getSize(), -1)
            .contentType(file.getContentType()).build());

        return repo.save(BpFile.builder()
            .bpId(bpId).fileName(file.getOriginalFilename())
            .fileSize(file.getSize()).mimeType(file.getContentType())
            .storageKey(key).build());
    }

    @Transactional
    public String generateDownloadUrl(UUID bpId, UUID fileId, UUID userId) throws Exception {
        var bp = bpRepo.findById(bpId).orElseThrow();
        if (bp.getStatus() != BestPracticeStatus.PUBLISHED
                && bp.getCreators().stream().noneMatch(c -> c.getId().equals(userId)))
            throw new ForbiddenException("BP not accessible");
        var f = repo.findById(fileId).orElseThrow(() -> new NotFoundException("File not found"));
        if (!f.getBpId().equals(bpId)) throw new NotFoundException("File mismatch");

        bpRepo.incrementDownloadCount(bpId);
        downloadRepo.save(BpDownload.builder().bpId(bpId).userId(userId).build());

        return minio.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
            .bucket(bucket).object(f.getStorageKey())
            .method(Method.GET).expiry(15, TimeUnit.MINUTES).build());
    }
}
```

- [ ] **Step 3: FileController**

```java
// file/FileController.java
@RestController @RequiredArgsConstructor @RequestMapping("/api/v1/best-practices/{bpId}")
public class FileController {
    private final FileService service;

    @PostMapping(value="/files", consumes="multipart/form-data")
    @PreAuthorize("hasAnyRole('AX_CREATOR','AX_SUPPORTER','ADMIN')")
    public ResponseEntity<FileResponse> upload(@PathVariable UUID bpId, @RequestPart MultipartFile file) throws Exception {
        var saved = service.upload(bpId, file);
        return ResponseEntity.status(201).body(FileResponse.of(saved));
    }

    @GetMapping("/files/{fileId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> download(@PathVariable UUID bpId, @PathVariable UUID fileId,
                                         @AuthenticationPrincipal User user) throws Exception {
        String url = service.generateDownloadUrl(bpId, fileId, user.getId());
        return ResponseEntity.status(302).location(URI.create(url)).build();
    }
}
```

- [ ] **Step 4: Manual smoke check**

```bash
# upload
TOKEN=$(curl -s "http://localhost:8080/auth/callback?code=mock-code" | jq -r .accessToken)
curl -X POST "http://localhost:8080/api/v1/best-practices/<bpId>/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F file=@./sample.zip
# Expected 201 + JSON

# download (browser to follow 302)
curl -I "http://localhost:8080/api/v1/best-practices/<bpId>/files/<fileId>/download" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 302 Location: http://localhost:9000/axon-files/...
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/{file,config/MinioConfig.java}
git commit -m "feat: file upload to MinIO + presigned URL download with audit"
```

---

## Phase 4 — Workflow & Management

### Task 12: Submit/Resubmit State Transitions

**Files:**
- Modify: `bestpractice/BestPracticeService.java` (add `submit`)
- Modify: `bestpractice/BestPracticeController.java` (POST /:id/submit)
- Modify: `src/test/java/com/axon/bestpractice/BestPracticeServiceTest.java`

- [ ] **Step 1: Write failing tests for submit**

Append to `BestPracticeServiceTest`:

```java
@Test void submitFromRejectedGoesToRequested() {
    var owner = userRepo.save(User.builder().email("o@x").name("O").role(UserRole.AX_CREATOR).build());
    var bp = saveBpAs(owner, BestPracticeStatus.REJECTED);
    var resp = svc.submit(bp.getId(), owner);
    assertThat(resp.status()).isEqualTo("REQUESTED");
}

@Test void submitFromPublishedHidesAndReverts() {
    var owner = userRepo.save(User.builder().email("o@x").name("O").role(UserRole.AX_CREATOR).build());
    var bp = saveBpAs(owner, BestPracticeStatus.PUBLISHED);
    var resp = svc.submit(bp.getId(), owner);
    assertThat(resp.status()).isEqualTo("REQUESTED");
    assertThat(resp.publishedAt()).isNull();
}

@Test void submitClosedThrows() {
    var owner = userRepo.save(User.builder().email("o@x").name("O").role(UserRole.AX_CREATOR).build());
    var bp = saveBpAs(owner, BestPracticeStatus.CLOSED);
    assertThatThrownBy(() -> svc.submit(bp.getId(), owner))
        .isInstanceOf(InvalidStateException.class);
}
```

Run, expect FAIL.

- [ ] **Step 2: Implement submit()**

```java
@Transactional
public BestPracticeResponse submit(UUID id, User currentUser) {
    var bp = repo.findById(id).orElseThrow(() -> new NotFoundException("BP not found"));
    ensureOwner(bp, currentUser);
    if (bp.getStatus() == BestPracticeStatus.CLOSED)
        throw new InvalidStateException("Cannot resubmit CLOSED BP");
    if (bp.getStatus() == BestPracticeStatus.PUBLISHED)
        bp.setPublishedAt(null);
    bp.setStatus(BestPracticeStatus.REQUESTED);
    return mapper.toResponse(bp, fileRepo.findAllByBpId(id), currentUser);
}
```

- [ ] **Step 3: Controller endpoint**

```java
@PostMapping("/{id}/submit")
@PreAuthorize("isAuthenticated()")
public BestPracticeResponse submit(@PathVariable UUID id, @AuthenticationPrincipal User u) {
    return service.submit(id, u);
}
```

- [ ] **Step 4: Run tests**

`./mvnw test -Dtest=BestPracticeServiceTest` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat: BP submit/resubmit transitions REJECTED→REQUESTED, PUBLISHED→REQUESTED+hide"
```

---

### Task 13: Notification Service (email)

**Files:**
- Create: `notification/{NotificationService.java, EmailNotificationService.java, EmailTemplate.java}`
- Create: `src/test/java/com/axon/notification/EmailNotificationServiceTest.java` (use GreenMail or just MailHog manual)

- [ ] **Step 1: Interface + templates**

```java
// notification/NotificationService.java
package com.axon.notification;
import com.axon.bestpractice.BestPractice;
public interface NotificationService {
    void notifyApproved(BestPractice bp);
    void notifyRejected(BestPractice bp, String reason);
    void notifyClosed(BestPractice bp, String reason);
}
```

```java
// notification/EmailTemplate.java
package com.axon.notification;
public class EmailTemplate {
    public static String approvedSubject(String name) { return "[AXon] BP \"" + name + "\" đã được approve"; }
    public static String approvedBody(String name)    { return "BP của bạn \"" + name + "\" đã được publish lên AXon library."; }
    public static String rejectedSubject(String name) { return "[AXon] BP \"" + name + "\" cần chỉnh sửa"; }
    public static String rejectedBody(String name, String reason) {
        return "BP \"" + name + "\" bị reject. Lý do:\n\n" + reason + "\n\nVui lòng chỉnh sửa và submit lại.";
    }
    public static String closedSubject(String name)   { return "[AXon] BP \"" + name + "\" đã bị close"; }
    public static String closedBody(String name, String reason) {
        return "BP \"" + name + "\" đã bị close. Lý do:\n\n" + reason;
    }
}
```

- [ ] **Step 2: EmailNotificationService**

```java
// notification/EmailNotificationService.java
package com.axon.notification;

import com.axon.bestpractice.BestPractice;
import com.axon.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor @Slf4j
public class EmailNotificationService implements NotificationService {
    private final JavaMailSender mailSender;
    @Value("${notification.email.from}") private String from;

    @Async
    @Override public void notifyApproved(BestPractice bp) {
        sendToCreators(bp, EmailTemplate.approvedSubject(bp.getName()),
                       EmailTemplate.approvedBody(bp.getName()));
    }
    @Async
    @Override public void notifyRejected(BestPractice bp, String reason) {
        sendToCreators(bp, EmailTemplate.rejectedSubject(bp.getName()),
                       EmailTemplate.rejectedBody(bp.getName(), reason));
    }
    @Async
    @Override public void notifyClosed(BestPractice bp, String reason) {
        sendToCreators(bp, EmailTemplate.closedSubject(bp.getName()),
                       EmailTemplate.closedBody(bp.getName(), reason));
    }

    private void sendToCreators(BestPractice bp, String subject, String body) {
        for (User u : bp.getCreators()) {
            var msg = new SimpleMailMessage();
            msg.setFrom(from); msg.setTo(u.getEmail());
            msg.setSubject(subject); msg.setText(body);
            try { mailSender.send(msg); }
            catch (Exception e) { log.warn("Email send failed to {}: {}", u.getEmail(), e.getMessage()); }
        }
    }
}
```

- [ ] **Step 3: Enable @Async**

```java
// config/AsyncConfig.java
@Configuration @EnableAsync
public class AsyncConfig {}
```

- [ ] **Step 4: Manual smoke test**

After Task 14 ships, approving a BP should produce an email visible at `http://localhost:8025` (MailHog).

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/notification/ axon-backend/src/main/java/com/axon/config/AsyncConfig.java
git commit -m "feat: email notification service (async) for review transitions"
```

---

### Task 14: Management — Approve / Reject (with self-approve check)

**Files:**
- Create: `management/{ManagementService.java, ManagementController.java}`
- Create: `management/dto/{RejectRequest.java, CloseRequest.java, ReviewItem.java}`
- Create: `src/test/java/com/axon/management/ManagementServiceTest.java`

- [ ] **Step 1: Failing test**

```java
// src/test/java/com/axon/management/ManagementServiceTest.java
@SpringBootTest @ActiveProfiles("dev") @Testcontainers
class ManagementServiceTest {
    /* container boilerplate */

    @Autowired ManagementService mgmt;
    @Autowired UserRepository userRepo;
    @Autowired BestPracticeRepository bpRepo;

    @Test void approveSetsPublishedAndRecordsReview() {
        var creator = saveUser("c@x", UserRole.AX_CREATOR);
        var reviewer = saveUser("s@x", UserRole.AX_SUPPORTER);
        var bp = saveBpRequested(creator);

        var resp = mgmt.approve(bp.getId(), reviewer);

        assertThat(resp.status()).isEqualTo("PUBLISHED");
        assertThat(bpRepo.findById(bp.getId()).orElseThrow().getPublishedAt()).isNotNull();
    }

    @Test void approveBlockedWhenSelfReview() {
        var both = saveUser("b@x", UserRole.AX_SUPPORTER);
        var bp = saveBpRequested(both);
        assertThatThrownBy(() -> mgmt.approve(bp.getId(), both))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test void rejectRequiresComment() {
        var creator = saveUser("c@x", UserRole.AX_CREATOR);
        var reviewer = saveUser("s@x", UserRole.AX_SUPPORTER);
        var bp = saveBpRequested(creator);
        assertThatThrownBy(() -> mgmt.reject(bp.getId(), reviewer, "  "))
            .isInstanceOf(BadRequestException.class);
    }
}
```

- [ ] **Step 2: Implement ManagementService**

```java
// management/ManagementService.java
package com.axon.management;

import com.axon.bestpractice.*;
import com.axon.bestpractice.dto.BestPracticeResponse;
import com.axon.common.exception.*;
import com.axon.file.BpFileRepository;
import com.axon.notification.NotificationService;
import com.axon.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class ManagementService {
    private final BestPracticeRepository bpRepo;
    private final BpReviewRepository reviewRepo;
    private final BpFileRepository fileRepo;
    private final BestPracticeMapper mapper;
    private final NotificationService notif;

    @Transactional
    public BestPracticeResponse approve(UUID bpId, User reviewer) {
        var bp = bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        if (bp.getStatus() != BestPracticeStatus.REQUESTED)
            throw new InvalidStateException("Only REQUESTED BP can be approved");
        if (bp.getCreators().stream().anyMatch(c -> c.getId().equals(reviewer.getId())))
            throw new ForbiddenException("Cannot approve your own best practice");
        bp.setStatus(BestPracticeStatus.PUBLISHED);
        bp.setPublishedAt(Instant.now());
        reviewRepo.save(BpReview.approved(bpId, reviewer.getId()));
        notif.notifyApproved(bp);
        return mapper.toResponse(bp, fileRepo.findAllByBpId(bpId), reviewer);
    }

    @Transactional
    public BestPracticeResponse reject(UUID bpId, User reviewer, String comment) {
        if (comment == null || comment.isBlank())
            throw new BadRequestException("Reject comment is required");
        var bp = bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        if (bp.getStatus() != BestPracticeStatus.REQUESTED)
            throw new InvalidStateException("Only REQUESTED BP can be rejected");
        bp.setStatus(BestPracticeStatus.REJECTED);
        reviewRepo.save(BpReview.rejected(bpId, reviewer.getId(), comment));
        notif.notifyRejected(bp, comment);
        return mapper.toResponse(bp, fileRepo.findAllByBpId(bpId), reviewer);
    }

    @Transactional
    public BestPracticeResponse close(UUID bpId, User reviewer, String reason) {
        if (reason == null || reason.isBlank())
            throw new BadRequestException("Close reason is required");
        var bp = bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        if (bp.getStatus() != BestPracticeStatus.PUBLISHED)
            throw new InvalidStateException("Only PUBLISHED BP can be closed");
        bp.setStatus(BestPracticeStatus.CLOSED);
        bp.setCloseReason(reason);
        reviewRepo.save(BpReview.closed(bpId, reviewer.getId(), reason));
        notif.notifyClosed(bp, reason);
        return mapper.toResponse(bp, fileRepo.findAllByBpId(bpId), reviewer);
    }

    public PagedResponse<BestPracticeListItem> list(String search, String status, int page, int size, User u) {
        var spec = (Specification<BestPractice>) (root, q, cb) -> cb.conjunction();
        if (status != null) {
            var st = BestPracticeStatus.valueOf(status);
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), st));
        }
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("name")), like));
        }
        var pageable = PageRequest.of(page, Math.min(size, 50),
            Sort.by(Sort.Direction.ASC, "createdAt"));
        var result = bpRepo.findAll(spec, pageable);
        return new PagedResponse<>(
            result.getContent().stream().map(b -> mapper.toListItem(b, u)).toList(),
            result.getTotalElements(), result.getTotalPages(), page);
    }

    public BestPracticeResponse detail(UUID bpId, User u) {
        var bp = bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        return mapper.toResponse(bp, fileRepo.findAllByBpId(bpId), u);
    }

    public List<ReviewItem> reviewHistory(UUID bpId) {
        return reviewRepo.findAllByBpIdOrderByReviewedAtDesc(bpId).stream()
            .map(ReviewItem::of).toList();
    }
}
```

- [ ] **Step 3: ManagementController**

```java
// management/ManagementController.java
@RestController @RequestMapping("/api/v1/management") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AX_SUPPORTER','ADMIN')")
public class ManagementController {
    private final ManagementService service;

    @GetMapping("/best-practices")
    public PagedResponse<BestPracticeListItem> list(
            @RequestParam(required=false) String search,
            @RequestParam(required=false) String status,
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size,
            @AuthenticationPrincipal User u) {
        return service.list(search, status, page, size, u);
    }

    @GetMapping("/best-practices/{id}")
    public BestPracticeResponse detail(@PathVariable UUID id, @AuthenticationPrincipal User u) {
        return service.detail(id, u);
    }

    @PutMapping("/best-practices/{id}/approve")
    public BestPracticeResponse approve(@PathVariable UUID id, @AuthenticationPrincipal User u) {
        return service.approve(id, u);
    }

    @PutMapping("/best-practices/{id}/reject")
    public BestPracticeResponse reject(@PathVariable UUID id,
                                       @RequestBody @Valid RejectRequest req,
                                       @AuthenticationPrincipal User u) {
        return service.reject(id, u, req.comment());
    }

    @PutMapping("/best-practices/{id}/close")
    public BestPracticeResponse close(@PathVariable UUID id,
                                      @RequestBody @Valid CloseRequest req,
                                      @AuthenticationPrincipal User u) {
        return service.close(id, u, req.reason());
    }

    @GetMapping("/reviews/{bpId}")
    public List<ReviewItem> reviews(@PathVariable UUID bpId) { return service.reviewHistory(bpId); }
}
```

```java
// management/dto/RejectRequest.java
public record RejectRequest(@NotBlank String comment) {}
// management/dto/CloseRequest.java
public record CloseRequest(@NotBlank String reason) {}
// management/dto/ReviewItem.java
public record ReviewItem(String id, String action, String comment, String reviewerName, Instant reviewedAt) {
    public static ReviewItem of(BpReview r) {
        return new ReviewItem(r.getId().toString(), r.getAction().name(),
            r.getComment(), null, r.getReviewedAt()); // reviewerName populated via join later
    }
}
```

- [ ] **Step 4: Run tests + manual smoke**

```bash
./mvnw test -Dtest=ManagementServiceTest
# Expected: PASS

# Manual: approve a BP, check MailHog (http://localhost:8025) for email.
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/management/ axon-backend/src/test/java/com/axon/management/
git commit -m "feat: management — approve/reject/close + self-approve guard + review history"
```

---

## Phase 5 — Interactions, Analytics, Dashboard

### Task 15: Like + Feedback + Download tracking

**Files:**
- Create: `interaction/{InteractionService.java, InteractionController.java}`
- Create: `interaction/dto/{LikeResponse.java, FeedbackRequest.java, FeedbackResponse.java}`
- Create: `src/test/java/com/axon/interaction/InteractionServiceTest.java`

- [ ] **Step 1: Failing test**

```java
// src/test/java/com/axon/interaction/InteractionServiceTest.java
@SpringBootTest @Testcontainers
class InteractionServiceTest {
    /* container boilerplate */

    @Autowired InteractionService svc;
    @Autowired UserRepository userRepo;
    @Autowired BestPracticeRepository bpRepo;

    @Test void toggleLikeIncrementsAndDecrements() {
        var u = userRepo.save(User.builder().email("u@x").name("U").role(UserRole.USER).build());
        var bp = saveBpPublished();

        var r1 = svc.toggleLike(bp.getId(), u);
        assertThat(r1.isLiked()).isTrue();
        assertThat(r1.likeCount()).isEqualTo(1);

        var r2 = svc.toggleLike(bp.getId(), u);
        assertThat(r2.isLiked()).isFalse();
        assertThat(r2.likeCount()).isEqualTo(0);
    }

    @Test void submitFeedbackPersistsAndReturnsItem() {
        var u = userRepo.save(User.builder().email("u@x").name("U").role(UserRole.USER).build());
        var bp = saveBpPublished();
        var resp = svc.submitFeedback(bp.getId(), u, "Useful!");
        assertThat(resp.content()).isEqualTo("Useful!");
        assertThat(svc.listFeedback(bp.getId(), 0, 10).content()).hasSize(1);
    }
}
```

- [ ] **Step 2: InteractionService**

```java
// interaction/InteractionService.java
package com.axon.interaction;

import com.axon.bestpractice.BestPracticeRepository;
import com.axon.common.PagedResponse;
import com.axon.common.exception.*;
import com.axon.interaction.dto.*;
import com.axon.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class InteractionService {
    private final BpLikeRepository likeRepo;
    private final BpFeedbackRepository feedbackRepo;
    private final BpDownloadRepository downloadRepo;
    private final BestPracticeRepository bpRepo;
    private final UserRepository userRepo;

    @Transactional
    public LikeResponse toggleLike(UUID bpId, User user) {
        bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        boolean liked = likeRepo.existsByBpIdAndUserId(bpId, user.getId());
        if (liked) {
            likeRepo.deleteByBpIdAndUserId(bpId, user.getId());
            bpRepo.decrementLikeCount(bpId);
            return new LikeResponse(false, bpRepo.findById(bpId).orElseThrow().getLikeCount());
        }
        likeRepo.save(BpLike.builder().bpId(bpId).userId(user.getId()).build());
        bpRepo.incrementLikeCount(bpId);
        return new LikeResponse(true, bpRepo.findById(bpId).orElseThrow().getLikeCount());
    }

    @Transactional
    public FeedbackResponse submitFeedback(UUID bpId, User user, String content) {
        if (content == null || content.isBlank())
            throw new BadRequestException("Feedback content required");
        if (content.length() > 2000)
            throw new BadRequestException("Feedback exceeds 2000 chars");
        bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        var fb = feedbackRepo.save(BpFeedback.builder()
            .bpId(bpId).userId(user.getId()).content(content).build());
        return FeedbackResponse.of(fb, user);
    }

    public PagedResponse<FeedbackResponse> listFeedback(UUID bpId, int page, int size) {
        var pg = feedbackRepo.findAllByBpIdOrderByCreatedAtDesc(bpId,
                    PageRequest.of(page, Math.min(size, 50)));
        var items = pg.getContent().stream().map(fb ->
            FeedbackResponse.of(fb, userRepo.findById(fb.getUserId()).orElse(null))).toList();
        return new PagedResponse<>(items, pg.getTotalElements(), pg.getTotalPages(), page);
    }
}
```

```java
// interaction/dto/LikeResponse.java
public record LikeResponse(boolean isLiked, int likeCount) {}
```

```java
// interaction/dto/FeedbackRequest.java
public record FeedbackRequest(@NotBlank @Size(max=2000) String content) {}
```

```java
// interaction/dto/FeedbackResponse.java
public record FeedbackResponse(
    String id, String content,
    String userId, String userName, String userAvatar,
    Instant createdAt) {
    public static FeedbackResponse of(BpFeedback fb, User u) {
        return new FeedbackResponse(
            fb.getId().toString(), fb.getContent(),
            u != null ? u.getId().toString() : null,
            u != null ? u.getName() : null,
            u != null ? u.getAvatarUrl() : null,
            fb.getCreatedAt());
    }
}
```

- [ ] **Step 3: InteractionController**

```java
// interaction/InteractionController.java
@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/best-practices/{bpId}")
public class InteractionController {
    private final InteractionService service;

    @PostMapping("/like")
    @PreAuthorize("isAuthenticated()")
    public LikeResponse toggleLike(@PathVariable UUID bpId, @AuthenticationPrincipal User u) {
        return service.toggleLike(bpId, u);
    }

    @PostMapping("/feedback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FeedbackResponse> submit(@PathVariable UUID bpId,
                                                   @RequestBody @Valid FeedbackRequest req,
                                                   @AuthenticationPrincipal User u) {
        return ResponseEntity.status(201).body(service.submitFeedback(bpId, u, req.content()));
    }

    @GetMapping("/feedback")
    @PreAuthorize("isAuthenticated()")
    public PagedResponse<FeedbackResponse> list(@PathVariable UUID bpId,
                                                @RequestParam(defaultValue="0") int page,
                                                @RequestParam(defaultValue="20") int size) {
        return service.listFeedback(bpId, page, size);
    }
}
```

(Download tracking is already wired into `FileService.generateDownloadUrl` in Task 11.)

- [ ] **Step 4: Run tests**

```bash
./mvnw test -Dtest=InteractionServiceTest
# Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add axon-backend/src/main/java/com/axon/interaction/ axon-backend/src/test/java/com/axon/interaction/
git commit -m "feat: like toggle + feedback submit/list with atomic counter updates"
```

---

### Task 16: Analytics API (per BP for Creator)

**Files:**
- Create: `analytics/{AnalyticsService.java, AnalyticsController.java, dto/AnalyticsResponse.java}`
- Create: `src/test/java/com/axon/analytics/AnalyticsServiceTest.java`

- [ ] **Step 1: AnalyticsService**

```java
// analytics/AnalyticsService.java
package com.axon.analytics;

import com.axon.analytics.dto.AnalyticsResponse;
import com.axon.bestpractice.BestPracticeRepository;
import com.axon.common.exception.*;
import com.axon.interaction.*;
import com.axon.interaction.dto.FeedbackResponse;
import com.axon.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class AnalyticsService {
    private final BestPracticeRepository bpRepo;
    private final BpFeedbackRepository feedbackRepo;
    private final BpDownloadRepository downloadRepo;
    private final UserRepository userRepo;
    private final JdbcTemplate jdbc;

    public AnalyticsResponse forBp(UUID bpId, User caller) {
        var bp = bpRepo.findById(bpId).orElseThrow(() -> new NotFoundException("BP not found"));
        boolean canSee = caller.getRole() == UserRole.AX_SUPPORTER
                      || caller.getRole() == UserRole.ADMIN
                      || bp.getCreators().stream().anyMatch(c -> c.getId().equals(caller.getId()));
        if (!canSee) throw new ForbiddenException("Not allowed");

        var recent = feedbackRepo.findTop5ByBpIdOrderByCreatedAtDesc(bpId).stream()
            .map(fb -> FeedbackResponse.of(fb, userRepo.findById(fb.getUserId()).orElse(null))).toList();

        var weekly = jdbc.queryForList(
            "SELECT to_char(date_trunc('week', downloaded_at), 'IYYY-\"W\"IW') AS week, COUNT(*) AS count " +
            "FROM bp_downloads WHERE bp_id = ? AND downloaded_at >= NOW() - INTERVAL '12 weeks' " +
            "GROUP BY week ORDER BY week ASC", bpId);
        var downloadsByWeek = weekly.stream()
            .map(r -> new AnalyticsResponse.WeekBucket((String) r.get("week"), ((Number) r.get("count")).intValue()))
            .toList();

        return new AnalyticsResponse(
            bp.getViewCount(), bp.getDownloadCount(), bp.getLikeCount(),
            (int) feedbackRepo.countByBpId(bpId), recent, downloadsByWeek);
    }
}
```

```java
// analytics/dto/AnalyticsResponse.java
public record AnalyticsResponse(
    int viewCount, int downloadCount, int likeCount, int feedbackCount,
    List<FeedbackResponse> recentFeedback,
    List<WeekBucket> downloadsByWeek
) {
    public record WeekBucket(String week, int count) {}
}
```

```java
// analytics/AnalyticsController.java
@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/best-practices/{bpId}")
public class AnalyticsController {
    private final AnalyticsService service;

    @GetMapping("/analytics")
    @PreAuthorize("isAuthenticated()")
    public AnalyticsResponse analytics(@PathVariable UUID bpId, @AuthenticationPrincipal User u) {
        return service.forBp(bpId, u);
    }
}
```

- [ ] **Step 2: Test**

```java
@Test void analyticsAccessibleByCreator_blockedForOtherUser() {
    var creator = saveUser("c@x", UserRole.AX_CREATOR);
    var other   = saveUser("o@x", UserRole.USER);
    var bp = saveBpAs(creator, BestPracticeStatus.PUBLISHED);

    var a = svc.forBp(bp.getId(), creator);
    assertThat(a.viewCount()).isGreaterThanOrEqualTo(0);

    assertThatThrownBy(() -> svc.forBp(bp.getId(), other))
        .isInstanceOf(ForbiddenException.class);
}
```

- [ ] **Step 3: Commit**

```bash
git add axon-backend/src/main/java/com/axon/analytics/ axon-backend/src/test/java/com/axon/analytics/
git commit -m "feat: per-BP analytics for creator (counts + last 5 feedback + weekly downloads)"
```

---

### Task 17: Dashboard API (Supporter monitoring) + Redis cache

**Files:**
- Create: `dashboard/{DashboardService.java, DashboardController.java, dto/DashboardResponse.java}`
- Modify: `config/RedisConfig.java` (CacheManager config)
- Create: `src/test/java/com/axon/dashboard/DashboardServiceTest.java`

- [ ] **Step 1: RedisConfig CacheManager**

```java
// config/RedisConfig.java
@Configuration @EnableCaching
public class RedisConfig {
    @Bean
    RedisCacheManager cacheManager(RedisConnectionFactory cf) {
        var config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(15))
            .disableCachingNullValues()
            .serializeValuesWith(SerializationPair.fromSerializer(
                new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(cf).cacheDefaults(config).build();
    }
}
```

- [ ] **Step 2: DashboardService**

```java
// dashboard/DashboardService.java
@Service @RequiredArgsConstructor
public class DashboardService {
    private final JdbcTemplate jdbc;
    private final UserRepository userRepo;

    @Cacheable("dashboard")
    public DashboardResponse compute() {
        long totalSubmitters = jdbc.queryForObject(
            "SELECT COUNT(DISTINCT user_id) FROM bp_creators", Long.class);

        Map<String, Long> byStatus = new HashMap<>(Map.of(
            "requested", 0L, "rejected", 0L, "published", 0L, "closed", 0L));
        jdbc.queryForList("SELECT status, COUNT(*) AS c FROM best_practices GROUP BY status")
            .forEach(r -> byStatus.put(((String) r.get("status")).toLowerCase(),
                                       ((Number) r.get("c")).longValue()));

        long totalBps = byStatus.values().stream().mapToLong(Long::longValue).sum();
        long totalJobs           = jdbc.queryForObject("SELECT COUNT(*) FROM jobs", Long.class);
        long totalAiCapabilities = jdbc.queryForObject("SELECT COUNT(*) FROM ai_capabilities", Long.class);
        long totalDepartments    = jdbc.queryForObject(
            "SELECT COUNT(DISTINCT d.id) FROM departments d " +
            "JOIN users u ON u.department_id=d.id", Long.class);

        var topCreators = jdbc.queryForList(
            "SELECT u.id AS id, u.name AS name, u.avatar_url AS avatar, COUNT(*) AS c " +
            "FROM bp_creators c JOIN users u ON u.id=c.user_id " +
            "JOIN best_practices b ON b.id=c.bp_id WHERE b.status='PUBLISHED' " +
            "GROUP BY u.id, u.name, u.avatar_url ORDER BY c DESC LIMIT 5")
            .stream().map(r -> new DashboardResponse.TopCreator(
                new DashboardResponse.UserBrief(
                    r.get("id").toString(), (String) r.get("name"), (String) r.get("avatar")),
                ((Number) r.get("c")).intValue())).toList();

        var topWorks = jdbc.queryForList(
            "SELECT w.id AS wid, w.name AS wname, wc.id AS cid, wc.name AS cname, COUNT(*) AS c " +
            "FROM best_practices b JOIN works w ON b.work_id=w.id " +
            "JOIN work_categories wc ON w.work_category_id=wc.id " +
            "WHERE b.status='PUBLISHED' " +
            "GROUP BY w.id, w.name, wc.id, wc.name ORDER BY c DESC LIMIT 5")
            .stream().map(r -> new DashboardResponse.TopWork(
                new DashboardResponse.WorkBrief(
                    r.get("wid").toString(), (String) r.get("wname"),
                    new DashboardResponse.LookupBrief(r.get("cid").toString(), (String) r.get("cname"))),
                ((Number) r.get("c")).intValue())).toList();

        return new DashboardResponse(totalSubmitters, totalBps, byStatus,
            totalJobs, totalAiCapabilities, totalDepartments, topCreators, topWorks);
    }
}
```

```java
// dashboard/dto/DashboardResponse.java
public record DashboardResponse(
    long totalSubmitters, long totalBps, Map<String,Long> byStatus,
    long totalJobs, long totalAiCapabilities, long totalDepartments,
    List<TopCreator> topCreators, List<TopWork> topWorks
) {
    public record UserBrief(String id, String name, String avatarUrl) {}
    public record LookupBrief(String id, String name) {}
    public record WorkBrief(String id, String name, LookupBrief workCategory) {}
    public record TopCreator(UserBrief user, int publishedCount) {}
    public record TopWork(WorkBrief work, int bpCount) {}
}
```

- [ ] **Step 3: Controller**

```java
// dashboard/DashboardController.java
@RestController @RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasAnyRole('AX_SUPPORTER','ADMIN')")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService service;
    @GetMapping public DashboardResponse get() { return service.compute(); }
}
```

- [ ] **Step 4: Commit**

```bash
git add axon-backend/src/main/java/com/axon/{dashboard,config/RedisConfig.java}
git commit -m "feat: dashboard stats with Redis cache (TTL 15m)"
```

---

## Phase 6 — Admin User Management

### Task 18: Admin Users API

**Files:**
- Create: `user/dto/{UserItem.java, UpdateRoleRequest.java}`
- Create: `user/AdminUserController.java`
- Modify: `user/UserService.java` (add `listUsers`, `updateRole`)
- Create: `src/test/java/com/axon/user/AdminUserControllerIT.java`

- [ ] **Step 1: DTOs**

```java
// user/dto/UserItem.java
public record UserItem(String id, String email, String name, String cipId,
                       String role, String departmentName, Instant createdAt) {
    public static UserItem of(User u) {
        return new UserItem(u.getId().toString(), u.getEmail(), u.getName(),
            u.getCipId(), u.getRole().name(),
            u.getDepartment() != null ? u.getDepartment().getName() : null,
            u.getCreatedAt());
    }
}
```

```java
// user/dto/UpdateRoleRequest.java
public record UpdateRoleRequest(@NotNull UserRole role) {}
```

- [ ] **Step 2: Service methods**

```java
// append to UserService
public PagedResponse<UserItem> list(String search, String role, int page, int size) {
    var spec = (Specification<User>) (root, q, cb) -> cb.conjunction();
    if (search != null && !search.isBlank()) {
        String like = "%" + search.toLowerCase() + "%";
        spec = spec.and((root, q, cb) -> cb.or(
            cb.like(cb.lower(root.get("name")), like),
            cb.like(cb.lower(root.get("email")), like)));
    }
    if (role != null) {
        var r = UserRole.valueOf(role);
        spec = spec.and((root, q, cb) -> cb.equal(root.get("role"), r));
    }
    var pg = userRepo.findAll(spec, PageRequest.of(page, Math.min(size,50),
        Sort.by(Sort.Direction.DESC, "createdAt")));
    return new PagedResponse<>(
        pg.getContent().stream().map(UserItem::of).toList(),
        pg.getTotalElements(), pg.getTotalPages(), page);
}

@Transactional
public UserItem updateRole(UUID userId, UserRole role) {
    var u = userRepo.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    u.setRole(role);
    return UserItem.of(u);
}
```

Add `JpaSpecificationExecutor<User>` to `UserRepository`.

- [ ] **Step 3: Controller**

```java
// user/AdminUserController.java
@RestController @RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')") @RequiredArgsConstructor
public class AdminUserController {
    private final UserService service;

    @GetMapping
    public PagedResponse<UserItem> list(@RequestParam(required=false) String search,
                                        @RequestParam(required=false) String role,
                                        @RequestParam(defaultValue="0") int page,
                                        @RequestParam(defaultValue="20") int size) {
        return service.list(search, role, page, size);
    }

    @PutMapping("/{id}/role")
    public UserItem updateRole(@PathVariable UUID id, @RequestBody @Valid UpdateRoleRequest req) {
        return service.updateRole(id, req.role());
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add axon-backend/src/main/java/com/axon/user/
git commit -m "feat: admin user listing + role update"
```

---

## Phase 7 — Frontend Foundation

### Task 19: Types + API Client + Auth Store + Routing + Guards

**Files:**
- Create: `axon-frontend/src/types/index.ts`
- Create: `axon-frontend/src/api/{client.ts, auth.ts, bestPractices.ts, files.ts, management.ts, interactions.ts, analytics.ts, dashboard.ts, lookups.ts, admin.ts}`
- Create: `axon-frontend/src/store/authStore.ts`
- Create: `axon-frontend/src/components/guards/{RequireAuth.tsx, RequireRole.tsx}`
- Modify: `axon-frontend/src/App.tsx`
- Modify: `axon-frontend/src/main.tsx`

- [ ] **Step 1: types/index.ts (mirror DLD §5.1)**

```typescript
// types/index.ts
export type BPType    = 'WEB' | 'TOOL' | 'EXTENSION';
export type BPStatus  = 'REQUESTED' | 'REJECTED' | 'PUBLISHED' | 'CLOSED';
export type UserRole  = 'USER' | 'AX_CREATOR' | 'AX_SUPPORTER' | 'ADMIN';

export interface User {
  id: string; email: string; name: string; role: UserRole;
  avatarUrl?: string;
  department?: { id: string; name: string };
}

export interface LookupRef { id: string; name: string }
export interface WorkCategoryRef extends LookupRef {}
export interface WorkRef { id: string; name: string; workCategory: LookupRef }
export interface CreatorRef { id: string; name: string; avatarUrl?: string }
export interface FileRef { id: string; fileName: string; fileSize: number; mimeType?: string; uploadedAt: string }

export interface BestPracticeListItem {
  id: string; name: string; description: string; thumbnailUrl?: string;
  type: BPType; status: BPStatus;
  job: LookupRef[]; work?: WorkRef;
  creators: CreatorRef[];
  likeCount: number; viewCount: number; downloadCount: number;
  isLikedByCurrentUser: boolean;
  publishedAt?: string;
}

export interface BestPractice extends BestPracticeListItem {
  installationGuide?: string;
  webContent?: string;
  keyValue?: string;
  aiCapability: LookupRef[];
  aiTool: LookupRef[];
  departments: LookupRef[];
  files: FileRef[];
  createdAt: string;
}

export interface BestPracticeRequest {
  name: string; description: string;
  thumbnailUrl?: string; installationGuide?: string;
  type: BPType;
  webContent?: string; keyValue?: string;
  workId?: string;
  jobIds: string[]; aiCapabilityIds: string[];
  aiToolIds: string[]; departmentIds: string[];
  creatorIds: string[];
}

export interface Feedback {
  id: string; content: string;
  userId: string; userName: string; userAvatar?: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[]; totalElements: number; totalPages: number; page: number;
}

export interface DashboardData {
  totalSubmitters: number; totalBps: number;
  byStatus: Record<'requested'|'published'|'rejected'|'closed', number>;
  totalJobs: number; totalAiCapabilities: number; totalDepartments: number;
  topCreators: { user: CreatorRef; publishedCount: number }[];
  topWorks: { work: WorkRef; bpCount: number }[];
}

export interface Analytics {
  viewCount: number; downloadCount: number; likeCount: number; feedbackCount: number;
  recentFeedback: Feedback[];
  downloadsByWeek: { week: string; count: number }[];
}

export interface ReviewItem {
  id: string; action: 'APPROVED'|'REJECTED'|'CLOSED';
  comment?: string; reviewerName?: string; reviewedAt: string;
}
```

- [ ] **Step 2: api/client.ts**

```typescript
// api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({ baseURL: '/' });

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) cfg.headers.set('Authorization', `Bearer ${token}`);
  return cfg;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  r => r,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          const rt = useAuthStore.getState().refreshToken;
          refreshing = axios.post('/auth/refresh', { refresh_token: rt })
            .then(r => {
              const newToken = r.data.accessToken;
              useAuthStore.getState().setAccessToken(newToken);
              return newToken as string;
            })
            .finally(() => { refreshing = null; });
        }
        const newToken = await refreshing;
        original.headers!.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
```

- [ ] **Step 3: store/authStore.ts**

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (access: string, refresh: string, user: User) => void;
  setAccessToken: (t: string) => void;
  setUser: (u: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: null, accessToken: null, refreshToken: null,
    login: (access, refresh, user) => set({ accessToken: access, refreshToken: refresh, user }),
    setAccessToken: (t) => set({ accessToken: t }),
    setUser: (u) => set({ user: u }),
    logout: () => set({ user: null, accessToken: null, refreshToken: null }),
  }),
  { name: 'axon-auth', partialize: (s) => ({ refreshToken: s.refreshToken, user: s.user }) }
));

export const useIsCreator   = () => ['AX_CREATOR','AX_SUPPORTER','ADMIN'].includes(useAuthStore(s => s.user?.role ?? ''));
export const useIsSupporter = () => ['AX_SUPPORTER','ADMIN'].includes(useAuthStore(s => s.user?.role ?? ''));
export const useIsAdmin     = () => useAuthStore(s => s.user?.role === 'ADMIN');
```

- [ ] **Step 4: API modules**

```typescript
// api/auth.ts
import api from './client';
import { User } from '../types';
export const authApi = {
  callback: (code: string) =>
    api.get<{ accessToken: string; refreshToken: string; user: User; expiresIn: number }>(
      '/auth/callback', { params: { code } }).then(r => r.data),
  me: () => api.get<User>('/auth/me').then(r => r.data),
  logout: () => api.post('/auth/logout'),
};
```

```typescript
// api/bestPractices.ts
import api from './client';
import type { BestPractice, BestPracticeListItem, BestPracticeRequest, PagedResponse } from '../types';

export const bpApi = {
  browse: (params: URLSearchParams) =>
    api.get<PagedResponse<BestPracticeListItem>>('/api/v1/best-practices', { params }).then(r => r.data),
  detail: (id: string) => api.get<BestPractice>(`/api/v1/best-practices/${id}`).then(r => r.data),
  create: (body: BestPracticeRequest) => api.post<BestPractice>('/api/v1/best-practices', body).then(r => r.data),
  update: (id: string, body: BestPracticeRequest) => api.put<BestPractice>(`/api/v1/best-practices/${id}`, body).then(r => r.data),
  remove: (id: string) => api.delete(`/api/v1/best-practices/${id}`),
  submit: (id: string) => api.post<BestPractice>(`/api/v1/best-practices/${id}/submit`).then(r => r.data),
  myList: (params: URLSearchParams) =>
    api.get<PagedResponse<BestPracticeListItem>>('/api/v1/my-best-practices', { params }).then(r => r.data),
};
```

```typescript
// api/files.ts
export const filesApi = {
  upload: (bpId: string, file: File) => {
    const form = new FormData(); form.append('file', file);
    return api.post(`/api/v1/best-practices/${bpId}/files`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  downloadUrl: (bpId: string, fileId: string) =>
    `/api/v1/best-practices/${bpId}/files/${fileId}/download`,
};
```

```typescript
// api/interactions.ts, management.ts, analytics.ts, dashboard.ts, lookups.ts, admin.ts
// follow the same shape: small typed functions per endpoint
```

- [ ] **Step 5: Guards**

```tsx
// components/guards/RequireAuth.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function RequireAuth() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

```tsx
// components/guards/RequireRole.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

export default function RequireRole({ roles }: { roles: UserRole[] }) {
  const role = useAuthStore(s => s.user?.role);
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

- [ ] **Step 6: App.tsx routing**

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import RequireAuth from './components/guards/RequireAuth';
import RequireRole from './components/guards/RequireRole';
import LibraryPage from './pages/LibraryPage';
import DetailPage from './pages/DetailPage';
import RegisterPage from './pages/RegisterPage';
import MyBPsPage from './pages/MyBPsPage';
import ManagementPage from './pages/ManagementPage';
import ReviewPage from './pages/ReviewPage';
import DashboardPage from './pages/DashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminLookupsPage from './pages/admin/AdminLookupsPage';
import AuthCallback from './pages/auth/AuthCallback';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<Layout />}>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/best-practices/:id" element={<DetailPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<RequireRole roles={['AX_CREATOR','AX_SUPPORTER','ADMIN']} />}>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/my-bps" element={<MyBPsPage />} />
              <Route path="/my-bps/:id/edit" element={<RegisterPage />} />
            </Route>
            <Route element={<RequireRole roles={['AX_SUPPORTER','ADMIN']} />}>
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/management/:id/review" element={<ReviewPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            <Route element={<RequireRole roles={['ADMIN']} />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/lookups" element={<AdminLookupsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: main.tsx with React Query**

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}><App /></QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 8: Smoke test**

```bash
cd axon-frontend
npm run dev
# open http://localhost:5173 — should render LibraryPage skeleton without auth error
```

- [ ] **Step 9: Commit**

```bash
git add axon-frontend/src/
git commit -m "feat(fe): types + API client + auth store + routing + guards"
```

---

### Task 20: Layout + Auth Callback Page + Header

**Files:**
- Create: `components/layout/{Layout.tsx, Header.tsx, RoleNav.tsx}`
- Create: `pages/auth/AuthCallback.tsx`
- Create: `components/shared/{Spinner.tsx, TypeBadge.tsx, StatusBadge.tsx}`

- [ ] **Step 1: Layout + Header**

```tsx
// components/layout/Header.tsx
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import RoleNav from './RoleNav';

export default function Header() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl">AXon</Link>
        <RoleNav />
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm">{user.name}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{user.role}</span>
              <button onClick={logout} className="text-sm text-gray-500 hover:underline">Logout</button>
            </div>
          ) : (
            <a href="/auth/login?state=ui" className="px-3 py-1 bg-blue-600 text-white rounded">Login</a>
          )}
        </div>
      </div>
    </header>
  );
}
```

```tsx
// components/layout/RoleNav.tsx
import { NavLink } from 'react-router-dom';
import { useAuthStore, useIsCreator, useIsSupporter, useIsAdmin } from '../../store/authStore';

export default function RoleNav() {
  const user = useAuthStore(s => s.user);
  const isCreator   = useIsCreator();
  const isSupporter = useIsSupporter();
  const isAdmin     = useIsAdmin();
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`;
  return (
    <nav className="flex gap-2">
      <NavLink to="/" className={linkCls} end>Library</NavLink>
      {user && isCreator   && <NavLink to="/register"  className={linkCls}>Register</NavLink>}
      {user && isCreator   && <NavLink to="/my-bps"     className={linkCls}>My BPs</NavLink>}
      {user && isSupporter && <NavLink to="/management" className={linkCls}>Management</NavLink>}
      {user && isSupporter && <NavLink to="/dashboard"  className={linkCls}>Dashboard</NavLink>}
      {user && isAdmin     && <NavLink to="/admin/users"   className={linkCls}>Users</NavLink>}
      {user && isAdmin     && <NavLink to="/admin/lookups" className={linkCls}>Taxonomy</NavLink>}
    </nav>
  );
}
```

```tsx
// components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6"><Outlet /></main>
    </div>
  );
}
```

- [ ] **Step 2: AuthCallback page**

```tsx
// pages/auth/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const login = useAuthStore(s => s.login);

  useEffect(() => {
    const code = params.get('code');
    if (!code) { nav('/'); return; }
    authApi.callback(code).then(({ accessToken, refreshToken, user }) => {
      login(accessToken, refreshToken, user);
      nav('/');
    }).catch(() => nav('/'));
  }, [params, nav, login]);

  return <div className="p-8 text-center">Signing in…</div>;
}
```

- [ ] **Step 3: Shared visual components**

```tsx
// components/shared/TypeBadge.tsx
import type { BPType } from '../../types';
const styles: Record<BPType, string> = {
  WEB:       'bg-blue-100 text-blue-700',
  TOOL:      'bg-green-100 text-green-700',
  EXTENSION: 'bg-purple-100 text-purple-700',
};
export default function TypeBadge({ type }: { type: BPType }) {
  return <span className={`text-xs px-2 py-0.5 rounded ${styles[type]}`}>{type}</span>;
}
```

```tsx
// components/shared/StatusBadge.tsx
import type { BPStatus } from '../../types';
const styles: Record<BPStatus, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  REJECTED:  'bg-red-100 text-red-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  CLOSED:    'bg-gray-200 text-gray-700',
};
export default function StatusBadge({ status }: { status: BPStatus }) {
  return <span className={`text-xs px-2 py-0.5 rounded ${styles[status]}`}>{status}</span>;
}
```

```tsx
// components/shared/Spinner.tsx
export default function Spinner() {
  return <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto" />;
}
```

- [ ] **Step 4: Smoke**

Click Login on the header → backend mock returns to `/auth/callback?code=mock-code` → store populates → redirect to `/`. Header shows user name + role.

- [ ] **Step 5: Commit**

```bash
git add axon-frontend/src/components/ axon-frontend/src/pages/auth/
git commit -m "feat(fe): layout + role-aware nav + auth callback flow"
```

---

## Phase 8 — Frontend Pages: Library & Detail

### Task 21: Library Browse Page

**Files:**
- Create: `pages/LibraryPage.tsx`
- Create: `components/library/{BPCard.tsx, FilterPanel.tsx, SortDropdown.tsx, SearchBar.tsx, Paginator.tsx, CreatorAvatars.tsx}`
- Create: `hooks/useLookups.ts`

- [ ] **Step 1: useLookups hook**

```typescript
// hooks/useLookups.ts
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export const useJobs = () => useQuery({
  queryKey: ['lookup', 'jobs'],
  queryFn: () => api.get('/api/v1/jobs').then(r => r.data),
});
// similar: useAiCapabilities, useAiTools, useDepartments, useWorkCategories, useWorks(workCategoryId?)
```

- [ ] **Step 2: BPCard**

```tsx
// components/library/BPCard.tsx
import { Link } from 'react-router-dom';
import TypeBadge from '../shared/TypeBadge';
import CreatorAvatars from './CreatorAvatars';
import type { BestPracticeListItem } from '../../types';

export default function BPCard({ bp }: { bp: BestPracticeListItem }) {
  return (
    <Link to={`/best-practices/${bp.id}`} className="block bg-white rounded-lg shadow hover:shadow-md transition p-4">
      {bp.thumbnailUrl && <img src={bp.thumbnailUrl} alt="" className="w-full h-32 object-cover rounded mb-3" />}
      <div className="flex items-center justify-between mb-2">
        <TypeBadge type={bp.type} />
        <span className="text-xs text-gray-500">♥ {bp.likeCount} · 👁 {bp.viewCount} · ⬇ {bp.downloadCount}</span>
      </div>
      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{bp.name}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{bp.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {bp.job.slice(0, 2).map(j =>
            <span key={j.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{j.name}</span>)}
          {bp.work && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{bp.work.name}</span>}
        </div>
        <CreatorAvatars creators={bp.creators} />
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: CreatorAvatars (first name + +N others)**

```tsx
// components/library/CreatorAvatars.tsx
import type { CreatorRef } from '../../types';
export default function CreatorAvatars({ creators }: { creators: CreatorRef[] }) {
  if (!creators.length) return null;
  const first = creators[0];
  const rest  = creators.length - 1;
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      {first.avatarUrl
        ? <img src={first.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
        : <div className="w-5 h-5 rounded-full bg-gray-300" />}
      <span>{first.name}{rest > 0 ? ` +${rest} other${rest > 1 ? 's' : ''}` : ''}</span>
    </div>
  );
}
```

- [ ] **Step 4: FilterPanel**

```tsx
// components/library/FilterPanel.tsx
import { useJobs, useAiCapabilities, useAiTools, useDepartments, useWorkCategories } from '../../hooks/useLookups';
import type { LookupRef } from '../../types';

type Filters = {
  jobId?: string; aiCapabilityId?: string; aiToolId?: string;
  departmentId?: string; workCategoryId?: string; workId?: string; type?: string;
};

export default function FilterPanel({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const jobs = useJobs(); const caps = useAiCapabilities();
  const tools = useAiTools(); const depts = useDepartments(); const cats = useWorkCategories();
  const select = (k: keyof Filters, items: LookupRef[] | undefined, label: string) => (
    <select className="border rounded px-2 py-1 text-sm"
            value={value[k] ?? ''}
            onChange={e => onChange({ ...value, [k]: e.target.value || undefined })}>
      <option value="">{label}</option>
      {items?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
    </select>
  );
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {select('jobId',          jobs.data,  'All Jobs')}
      {select('aiCapabilityId', caps.data,  'All AI Capabilities')}
      {select('aiToolId',       tools.data, 'All AI Tools')}
      {select('departmentId',   depts.data, 'All Departments')}
      {select('workCategoryId', cats.data,  'All Work Categories')}
      <select className="border rounded px-2 py-1 text-sm"
              value={value.type ?? ''}
              onChange={e => onChange({ ...value, type: e.target.value || undefined })}>
        <option value="">All Types</option>
        <option value="WEB">WEB</option><option value="TOOL">TOOL</option><option value="EXTENSION">EXTENSION</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 5: LibraryPage**

```tsx
// pages/LibraryPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bpApi } from '../api/bestPractices';
import BPCard from '../components/library/BPCard';
import FilterPanel from '../components/library/FilterPanel';
import Spinner from '../components/shared/Spinner';

export default function LibraryPage() {
  const [filters, setFilters] = useState<any>({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('publishedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v as string));
  if (search) params.set('search', search);
  params.set('sortBy', sortBy); params.set('sortDir', sortDir);
  params.set('page', String(page)); params.set('size', '20');

  const { data, isLoading } = useQuery({
    queryKey: ['bp', 'list', params.toString()],
    queryFn: () => bpApi.browse(params),
  });

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <input className="border rounded px-3 py-1 w-80" placeholder="Search…"
               value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select className="border rounded px-2 py-1 text-sm"
                value={`${sortBy}:${sortDir}`}
                onChange={e => { const [b, d] = e.target.value.split(':'); setSortBy(b); setSortDir(d); }}>
          <option value="publishedAt:desc">Newest</option>
          <option value="likeCount:desc">Most liked</option>
          <option value="viewCount:desc">Most viewed</option>
          <option value="downloadCount:desc">Most downloaded</option>
          <option value="jobName:asc">Job (A→Z)</option>
          <option value="workCategoryName:asc">Work Category (A→Z)</option>
          <option value="workName:asc">Work (A→Z)</option>
        </select>
      </div>
      <FilterPanel value={filters} onChange={f => { setFilters(f); setPage(0); }} />
      {isLoading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.content.map(bp => <BPCard key={bp.id} bp={bp} />)}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <span className="px-3 py-1">{page + 1} / {data?.totalPages ?? 1}</span>
            <button disabled={!data || page + 1 >= data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Smoke**

Open `http://localhost:5173/` — should show seeded BPs (after creating some via API or admin UI). Filter and sort changes should refetch.

- [ ] **Step 7: Commit**

```bash
git add axon-frontend/src/{pages/LibraryPage.tsx,components/library,hooks/useLookups.ts}
git commit -m "feat(fe): library browse — cards, filters, sort, search, pagination"
```

---

### Task 22: Detail Page — Info / Files / Like / Feedback

**Files:**
- Create: `pages/DetailPage.tsx`
- Create: `components/detail/{InfoBlock.tsx, FilesBlock.tsx, LikeButton.tsx, FeedbackForm.tsx, FeedbackList.tsx, KeyValueBlock.tsx}`
- Create: `api/interactions.ts` (if not in Task 19)

- [ ] **Step 1: interactions API**

```typescript
// api/interactions.ts
import api from './client';
import type { Feedback, PagedResponse } from '../types';

export const interactionsApi = {
  toggleLike: (bpId: string) =>
    api.post<{ isLiked: boolean; likeCount: number }>(`/api/v1/best-practices/${bpId}/like`).then(r => r.data),
  listFeedback: (bpId: string, page = 0, size = 20) =>
    api.get<PagedResponse<Feedback>>(`/api/v1/best-practices/${bpId}/feedback`, { params: { page, size }}).then(r => r.data),
  submitFeedback: (bpId: string, content: string) =>
    api.post<Feedback>(`/api/v1/best-practices/${bpId}/feedback`, { content }).then(r => r.data),
};
```

- [ ] **Step 2: LikeButton**

```tsx
// components/detail/LikeButton.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { interactionsApi } from '../../api/interactions';

export default function LikeButton({ bpId, liked, count }: { bpId: string; liked: boolean; count: number }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => interactionsApi.toggleLike(bpId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bp', 'detail', bpId] }),
  });
  return (
    <button onClick={() => m.mutate()} disabled={m.isPending}
            className={`px-3 py-1 rounded border ${liked ? 'bg-pink-50 border-pink-300 text-pink-700' : 'border-gray-300'}`}>
      ♥ {count} {liked ? 'Liked' : 'Like'}
    </button>
  );
}
```

- [ ] **Step 3: FilesBlock**

```tsx
// components/detail/FilesBlock.tsx
import type { FileRef } from '../../types';
import { filesApi } from '../../api/files';

export default function FilesBlock({ bpId, files }: { bpId: string; files: FileRef[] }) {
  if (!files.length) return null;
  return (
    <section className="bg-white rounded shadow p-4 mb-4">
      <h3 className="font-semibold mb-2">Files</h3>
      <ul className="divide-y">
        {files.map(f => (
          <li key={f.id} className="py-2 flex items-center justify-between">
            <span>{f.fileName} <span className="text-xs text-gray-500">({(f.fileSize / 1024).toFixed(1)} KB)</span></span>
            <a className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
               href={filesApi.downloadUrl(bpId, f.id)}>Download</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: FeedbackForm + FeedbackList**

```tsx
// components/detail/FeedbackForm.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { interactionsApi } from '../../api/interactions';

export default function FeedbackForm({ bpId }: { bpId: string }) {
  const [text, setText] = useState('');
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => interactionsApi.submitFeedback(bpId, text),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['fb', bpId] }); },
  });
  return (
    <form onSubmit={e => { e.preventDefault(); m.mutate(); }} className="mb-4">
      <textarea className="w-full border rounded p-2" rows={3} maxLength={2000}
                placeholder="Leave a feedback…"
                value={text} onChange={e => setText(e.target.value)} />
      <button type="submit" disabled={!text.trim() || m.isPending}
              className="mt-2 px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50">
        Send
      </button>
    </form>
  );
}
```

```tsx
// components/detail/FeedbackList.tsx
import { useQuery } from '@tanstack/react-query';
import { interactionsApi } from '../../api/interactions';

export default function FeedbackList({ bpId }: { bpId: string }) {
  const { data } = useQuery({
    queryKey: ['fb', bpId],
    queryFn: () => interactionsApi.listFeedback(bpId),
  });
  return (
    <div className="space-y-3">
      {data?.content.map(f => (
        <div key={f.id} className="bg-white rounded shadow p-3 text-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{f.userName}</span>
            <span>{new Date(f.createdAt).toLocaleString()}</span>
          </div>
          <p>{f.content}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: DetailPage**

```tsx
// pages/DetailPage.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bpApi } from '../api/bestPractices';
import TypeBadge from '../components/shared/TypeBadge';
import StatusBadge from '../components/shared/StatusBadge';
import LikeButton from '../components/detail/LikeButton';
import FilesBlock from '../components/detail/FilesBlock';
import FeedbackForm from '../components/detail/FeedbackForm';
import FeedbackList from '../components/detail/FeedbackList';
import { useAuthStore } from '../store/authStore';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore(s => s.user);
  const { data: bp, isLoading } = useQuery({
    queryKey: ['bp', 'detail', id],
    queryFn: () => bpApi.detail(id!),
    enabled: !!id,
  });

  if (isLoading || !bp) return <p>Loading…</p>;

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TypeBadge type={bp.type} /><StatusBadge status={bp.status} />
        </div>
        <h1 className="text-2xl font-bold">{bp.name}</h1>
        <p className="text-gray-600">{bp.description}</p>
        <div className="mt-2 text-sm text-gray-500">
          By {bp.creators.map(c => c.name).join(', ')}
        </div>
      </header>

      <div className="flex items-center gap-3 mb-4">
        {user && <LikeButton bpId={bp.id} liked={bp.isLikedByCurrentUser} count={bp.likeCount} />}
        <span className="text-sm text-gray-500">👁 {bp.viewCount} · ⬇ {bp.downloadCount}</span>
      </div>

      {bp.installationGuide && (
        <section className="bg-white rounded shadow p-4 mb-4">
          <h3 className="font-semibold mb-2">Installation Guide</h3>
          <pre className="whitespace-pre-wrap text-sm">{bp.installationGuide}</pre>
        </section>
      )}

      {bp.type === 'WEB' && bp.webContent && (
        <section className="bg-white rounded shadow p-4 mb-4">
          <h3 className="font-semibold mb-2">Link / Web Content</h3>
          <a href={bp.webContent} target="_blank" rel="noopener" className="text-blue-600 underline break-all">
            {bp.webContent}
          </a>
        </section>
      )}

      {bp.keyValue && (
        <section className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <h3 className="font-semibold mb-2 text-yellow-900">Key (sensitive)</h3>
          <code className="text-sm">{bp.keyValue}</code>
        </section>
      )}

      <FilesBlock bpId={bp.id} files={bp.files} />

      <section className="mt-6">
        <h2 className="font-semibold text-lg mb-3">Feedback</h2>
        {user && <FeedbackForm bpId={bp.id} />}
        <FeedbackList bpId={bp.id} />
      </section>
    </article>
  );
}
```

- [ ] **Step 6: Smoke**

Open a published BP → see view++ on each refresh. Click Like → toggle. Submit feedback → appears in list immediately.

- [ ] **Step 7: Commit**

```bash
git add axon-frontend/src/pages/DetailPage.tsx axon-frontend/src/components/detail axon-frontend/src/api/interactions.ts
git commit -m "feat(fe): BP detail — info, files, like toggle, feedback form/list"
```

---

### Task 23: Register/Edit Form (Multi-step)

**Files:**
- Create: `pages/RegisterPage.tsx`
- Create: `components/register/{StepBasic.tsx, StepCategorization.tsx, StepContent.tsx, StepReview.tsx, CreatorPicker.tsx, LookupMultiSelect.tsx}`

- [ ] **Step 1: LookupMultiSelect**

```tsx
// components/register/LookupMultiSelect.tsx
import type { LookupRef } from '../../types';

export default function LookupMultiSelect({
  options, value, onChange, label
}: { options: LookupRef[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map(o => (
          <button key={o.id} type="button" onClick={() => toggle(o.id)}
                  className={`px-3 py-1 rounded border text-sm ${
                    value.includes(o.id) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
                  }`}>
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CreatorPicker (multi-creator search)**

```tsx
// components/register/CreatorPicker.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { CreatorRef } from '../../types';

export default function CreatorPicker({ value, onChange }: { value: CreatorRef[]; onChange: (v: CreatorRef[]) => void }) {
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['cip-search', q],
    queryFn: () => api.get('/api/v1/admin/users', { params: { search: q, size: 10 }}).then(r => r.data.content),
    enabled: q.length >= 2,
  });

  const add = (u: CreatorRef) => { if (!value.find(v => v.id === u.id)) onChange([...value, u]); };
  const remove = (id: string) => onChange(value.filter(v => v.id !== id));

  return (
    <div>
      <label className="text-sm font-medium">Creators (search CIP)</label>
      <input className="border rounded px-2 py-1 w-full mt-1" placeholder="Type to search…"
             value={q} onChange={e => setQ(e.target.value)} />
      {data && data.length > 0 && (
        <div className="border rounded mt-1 bg-white max-h-40 overflow-auto">
          {data.map((u: any) => (
            <button type="button" key={u.id} className="block w-full text-left px-2 py-1 hover:bg-gray-50"
                    onClick={() => { add({ id: u.id, name: u.name, avatarUrl: u.avatarUrl }); setQ(''); }}>
              {u.name} <span className="text-xs text-gray-500">({u.email})</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {value.map(c => (
          <span key={c.id} className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-1">
            {c.name}
            <button type="button" className="text-gray-500" onClick={() => remove(c.id)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: RegisterPage (4-step wizard)**

```tsx
// pages/RegisterPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { bpApi } from '../api/bestPractices';
import { filesApi } from '../api/files';
import { useJobs, useAiCapabilities, useAiTools, useDepartments, useWorkCategories, useWorks } from '../hooks/useLookups';
import LookupMultiSelect from '../components/register/LookupMultiSelect';
import CreatorPicker from '../components/register/CreatorPicker';
import { useAuthStore } from '../store/authStore';
import type { BestPracticeRequest, BPType, CreatorRef } from '../types';

const empty: BestPracticeRequest & { creators: CreatorRef[] } = {
  name: '', description: '', installationGuide: '',
  type: 'WEB', webContent: '', keyValue: '',
  jobIds: [], aiCapabilityIds: [], aiToolIds: [], departmentIds: [],
  creatorIds: [], creators: [], workId: undefined,
};

export default function RegisterPage() {
  const { id } = useParams<{ id?: string }>();
  const user = useAuthStore(s => s.user)!;
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...empty });
  const [file, setFile] = useState<File | null>(null);

  const jobs = useJobs(); const caps = useAiCapabilities();
  const tools = useAiTools(); const depts = useDepartments(); const cats = useWorkCategories();
  const [workCategoryId, setWorkCategoryId] = useState<string | undefined>();
  const works = useWorks(workCategoryId);

  useEffect(() => {
    if (id) bpApi.detail(id).then(bp => {
      setForm({
        name: bp.name, description: bp.description, installationGuide: bp.installationGuide ?? '',
        type: bp.type, webContent: bp.webContent ?? '', keyValue: bp.keyValue ?? '',
        jobIds: bp.job.map(j => j.id),
        aiCapabilityIds: bp.aiCapability.map(a => a.id),
        aiToolIds: bp.aiTool.map(t => t.id),
        departmentIds: bp.departments.map(d => d.id),
        creatorIds: bp.creators.map(c => c.id),
        creators: bp.creators, workId: bp.work?.id,
      });
      if (bp.work) setWorkCategoryId(bp.work.workCategory.id);
    });
    if (!id) setForm(f => ({ ...f, creators: [{ id: user.id, name: user.name, avatarUrl: user.avatarUrl }],
                                  creatorIds: [user.id] }));
  }, [id, user]);

  useEffect(() => {
    setForm(f => ({ ...f, creatorIds: f.creators.map(c => c.id) }));
  }, [form.creators]);

  const submit = useMutation({
    mutationFn: async () => {
      const payload: BestPracticeRequest = { ...form };
      const bp = id ? await bpApi.update(id, payload) : await bpApi.create(payload);
      if (file && payload.type !== 'WEB') await filesApi.upload(bp.id, file);
      return bp;
    },
    onSuccess: (bp) => nav(`/best-practices/${bp.id}`),
  });

  return (
    <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
      <h1 className="text-xl font-bold mb-2">{id ? 'Edit' : 'Register'} Best Practice — Step {step + 1}/4</h1>

      {step === 0 && (
        <div className="space-y-3">
          <input className="border rounded w-full px-2 py-1" placeholder="Name (max 200)"
                 maxLength={200} value={form.name}
                 onChange={e => setForm({ ...form, name: e.target.value })} />
          <textarea className="border rounded w-full px-2 py-1" placeholder="Description" rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
          <textarea className="border rounded w-full px-2 py-1" placeholder="Installation guide" rows={4}
                    value={form.installationGuide}
                    onChange={e => setForm({ ...form, installationGuide: e.target.value })} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <LookupMultiSelect label="Jobs"           options={jobs.data ?? []}  value={form.jobIds}
                             onChange={v => setForm({ ...form, jobIds: v })} />
          <LookupMultiSelect label="AI Capabilities" options={caps.data ?? []}  value={form.aiCapabilityIds}
                             onChange={v => setForm({ ...form, aiCapabilityIds: v })} />
          <LookupMultiSelect label="AI Tools"       options={tools.data ?? []} value={form.aiToolIds}
                             onChange={v => setForm({ ...form, aiToolIds: v })} />
          <LookupMultiSelect label="Departments"    options={depts.data ?? []} value={form.departmentIds}
                             onChange={v => setForm({ ...form, departmentIds: v })} />
          <div>
            <label className="text-sm font-medium">Work Category / Work</label>
            <div className="flex gap-2 mt-1">
              <select className="border rounded px-2 py-1" value={workCategoryId ?? ''}
                      onChange={e => { setWorkCategoryId(e.target.value || undefined); setForm({ ...form, workId: undefined }); }}>
                <option value="">Select category</option>
                {cats.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="border rounded px-2 py-1" value={form.workId ?? ''}
                      onChange={e => setForm({ ...form, workId: e.target.value || undefined })}>
                <option value="">Select work</option>
                {works.data?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Type</label>
          <div className="flex gap-3">
            {(['WEB','TOOL','EXTENSION'] as BPType[]).map(t => (
              <label key={t}>
                <input type="radio" checked={form.type === t}
                       onChange={() => setForm({ ...form, type: t })} /> {t}
              </label>
            ))}
          </div>
          {form.type === 'WEB' && (
            <input className="border rounded w-full px-2 py-1" placeholder="URL or content (max 256)"
                   maxLength={256} value={form.webContent}
                   onChange={e => setForm({ ...form, webContent: e.target.value })} />
          )}
          {form.type !== 'WEB' && (
            <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          )}
          <input className="border rounded w-full px-2 py-1" placeholder="Key (sensitive)"
                 value={form.keyValue}
                 onChange={e => setForm({ ...form, keyValue: e.target.value })} />
          <CreatorPicker value={form.creators} onChange={cr => setForm({ ...form, creators: cr })} />
        </div>
      )}

      {step === 3 && (
        <div className="prose">
          <h3>{form.name}</h3>
          <p>{form.description}</p>
          <p><b>Type:</b> {form.type}</p>
          <p><b>Creators:</b> {form.creators.map(c => c.name).join(', ')}</p>
          {file && <p><b>File:</b> {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(s => s - 1)}
                className="px-4 py-1 border rounded disabled:opacity-50">Back</button>
        {step < 3
          ? <button onClick={() => setStep(s => s + 1)} className="px-4 py-1 bg-blue-600 text-white rounded">Next</button>
          : <button onClick={() => submit.mutate()} disabled={submit.isPending}
                    className="px-4 py-1 bg-green-600 text-white rounded">
              {id ? 'Save changes' : 'Submit'}
            </button>
        }
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Smoke**

Walk through 4 steps → submit → status=REQUESTED → redirect to detail page. Edit flow loads pre-filled form.

- [ ] **Step 5: Commit**

```bash
git add axon-frontend/src/pages/RegisterPage.tsx axon-frontend/src/components/register/
git commit -m "feat(fe): register/edit BP — 4-step wizard + multi-creator + file upload"
```

---

### Task 24: My BPs Page

**Files:**
- Create: `pages/MyBPsPage.tsx`
- Create: `components/library/MyBPRow.tsx`

- [ ] **Step 1: MyBPsPage**

```tsx
// pages/MyBPsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bpApi } from '../api/bestPractices';
import StatusBadge from '../components/shared/StatusBadge';
import type { BPStatus } from '../types';

export default function MyBPsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BPStatus | ''>('');
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['my-bps', params.toString()],
    queryFn: () => bpApi.myList(params),
  });

  const remove = useMutation({
    mutationFn: (id: string) => bpApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bps'] }),
  });
  const submit = useMutation({
    mutationFn: (id: string) => bpApi.submit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bps'] }),
  });

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <input className="border rounded px-2 py-1" placeholder="Search…"
                 value={search} onChange={e => setSearch(e.target.value)} />
          <select className="border rounded px-2 py-1"
                  value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="">All statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
        <Link to="/register" className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+ New BP</Link>
      </div>

      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="border-b">
          <tr><th className="text-left p-2">Name</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {data?.content.map(bp => (
            <tr key={bp.id} className="border-b last:border-0">
              <td className="p-2"><Link to={`/best-practices/${bp.id}`} className="text-blue-600">{bp.name}</Link></td>
              <td className="text-center"><StatusBadge status={bp.status} /></td>
              <td className="text-center text-gray-500">{bp.publishedAt ?? '—'}</td>
              <td className="text-center space-x-2">
                {(bp.status === 'REQUESTED' || bp.status === 'REJECTED' || bp.status === 'PUBLISHED') && (
                  <Link to={`/my-bps/${bp.id}/edit`} className="text-blue-600">Edit</Link>
                )}
                {bp.status === 'REJECTED' && (
                  <button onClick={() => submit.mutate(bp.id)} className="text-green-600">Resubmit</button>
                )}
                {(bp.status === 'REQUESTED' || bp.status === 'REJECTED') && (
                  <button onClick={() => confirm('Delete?') && remove.mutate(bp.id)} className="text-red-600">Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Smoke + commit**

```bash
git add axon-frontend/src/pages/MyBPsPage.tsx
git commit -m "feat(fe): my BPs page — list/search/filter + edit/delete/resubmit"
```

---

## Phase 9 — Frontend Management & Admin

### Task 25: Management Page + Review Page

**Files:**
- Create: `pages/ManagementPage.tsx`
- Create: `pages/ReviewPage.tsx`
- Create: `components/management/{StatusFilter.tsx, ReviewActions.tsx}`
- Create: `api/management.ts`

- [ ] **Step 1: management API**

```typescript
// api/management.ts
import api from './client';
import type { BestPractice, BestPracticeListItem, PagedResponse, ReviewItem } from '../types';

export const mgmtApi = {
  list: (params: URLSearchParams) =>
    api.get<PagedResponse<BestPracticeListItem>>('/api/v1/management/best-practices', { params }).then(r => r.data),
  detail: (id: string) => api.get<BestPractice>(`/api/v1/management/best-practices/${id}`).then(r => r.data),
  approve: (id: string) => api.put<BestPractice>(`/api/v1/management/best-practices/${id}/approve`).then(r => r.data),
  reject:  (id: string, comment: string) => api.put<BestPractice>(`/api/v1/management/best-practices/${id}/reject`, { comment }).then(r => r.data),
  close:   (id: string, reason: string)  => api.put<BestPractice>(`/api/v1/management/best-practices/${id}/close`,  { reason  }).then(r => r.data),
  reviews: (bpId: string) => api.get<ReviewItem[]>(`/api/v1/management/reviews/${bpId}`).then(r => r.data),
};
```

- [ ] **Step 2: ManagementPage**

```tsx
// pages/ManagementPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mgmtApi } from '../api/management';
import StatusBadge from '../components/shared/StatusBadge';

export default function ManagementPage() {
  const [status, setStatus] = useState('REQUESTED');
  const params = new URLSearchParams(); params.set('status', status);
  const { data } = useQuery({ queryKey: ['mgmt', status], queryFn: () => mgmtApi.list(params) });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['REQUESTED','REJECTED','PUBLISHED','CLOSED'].map(s => (
          <button key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 rounded text-sm ${status === s ? 'bg-blue-600 text-white' : 'border'}`}>
            {s}
          </button>
        ))}
      </div>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="border-b"><tr><th className="text-left p-2">Name</th><th>Creator</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {data?.content.map(bp => (
            <tr key={bp.id} className="border-b last:border-0">
              <td className="p-2">{bp.name}</td>
              <td className="text-center">{bp.creators[0]?.name}</td>
              <td className="text-center"><StatusBadge status={bp.status} /></td>
              <td className="text-center">
                <Link to={`/management/${bp.id}/review`} className="text-blue-600">Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: ReviewActions**

```tsx
// components/management/ReviewActions.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mgmtApi } from '../../api/management';
import type { BestPractice } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function ReviewActions({ bp }: { bp: BestPractice }) {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user)!;
  const [comment, setComment] = useState('');
  const isSelf = bp.creators.some(c => c.id === user.id);
  const refresh = () => qc.invalidateQueries({ queryKey: ['mgmt-detail', bp.id] });

  const approve = useMutation({ mutationFn: () => mgmtApi.approve(bp.id), onSuccess: refresh });
  const reject  = useMutation({ mutationFn: () => mgmtApi.reject (bp.id, comment), onSuccess: refresh });
  const close   = useMutation({ mutationFn: () => mgmtApi.close  (bp.id, comment), onSuccess: refresh });

  if (bp.status === 'REQUESTED') {
    return (
      <div className="space-y-3">
        <button onClick={() => approve.mutate()} disabled={isSelf}
                title={isSelf ? 'Cannot approve your own BP' : ''}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Approve</button>
        <textarea className="border rounded w-full p-2" placeholder="Reject comment (required)"
                  value={comment} onChange={e => setComment(e.target.value)} />
        <button onClick={() => reject.mutate()} disabled={!comment.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">Reject</button>
      </div>
    );
  }
  if (bp.status === 'PUBLISHED') {
    return (
      <div className="space-y-3">
        <textarea className="border rounded w-full p-2" placeholder="Close reason (required)"
                  value={comment} onChange={e => setComment(e.target.value)} />
        <button onClick={() => close.mutate()} disabled={!comment.trim()}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50">Close</button>
      </div>
    );
  }
  return <p className="text-sm text-gray-500">No actions available for status {bp.status}.</p>;
}
```

- [ ] **Step 4: ReviewPage**

```tsx
// pages/ReviewPage.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mgmtApi } from '../api/management';
import ReviewActions from '../components/management/ReviewActions';
import StatusBadge from '../components/shared/StatusBadge';
import TypeBadge   from '../components/shared/TypeBadge';

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bp } = useQuery({ queryKey: ['mgmt-detail', id], queryFn: () => mgmtApi.detail(id!), enabled: !!id });
  const { data: history } = useQuery({ queryKey: ['mgmt-reviews', id], queryFn: () => mgmtApi.reviews(id!), enabled: !!id });

  if (!bp) return <p>Loading…</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded shadow p-4">
        <div className="flex gap-2 mb-2"><TypeBadge type={bp.type} /><StatusBadge status={bp.status} /></div>
        <h1 className="text-xl font-bold">{bp.name}</h1>
        <p className="text-gray-600">{bp.description}</p>
        <p className="mt-2 text-sm">Creators: {bp.creators.map(c => c.name).join(', ')}</p>
        {bp.keyValue && <pre className="mt-3 bg-yellow-50 border border-yellow-200 p-2 text-sm">{bp.keyValue}</pre>}
        <h3 className="mt-4 font-semibold">Installation Guide</h3>
        <pre className="whitespace-pre-wrap text-sm">{bp.installationGuide}</pre>
        <h3 className="mt-4 font-semibold">Files</h3>
        <ul>{bp.files.map(f => <li key={f.id}>{f.fileName}</li>)}</ul>
        {bp.webContent && <p>Web content: <a className="text-blue-600 underline" href={bp.webContent} target="_blank">{bp.webContent}</a></p>}
      </div>
      <aside className="space-y-4">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Review</h3>
          <ReviewActions bp={bp} />
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">History</h3>
          <ul className="text-sm space-y-2">
            {history?.map(r => (
              <li key={r.id} className="border-b pb-1">
                <strong>{r.action}</strong> · {new Date(r.reviewedAt).toLocaleString()}<br />
                {r.comment && <span className="text-gray-600">{r.comment}</span>}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
```

- [ ] **Step 5: Smoke + commit**

```bash
git add axon-frontend/src/pages/{ManagementPage,ReviewPage}.tsx axon-frontend/src/components/management axon-frontend/src/api/management.ts
git commit -m "feat(fe): management list + review page with approve/reject/close + history"
```

---

### Task 26: Dashboard Page

**Files:**
- Create: `pages/DashboardPage.tsx`
- Create: `components/dashboard/{StatCard.tsx, TopList.tsx}`
- Create: `api/dashboard.ts`

- [ ] **Step 1: dashboard API**

```typescript
// api/dashboard.ts
import api from './client';
import type { DashboardData } from '../types';
export const dashboardApi = {
  get: () => api.get<DashboardData>('/api/v1/dashboard').then(r => r.data),
};
```

- [ ] **Step 2: StatCard + TopList**

```tsx
// components/dashboard/StatCard.tsx
export default function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
```

```tsx
// components/dashboard/TopList.tsx
export default function TopList<T>({ title, items, render }:
    { title: string; items: T[]; render: (item: T, idx: number) => React.ReactNode }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <ol className="text-sm space-y-1">
        {items.map((it, i) => <li key={i}>{render(it, i)}</li>)}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: DashboardPage**

```tsx
// pages/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import StatCard from '../components/dashboard/StatCard';
import TopList  from '../components/dashboard/TopList';

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get, staleTime: 5*60*1000 });
  if (!data) return <p>Loading…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Submitters"     value={data.totalSubmitters} />
        <StatCard label="Total BPs"      value={data.totalBps} />
        <StatCard label="Published"      value={data.byStatus.published} />
        <StatCard label="Requested"      value={data.byStatus.requested} />
        <StatCard label="Rejected"       value={data.byStatus.rejected} />
        <StatCard label="Closed"         value={data.byStatus.closed} />
        <StatCard label="Jobs"           value={data.totalJobs} />
        <StatCard label="AI Capabilities" value={data.totalAiCapabilities} />
        <StatCard label="Departments"    value={data.totalDepartments} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopList title="Top 5 Creators" items={data.topCreators}
                 render={(c, i) => <span>{i+1}. {c.user.name} — {c.publishedCount} BPs</span>} />
        <TopList title="Top 5 Works"    items={data.topWorks}
                 render={(w, i) => <span>{i+1}. {w.work.name} ({w.work.workCategory.name}) — {w.bpCount}</span>} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add axon-frontend/src/pages/DashboardPage.tsx axon-frontend/src/components/dashboard axon-frontend/src/api/dashboard.ts
git commit -m "feat(fe): dashboard page — stats cards + top 5 creators/works"
```

---

### Task 27: Admin Users + Admin Lookups

**Files:**
- Create: `pages/admin/{AdminUsersPage.tsx, AdminLookupsPage.tsx}`
- Create: `components/admin/{UserRow.tsx, LookupTable.tsx}`
- Create: `api/admin.ts`

- [ ] **Step 1: admin API**

```typescript
// api/admin.ts
import api from './client';
import type { PagedResponse, UserRole } from '../types';

export interface AdminUser { id: string; email: string; name: string; cipId?: string; role: UserRole; departmentName?: string; createdAt: string; }

export const adminApi = {
  users: (params: URLSearchParams) => api.get<PagedResponse<AdminUser>>('/api/v1/admin/users', { params }).then(r => r.data),
  updateRole: (id: string, role: UserRole) => api.put<AdminUser>(`/api/v1/admin/users/${id}/role`, { role }).then(r => r.data),

  // generic CRUD for a lookup
  listLookup: (kind: string) => api.get<any[]>(`/api/v1/admin/${kind}`).then(r => r.data),
  createLookup: (kind: string, body: any) => api.post(`/api/v1/admin/${kind}`, body).then(r => r.data),
  updateLookup: (kind: string, id: string, body: any) => api.put(`/api/v1/admin/${kind}/${id}`, body).then(r => r.data),
  deleteLookup: (kind: string, id: string) => api.delete(`/api/v1/admin/${kind}/${id}`),
};
```

- [ ] **Step 2: AdminUsersPage**

```tsx
// pages/admin/AdminUsersPage.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import type { UserRole } from '../../types';

const ROLES: UserRole[] = ['USER','AX_CREATOR','AX_SUPPORTER','ADMIN'];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const params = new URLSearchParams(); if (search) params.set('search', search);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-users', search], queryFn: () => adminApi.users(params) });
  const update = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => adminApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div>
      <input className="border rounded px-2 py-1 mb-4" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="border-b"><tr><th className="text-left p-2">Name</th><th>Email</th><th>CIP</th><th>Department</th><th>Role</th></tr></thead>
        <tbody>
          {data?.content.map(u => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="p-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.cipId ?? '—'}</td>
              <td>{u.departmentName ?? '—'}</td>
              <td>
                <select value={u.role} onChange={e => update.mutate({ id: u.id, role: e.target.value as UserRole })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: AdminLookupsPage (tabbed CRUD)**

```tsx
// pages/admin/AdminLookupsPage.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

const LOOKUPS = [
  { kind: 'jobs',            label: 'Jobs',            extra: false },
  { kind: 'ai-capabilities', label: 'AI Capabilities', extra: false },
  { kind: 'work-categories', label: 'Work Categories', extra: false },
  { kind: 'works',           label: 'Works',           extra: true  },   // needs workCategoryId
  { kind: 'departments',     label: 'Departments',     extra: false },
  { kind: 'ai-tools',        label: 'AI Tools',        extra: false },
];

export default function AdminLookupsPage() {
  const [kind, setKind] = useState(LOOKUPS[0].kind);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['lookup', kind], queryFn: () => adminApi.listLookup(kind) });
  const create = useMutation({
    mutationFn: (body: any) => adminApi.createLookup(kind, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookup', kind] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminApi.deleteLookup(kind, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lookup', kind] }),
    onError: (err: any) => alert(err.response?.data?.message ?? 'Delete failed'),
  });

  const meta = LOOKUPS.find(l => l.kind === kind)!;
  const [newName, setNewName] = useState('');
  const [order,   setOrder]   = useState(0);
  const [workCategoryId, setWorkCategoryId] = useState('');

  const submit = () => {
    const body: any = { name: newName, displayOrder: order };
    if (meta.extra) body.workCategoryId = workCategoryId;
    create.mutate(body); setNewName(''); setOrder(0); setWorkCategoryId('');
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {LOOKUPS.map(l => (
          <button key={l.kind} onClick={() => setKind(l.kind)}
                  className={`px-3 py-1 rounded text-sm ${kind === l.kind ? 'bg-blue-600 text-white' : 'border'}`}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2">
        <input className="border rounded px-2 py-1 flex-1" placeholder="Name"
               value={newName} onChange={e => setNewName(e.target.value)} />
        <input className="border rounded px-2 py-1 w-24" type="number" placeholder="Order"
               value={order} onChange={e => setOrder(Number(e.target.value))} />
        {meta.extra && (
          <input className="border rounded px-2 py-1 w-64" placeholder="WorkCategory UUID"
                 value={workCategoryId} onChange={e => setWorkCategoryId(e.target.value)} />
        )}
        <button onClick={submit} className="px-4 py-1 bg-blue-600 text-white rounded">Add</button>
      </div>

      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="border-b"><tr><th className="text-left p-2">Name</th><th>Display Order</th><th># BPs</th><th>Action</th></tr></thead>
        <tbody>
          {data?.map((item: any) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="p-2">{item.name}</td>
              <td className="text-center">{item.displayOrder ?? '—'}</td>
              <td className="text-center">{item.bpCount ?? '—'}</td>
              <td className="text-center">
                <button disabled={item.bpCount > 0}
                        onClick={() => confirm('Delete?') && del.mutate(item.id)}
                        className="text-red-600 disabled:opacity-30">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add axon-frontend/src/pages/admin/ axon-frontend/src/api/admin.ts
git commit -m "feat(fe): admin pages — users role management + lookup CRUD (6 taxonomies)"
```

---

## Phase 10 — Integration & Verification

### Task 28: End-to-End Smoke Test

**Files:**
- Create: `axon-backend/Dockerfile`
- Create: `axon-frontend/Dockerfile`
- Modify: `docker-compose.yml` (add backend + frontend services)
- Create: `e2e/smoke.md` (manual checklist)

- [ ] **Step 1: Dockerfiles**

```dockerfile
# axon-backend/Dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]
```

```dockerfile
# axon-frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

```nginx
# axon-frontend/nginx.conf
server {
  listen 80;
  location / { try_files $uri /index.html; }
  location /api  { proxy_pass http://axon-backend:8080; }
  location /auth { proxy_pass http://axon-backend:8080; }
}
```

- [ ] **Step 2: Extend docker-compose.yml**

```yaml
  axon-backend:
    build: ./axon-backend
    ports: ["8080:8080"]
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
      MINIO_ENDPOINT: http://minio:9000
      JWT_SECRET: dev-secret-key-minimum-256-bits-long-do-not-use-prod!!
      SMTP_HOST: mailhog
      SMTP_PORT: 1025
      SPRING_PROFILES_ACTIVE: dev
    depends_on: [postgres, redis, minio, mailhog]

  axon-frontend:
    build: ./axon-frontend
    ports: ["5173:80"]
    depends_on: [axon-backend]
```

- [ ] **Step 3: Smoke checklist `e2e/smoke.md`**

```markdown
# AXon Smoke Test

## Setup
- [ ] `docker compose up --build` brings everything up
- [ ] http://localhost:5173 loads Library page
- [ ] http://localhost:8025 (MailHog) reachable

## Auth
- [ ] Click Login → redirected through mock SSO → user appears in header
- [ ] Refresh page → still logged in (refresh token in storage)

## Admin Setup
- [ ] Promote dev user to ADMIN via DB: UPDATE users SET role='ADMIN';
- [ ] Re-login → "Users" + "Taxonomy" links appear

## Register BP
- [ ] /register → 4-step wizard, submit WEB BP → status=REQUESTED in My BPs
- [ ] Resubmit a TOOL BP with file upload → 201, file appears

## Review Workflow
- [ ] Promote a second user to AX_SUPPORTER
- [ ] Open Management → REQUESTED tab → Approve → status=PUBLISHED in Library
- [ ] Approve self → blocked with 403 SELF_APPROVE_NOT_ALLOWED
- [ ] Reject without comment → 400; reject with comment → REJECTED; email visible in MailHog
- [ ] AX Creator edits rejected → status REQUESTED → resubmit → PUBLISHED

## Interactions
- [ ] Detail page view++ on every refresh
- [ ] Like toggle increments/decrements
- [ ] Submit feedback → appears below

## Close
- [ ] Supporter Close PUBLISHED BP with reason → status CLOSED, hidden from library, email sent

## Edit Published
- [ ] Creator edits PUBLISHED BP → status flips to REQUESTED, hidden from library, requires re-review

## Lookups
- [ ] Admin adds a new Job → Library FilterPanel shows it
- [ ] Admin tries to delete a Job referenced by a BP → 409 LOOKUP_IN_USE

## Dashboard
- [ ] /dashboard shows stats matching DB counts; top 5 creators/works render
- [ ] Cache works (changes only reflect after 15 min OR after explicit Redis flush)
```

- [ ] **Step 4: Run through smoke checklist**

Walk every item. Fix issues as found; recommit. Do not declare done until checklist is fully green.

- [ ] **Step 5: Final commit**

```bash
git add axon-backend/Dockerfile axon-frontend/Dockerfile axon-frontend/nginx.conf docker-compose.yml e2e/smoke.md
git commit -m "chore: dockerize + e2e smoke checklist"
```

---

## Coverage Map (FR → Task)

| FR | Task(s) |
|---|---|
| FR-AUTH-01..05 | Task 4 (SSO + JWT + Mock provider) |
| FR-LIB-01, FR-LIB-02 (View list BP) | Task 9 (browse) + Task 21 (Library page) |
| FR-LIB-03..08 (Register) | Task 8 (BP create) + Task 11 (files) + Task 23 (FE wizard) |
| FR-LIB-09..12 (Detail + key mask) | Task 10 (detail) + Task 7 (mapper) + Task 22 (FE detail) |
| FR-LIB-13, FR-LIB-14 (Like) | Task 15 + Task 22 |
| FR-LIB-15..18 (Filter/Sort/Search) | Task 7 (specs) + Task 9 + Task 21 |
| FR-LIB-19..21 (Edit) | Task 8 (update with state rules) + Task 12 (submit) + Task 23 |
| FR-LIB-22..23 (Delete) | Task 8 + Task 24 |
| FR-LIB-24..25 (My BPs + analytics) | Task 10 (my list) + Task 16 (analytics) + Task 24 |
| FR-MGT-01..07 | Task 14 (approve/reject/close + history) + Task 25 (FE) |
| FR-FB-01..03 (Feedback) | Task 15 + Task 22 |
| FR-DASH-01..06 | Task 17 + Task 26 |
| FR-LOOKUP-01..06 | Task 5 + Task 6 (BE) + Task 27 (FE) |
| Notification (workflow emails) | Task 13 |
| Event tracking (view, like, download counters + bp_likes/bp_downloads/bp_feedback) | Tasks 10, 11, 15 |

---

## Self-Review Checklist (post-execution)

- [ ] Every FR has at least one task implementing it (see Coverage Map)
- [ ] No placeholders (`TBD`, `// implement later`, "similar to") — all steps contain concrete code
- [ ] Type names consistent across BE↔FE: `BestPracticeListItem`, `BestPracticeResponse`, `LookupRef`, `WorkRef`, `CreatorRef`
- [ ] Endpoint paths match DLD §3 exactly
- [ ] Status names match: `REQUESTED | REJECTED | PUBLISHED | CLOSED`
- [ ] Role names match: `USER | AX_CREATOR | AX_SUPPORTER | ADMIN`
- [ ] BP type names match: `WEB | TOOL | EXTENSION`
- [ ] All migrations applied in order V1→V10
- [ ] Self-approve check in `ManagementService.approve` (Task 14)
- [ ] Key masking in `BestPracticeMapper.toResponse` (Task 7)
- [ ] Edit PUBLISHED BP → REQUESTED + clear `publishedAt` (Task 8 update + Task 12 submit)
- [ ] Delete blocked for PUBLISHED/CLOSED (Task 8)
- [ ] Delete lookup blocked when referenced (Task 6 `ConflictException`)
- [ ] WEB type validates 256-char limit; TOOL/EXTENSION validates 50MB (Task 8 + Task 11)
- [ ] Notification fires on approve/reject/close (Task 14 + Task 13)
- [ ] Dashboard cached 15 min in Redis (Task 17)

---

## Execution Notes

- Run TDD steps strictly: write failing test → see it fail → minimal impl → see green → commit.
- For Spring Boot integration tests, share one Testcontainers PostgreSQL instance via `@DynamicPropertySource` for speed.
- When skipping a Should-priority feature (e.g., review history UI), document the gap in the commit message rather than leaving stub code.
- For UI work, run `npm run dev` and click through the feature in the browser before marking the task complete (golden path + 1 edge case).
- Verification before completion: never say "done" — show the test output, the manual click-through result, or the screenshot.






