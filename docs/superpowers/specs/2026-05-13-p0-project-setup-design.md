# P0 Project Setup — Design Spec

**Date:** 2026-05-13
**Phase:** P0 — Project Setup
**Branch:** claude/setup-project-structure-F1RPi
**Dựa trên:** AXon HLD v2.1, DLD v2.1, Implementation Plan v2.1

---

## Scope

Setup môi trường dev chạy được: Docker Compose, DB schema baseline (Flyway V1–V10), BE skeleton boot được, FE skeleton với routes và types. Không implement business logic.

---

## 1. Infrastructure

### docker-compose.yml
- **PostgreSQL 16-alpine** — port 5432, volume `pgdata`, healthcheck `pg_isready`
- **Redis 7-alpine** — port 6379, healthcheck `redis-cli ping`
- **axon-backend** — build từ `./axon-backend/Dockerfile`, port 8080, volume `axon-uploads:/app/uploads`, depends_on postgres + redis healthy
- **axon-frontend** — build từ `./axon-frontend/Dockerfile`, port 5173, depends_on backend
- **Volumes:** `pgdata`, `axon-uploads` (thay MinIO hoàn toàn)

### Dockerfiles
- **BE:** Multi-stage — `maven:3.9-eclipse-temurin-21-alpine` build, `eclipse-temurin:21-jre-alpine` runtime
- **FE:** `node:20-alpine`, dev mode (`vite --host 0.0.0.0`)

### .gitignore
- Root: loại trừ `axon-uploads/` (Docker volume dữ liệu)
- BE: loại trừ `target/`, `.env`
- FE: loại trừ `node_modules/`, `dist/`, `.env*.local`

---

## 2. Backend (axon-backend)

### pom.xml — dependencies
| Dependency | Version | Ghi chú |
|-----------|---------|---------|
| spring-boot-starter-parent | 3.5.0 | |
| Java | 21 | Virtual threads available |
| spring-boot-starter-web | BOM | |
| spring-boot-starter-data-jpa | BOM | |
| spring-boot-starter-data-redis | BOM | |
| spring-boot-starter-security | BOM | |
| spring-boot-starter-validation | BOM | |
| spring-boot-starter-actuator | BOM | |
| spring-boot-starter-mail | BOM | Email notifications |
| flyway-core + flyway-database-postgresql | BOM | |
| postgresql | BOM | runtime |
| lombok | BOM | optional |
| jjwt-api/impl/jackson | 0.12.6 | JWT |
| springdoc-openapi-starter-webmvc-ui | 2.8.9 | Swagger |
| poi-ooxml | 5.4.1 | Excel upload (P2) |
| opencsv | 5.11.1 | CSV upload (P2) |

### application.yml
- `storage.volume-base-path` — Docker volume mount point (`/app/uploads`)
- `jwt.secret`, `jwt.access-token-ttl: 900`, `jwt.refresh-token-ttl: 604800`
- `spring.servlet.multipart.max-file-size: 50MB`
- Mail config với env vars (`SMTP_HOST`, `SMTP_PORT`)
- Actuator expose: `health`, `info`
- springdoc paths: `/api-docs`, `/swagger-ui.html`

### Package structure — `com.axon`

```
com.axon/
├── AxonBackendApplication.java         @SpringBootApplication @EnableAsync @EnableScheduling
├── config/
│   ├── SecurityConfig.java             P0: permit-all stub; CSRF disabled; STATELESS session
│   ├── StorageConfig.java              @ConfigurationProperties("storage"); mkdir on startup
│   ├── RedisConfig.java                RedisTemplate<String,Object> + Jackson serializer
│   └── AsyncConfig.java                ThreadPoolTaskExecutor bean cho @Async
├── auth/
│   ├── jwt/
│   │   ├── JwtService.java             THẬT: generate/validate access+refresh token (JJWT)
│   │   └── JwtAuthFilter.java          STUB: extends OncePerRequestFilter (P1)
│   ├── sso/
│   │   ├── SSOProvider.java            STUB: interface (P1)
│   │   ├── SSOUserInfo.java            STUB: record (P1)
│   │   └── MockSSOProvider.java        STUB: hardcoded users (P1)
│   ├── AuthController.java             STUB (P1)
│   └── AuthService.java                STUB (P1)
├── user/                               package-info.java only
├── lookup/                             package-info.java only
│   ├── job/
│   ├── aicapability/
│   ├── workcategory/
│   └── work/
├── bestpractice/                       package-info.java only
├── file/                               package-info.java only
├── management/                         package-info.java only
├── interaction/                        package-info.java only
├── analytics/                          package-info.java only
├── dashboard/                          package-info.java only
├── masterdata/                         package-info.java only
├── aiinsight/                          package-info.java only
└── notification/                       package-info.java only
```

---

## 3. Flyway Migrations V1–V10

### Column additions so với DLD gốc

| Table | Thêm column |
|-------|------------|
| `jobs` | `updated_at`, `display_order INT DEFAULT 0`, `is_active BOOLEAN DEFAULT TRUE` |
| `ai_capabilities` | `updated_at`, `display_order INT DEFAULT 0`, `is_active BOOLEAN DEFAULT TRUE` |
| `work_categories` | `updated_at`, `display_order INT DEFAULT 0`, `is_active BOOLEAN DEFAULT TRUE` |
| `works` | `updated_at`, `display_order INT DEFAULT 0`, `is_active BOOLEAN DEFAULT TRUE` |
| `users` | `updated_at`, `last_login_at TIMESTAMP` (nullable) |
| `best_practices` | `submitted_at TIMESTAMP` (nullable) — khi BP → REQUESTED |
| `bp_files` | `uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL` |

### Migration order
```
V1  — lookup tables (jobs, ai_capabilities, work_categories, works)
V2  — users
V3  — best_practices
V4  — junction tables (bp_creators, bp_jobs, bp_ai_capabilities)
V5  — bp_files
V6  — bp_likes
V7  — bp_feedback
V8  — bp_downloads
V9  — bp_reviews (review_action enum: APPROVED, REJECTED, CLOSED)
V10 — seed data (4 jobs, 5 ai_capabilities is_default=true)
```

---

## 4. Frontend (axon-frontend)

### Config files
- `package.json`: React 19, react-router-dom 7, @tanstack/react-query 5, zustand 5, axios 1, TailwindCSS 3, TypeScript ~6, Vite 8
- `vite.config.ts`: proxy `/api` → `http://localhost:8080`
- `tailwind.config.js`: content paths cho `src/**`
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json`

### src/ structure

```
src/
├── types/index.ts          Full types: BPType, BPStatus, UserRole, User, Job, AiCapability,
│                           Work, WorkCategory, BpFile, BestPracticeListItem, BestPractice,
│                           BestPracticeRequest, Feedback, Analytics, PagedResponse,
│                           ReviewAction, BpReview, DashboardStats, AiInsightClassification
├── store/
│   └── authStore.ts        Zustand: {user, accessToken (in-memory), isAuthenticated}
│                           + login/logout/setUser actions
├── api/
│   ├── client.ts           Axios instance; request interceptor (Bearer token);
│                           response interceptor (401 → refresh → retry → logout)
│   └── index.ts            API function stubs (typed, empty implementations)
├── hooks/
│   └── useAuth.ts          useIsCreator(), useIsSupporter(), useIsAdmin()
├── components/
│   └── layout/
│       └── Layout.tsx      Placeholder — <Outlet /> only (P1 sẽ thêm navbar)
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx       Placeholder
│   │   └── AuthCallback.tsx    Placeholder
│   ├── library/LibraryPage.tsx         Placeholder
│   ├── detail/DetailPage.tsx           Placeholder
│   ├── my-practice/MyPracticePage.tsx  Placeholder
│   ├── register/RegisterPage.tsx       Placeholder
│   ├── manage/ManagementPage.tsx       Placeholder
│   ├── dashboard/DashboardPage.tsx     Placeholder
│   └── admin/
│       ├── AdminPage.tsx               Placeholder
│       ├── MasterDataPage.tsx          Placeholder
│       └── UserManagementPage.tsx      Placeholder
├── App.tsx     Routes theo DLD §5.3: RequireAuth + RequireRole wrappers
├── main.tsx    QueryClientProvider + BrowserRouter
└── index.css   Tailwind directives
```

---

## 5. Definition of Done cho P0

- [ ] `docker-compose up` chạy không lỗi
- [ ] `GET /actuator/health` trả 200
- [ ] Flyway migrations chạy thành công (10 migrations applied)
- [ ] `GET /swagger-ui.html` accessible
- [ ] FE dev server khởi động không lỗi TypeScript
- [ ] Không có lỗi lint (BE: compiler warnings; FE: ESLint)

---

## Quyết định kỹ thuật

| Quyết định | Lý do |
|-----------|-------|
| Không dùng MinIO | DLD v2.1 đã đổi sang Docker Volume local filesystem |
| `accessToken` in-memory (không localStorage) | Tránh XSS — refresh token dùng HttpOnly cookie |
| `submitted_at` riêng biệt | Management queue sort theo ngày submit, không phải ngày tạo |
| `is_active` trên lookup tables | Soft-hide items không phá FK references |
| V11 (audit_logs) defer sang P11 | Không cần cho P0–P10, schema sẽ tạo khi implement P11 |
