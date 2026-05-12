# AXon — Implementation Plan v2.0

**Version:** 2.0
**Date:** 2026-05-12
**Dựa trên:** requirements v2.0, HLD v2.0, DLD v2.0

---

## Tổng quan Phases

| Phase | Nội dung | Output kiểm tra được |
|-------|----------|---------------------|
| P0 | Project setup, Docker Compose, DB migrations baseline | App khởi động được |
| P1 | Auth mock (JWT local), Spring Security, RBAC guards | Tất cả endpoints có auth |
| P2 | Master data CRUD (Admin) | Admin quản lý được Job/WorkCategory/Work/AICapability |
| P3 | BP Library — CRUD + file upload | Creator đăng ký BP, user xem library |
| P4 | BP Lifecycle — submit/review/approve/reject/close/edit | Toàn bộ workflow BP |
| P5 | My Practice — view list, edit, delete | Creator quản lý BP của mình |
| P6 | Interactions — like, feedback, download tracking | Engagement features |
| P7 | Dashboard & monitoring | Dashboard đầy đủ metrics |
| P8 | User Management (Admin) — assign role | Admin quản lý role người dùng |
| P9 | FE hoàn thiện — i18n EN/VI, responsive, AI Insight page | FE production-ready |
| P10 | NFR — performance test, CI/CD, Swagger, SonarQube | Non-functionals pass |
| P11 | Auth thật — Samsung CIP/AD SSO integration | SSO login hoạt động |

---

## P0 — Project Setup

**Mục tiêu:** Môi trường dev chạy được, DB schema baseline, app khởi động không lỗi.

### P0-BE-01: Khởi tạo Spring Boot project

- Spring Boot 3 + Java 21
- Dependencies: Spring Web, Spring Data JPA, Spring Security, Flyway, Redis, Lombok, Validation, Actuator, Swagger (springdoc-openapi)
- `application.yml`: profile `dev` với PostgreSQL, Redis, JWT secret placeholder, file upload path `/app/uploads`
- Health check: `GET /actuator/health`

### P0-BE-02: Docker Compose setup

```yaml
# docker-compose.yml
services:
  axon-backend:
    build: ./axon-backend
    ports: ["8080:8080"]
    volumes:
      - uploads:/app/uploads
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/axon
      SPRING_REDIS_HOST: redis
    depends_on: [postgres, redis]

  axon-frontend:
    build: ./axon-frontend
    ports: ["5173:5173"]
    depends_on: [axon-backend]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: axon
      POSTGRES_USER: axon
      POSTGRES_PASSWORD: axon_dev
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
  uploads:
```

### P0-BE-03: Flyway migrations baseline

Tạo các file migration theo thứ tự:
- `V1__create_lookup_tables.sql` — jobs, ai_capabilities, work_categories, works
- `V2__create_users.sql` — users table, user_role enum
- `V3__create_best_practices.sql` — best_practices, bp_status enum, bp_type enum
- `V4__create_junction_tables.sql` — bp_creators, bp_jobs, bp_ai_capabilities
- `V5__create_bp_files.sql` — bp_files table
- `V6__create_interactions.sql` — bp_likes, bp_feedback, bp_downloads
- `V7__create_reviews.sql` — bp_reviews, review_action enum
- `V8__seed_data.sql` — seed 4 jobs, 5 ai_capabilities (is_default=true)

DDL theo schema đã định nghĩa trong DLD §1.2.

### P0-FE-01: Khởi tạo React project

- Vite + React 18 + TypeScript
- TailwindCSS, Zustand, TanStack Query, Axios, React Router v6
- Cấu trúc thư mục:
  ```
  src/
  ├── api/          -- axios instance + API functions
  ├── components/   -- shared UI components
  ├── hooks/        -- custom hooks
  ├── pages/        -- page components (route-level)
  ├── store/        -- Zustand stores
  └── types/        -- TypeScript types
  ```
- Placeholder routes: `/library`, `/my-practice`, `/manage`, `/dashboard`, `/admin`

**Commit:** `feat: project setup — Spring Boot 3, React 18, Docker Compose, Flyway baseline`

---

## P1 — Auth Mock

**Mục tiêu:** Tất cả endpoints có JWT auth; có thể test với các role khác nhau mà không cần CIP/AD thật.

### P1-BE-01: JWT Service

- `JwtService`: generate + validate access token (15m) và refresh token (7d)
- Secret từ `application.yml` (dev hardcode; prod env var)
- Payload: `{ sub: userId, role: USER|AX_CREATOR|AX_SUPPORTER|ADMIN, iat, exp }`

### P1-BE-02: Mock SSO + Auth endpoints

- `MockSSOProvider`: trả về hardcoded users (1 per role) dựa vào query param `?user=user1|creator1|supporter1|admin1`
- `POST /auth/login?user=creator1` → upsert user → issue JWT pair
- `POST /auth/refresh` → validate refresh token → issue new access token
- `POST /auth/logout` → invalidate refresh token (Redis)
- `GET /auth/me` → trả về current user info

Hardcoded users:

| param | email | role |
|-------|-------|------|
| `user1` | user1@samsung.com | USER |
| `creator1` | creator1@samsung.com | AX_CREATOR |
| `supporter1` | supporter1@samsung.com | AX_SUPPORTER |
| `admin1` | admin1@samsung.com | ADMIN |

### P1-BE-03: Spring Security config

- `JwtAuthFilter` (OncePerRequestFilter): đọc `Authorization: Bearer` → validate → set SecurityContext
- `SecurityConfig`: permit `/auth/**` và `GET /api/v1/best-practices` (public browse); authenticate everything else
- RBAC helper: `@PreAuthorize("hasRole('ADMIN')")` etc.

### P1-FE-01: Auth store + Axios interceptor

- Zustand `authStore`: `{ user, accessToken, setTokens, logout }`
- Axios interceptor: gắn `Authorization: Bearer` vào mọi request; auto refresh khi 401

### P1-FE-02: Login page + Route guard

- `/login` page: buttons "Login as User / Creator / Supporter / Admin" (mock)
- `PrivateRoute` component: redirect `/login` nếu chưa auth
- `RoleRoute` component: hiển thị 403 nếu không đủ quyền

**Commit:** `feat: auth mock — JWT, MockSSO, Spring Security RBAC, FE login`

---

## P2 — Master Data (Admin)

**Mục tiêu:** Admin có thể CRUD Job, WorkCategory, Work, AICapability qua giao diện.

### P2-BE-01: Job CRUD

- Entity `Job` (id, name, description, createdAt)
- `JobController`: `GET/POST/PUT/DELETE /api/v1/admin/master-data/jobs`
- `JobService`: create (check unique name), update, delete (check no WorkCategory references), list
- Validation: name ≤ 256, description ≤ 4096

### P2-BE-02: WorkCategory CRUD

- Entity `WorkCategory` (id, jobId, name, description)
- `WorkCategoryController`: `GET?jobId=`, `POST`, `PUT/:id`, `DELETE/:id`
- `WorkCategoryService`: delete checks no Work references; unique (jobId, name)

### P2-BE-03: Work CRUD

- Entity `Work` (id, jobId, workCategoryId, name, code, description)
- `WorkController`: `GET?workCategoryId=`, `POST`, `PUT/:id`, `DELETE/:id`
- `WorkService`: delete checks no BP references; code unique globally

### P2-BE-04: AICapability CRUD

- Entity `AiCapability` (id, name, isDefault)
- `AiCapabilityController`: `GET`, `POST`, `PUT/:id`, `DELETE/:id`
- `AiCapabilityService`: không xóa được nếu `is_default=true` hoặc có BP reference

### P2-BE-05: Bulk upload (Excel/CSV) cho Job, WorkCategory, Work

- `POST /api/v1/admin/master-data/jobs/upload` (MultipartFile)
- Parse CSV/Excel bằng Apache POI hoặc OpenCSV
- Return: `{ imported: N, skipped: M, errors: [{ row, reason }] }`
- WorkCategories và Works upload: same pattern

### P2-FE-01: Admin Master Data pages

- `/admin/master-data/jobs` — table CRUD + upload button
- `/admin/master-data/work-categories` — filter by job; table CRUD
- `/admin/master-data/works` — filter by job → work category; table CRUD
- `/admin/master-data/ai-capabilities` — table CRUD; default items không có delete button

**Test:** Unit test `JobService.delete` khi có WorkCategory reference → throw exception.

**Commit:** `feat: master data CRUD — Job, WorkCategory, Work, AICapability (Admin)`

---

## P3 — BP Library (CRUD + File Upload)

**Mục tiêu:** Creator đăng ký BP; User xem library; file upload vào Docker volume.

### P3-BE-01: File upload/download service

- `FileService.upload(MultipartFile, bpId)`:
  - Validate: size ≤ 50MB, mime type allowed
  - Save to: `{volumeBasePath}/{bpId}/{UUID}_{originalFilename}`
  - Persist `BpFile` entity với `file_path`
- `FileService.download(fileId)`:
  - Load `BpFile`, stream file từ `file_path`
  - Throw `FileNotFoundException` nếu không tồn tại
- `FileController`: `POST /api/v1/best-practices/:id/files`, `GET .../files/:fileId/download` (stream)

### P3-BE-02: BP CRUD

- Entity `BestPractice` với tất cả fields theo DLD §1.2
- `BestPracticeService.create(request, currentUser)`:
  - Validate fields
  - Tạo BP với status=REQUESTED
  - Auto-promote submitter USER → AX_CREATOR nếu cần
  - Associate creators, ai_capabilities
- `BestPracticeService.findAll(filter, pageable)`: chỉ trả PUBLISHED; support filter/sort
- `BestPracticeService.findById(id, currentUser)`: tăng view_count async; mask key_value nếu role=USER
- `BestPracticeController`: `GET /api/v1/best-practices`, `GET /:id`, `POST`

### P3-FE-01: Library page

- `/library` — grid card view; filter sidebar (job, AI capability, type, work, department...); sort dropdown
- Card component: thumbnail, name, description (truncated 200 chars), work, creator chips
- Pagination (page size 20)

### P3-FE-02: Register BP form

- `/my-practice/new`
- Multi-step form hoặc single long form
- Fields: name, description, installation_guide, work (Job→WorkCategory→Work selector), AI capability, AI tools (text), BP type
- Conditional: type=WEB → URL input; type=TOOL/EXTENSION → file upload (max 50MB, progress bar)
- Additional creators: search users by name

### P3-FE-03: BP Detail page

- `/library/:id` — full detail; like button; download button; feedback section

**Test:** `FileService.upload` với file > 50MB → throw `FileSizeLimitException`.

**Commit:** `feat: BP library — CRUD, file upload Docker volume, library page, register form`

---

## P4 — BP Lifecycle

**Mục tiêu:** Toàn bộ workflow: submit → review → approve/reject → edit → resubmit → close.

### P4-BE-01: Edit BP với 3-case status logic

- `BestPracticeService.update(id, request, currentUser)`:
  - status=REQUESTED: update, giữ status
  - status=REJECTED: update bất kỳ → status=REQUESTED
  - status=PUBLISHED + thay đổi web_content hoặc files → status=REQUESTED (BP ẩn khỏi library)
  - status=PUBLISHED + không thay đổi web_content/files → giữ PUBLISHED
- Detection "có thay đổi file": so sánh danh sách file mới với file cũ

### P4-BE-02: Management endpoints (Supporter)

- `ManagementService.approve(bpId, reviewerId, comment)`:
  - Validate status=REQUESTED
  - Self-approve check: reviewerId không được có trong bp_creators
  - status → PUBLISHED; persist BpReview(action=APPROVED)
  - Email notify creator (async)
- `ManagementService.reject(bpId, reviewerId, comment)`:
  - status → REJECTED; persist BpReview(action=REJECTED, comment)
  - Email notify
- `ManagementService.close(bpId, reviewerId, reason)`:
  - Validate status=PUBLISHED
  - status → REJECTED; close_reason populated; persist BpReview(action=CLOSED)
  - Email notify

Note: BP status chỉ có 3 giá trị: REQUESTED / PUBLISHED / REJECTED. Action "close" đặt status=REJECTED; phân biệt close vs review-reject bằng `bp_reviews.action` (CLOSED vs REJECTED).

### P4-BE-03: Management list endpoint

- `GET /api/v1/management/best-practices`
- Filter: status, type, job, AI capability
- Sort: submittedDate asc (default để review cũ trước)
- Trả về tất cả statuses (không chỉ REQUESTED)

### P4-FE-01: Management page (Supporter)

- `/manage` — table với filter; action buttons (Review / Close)
- Review popup: textarea comment, Approve/Reject buttons
- Close popup: textarea reason, Confirm button

**Test:** `ManagementService.approve` khi reviewer là creator của BP → throw `SelfApproveException`.

**Commit:** `feat: BP lifecycle — edit 3-case logic, approve/reject/close, management page`

---

## P5 — My Practice

**Mục tiêu:** Creator xem và quản lý danh sách BP của mình.

### P5-BE-01: My BPs endpoint

- `GET /api/v1/my-best-practices`
- Filter: status; tất cả statuses; chỉ BP mà current user là creator
- Response columns: thumbnail, name, type, status, job, ai_capability, submitter, submitted_date, comment (từ bp_reviews cuối cùng)

### P5-FE-01: My Practice page

- `/my-practice` — table view
- Status badge: REQUESTED (yellow), PUBLISHED (green), REJECTED (red)
  - REJECTED badge có tooltip: "Rejected by review" hoặc "Closed by supporter" tùy `bp_reviews.action`
- Column "comment": lấy comment từ review gần nhất
- Action edit: redirect đến edit form
- Action delete: show popup confirm, DELETE request

### P5-FE-02: Edit BP form

- Tái sử dụng Register form; prefill data từ BP hiện tại
- Hiển thị banner info theo status (e.g., "Editing PUBLISHED BP: only changing file will trigger re-review")

**Commit:** `feat: my practice — list, edit form reuse, delete with confirm`

---

## P6 — Interactions (Like, Feedback, Download)

**Mục tiêu:** User like BP, để lại feedback, tải file; counts hiển thị đúng.

### P6-BE-01: Like toggle

- `InteractionService.toggleLike(bpId, userId)`:
  - Nếu bp_likes có record → xóa, giảm like_count
  - Nếu không → thêm, tăng like_count
  - Atomic: `@Transactional` + UPDATE ... SET like_count = like_count ± 1
- `POST /api/v1/best-practices/:id/like`

### P6-BE-02: Feedback

- `POST /api/v1/best-practices/:id/feedback` — body: `{ content: string (max 2000) }`; BP phải PUBLISHED
- `GET /api/v1/best-practices/:id/feedback` — paginated (page, size)

### P6-BE-03: Download tracking (async)

- Sau khi stream file thành công → async log `BpDownload` + tăng `download_count`

### P6-FE-01: Like button + feedback section trong Detail page

- Like button: heart icon, count, đổi trạng thái optimistically
- Feedback: textarea + submit; paginated list bên dưới

**Commit:** `feat: interactions — like toggle, feedback, download tracking`

---

## P7 — Dashboard & Monitoring

**Mục tiêu:** Dashboard hiển thị đầy đủ metrics cho tất cả roles.

### P7-BE-01: Dashboard service

- `DashboardService.getStats(startDate, endDate)`:
  - `total_submitters`: COUNT DISTINCT creators với ít nhất 1 published BP (filtered by date)
  - `total_published_bps`: COUNT WHERE status=PUBLISHED
  - `by_job`: GROUP BY job
  - `by_ai_capability`: GROUP BY ai_capability
  - `by_department`: GROUP BY users.department (string từ CIP/AD; P1-P10 dùng hardcoded)
  - `top5_bps_by_work`: COUNT BPs per work, top 5
  - `total_usage`: COUNT downloads WHERE date IN range
  - `active_users`: COUNT DISTINCT user_id FROM bp_downloads WHERE date IN range
  - `usage_trend`: GROUP BY month (default 6 tháng gần nhất)
  - `top5_usage`: top 5 BPs by download_count
- Cache Redis TTL 15 phút; invalidate khi có approve/reject/close event

### P7-BE-02: Dashboard controller

- `GET /api/v1/dashboard?startDate=&endDate=`
- Auth: tất cả roles (USER, AX_CREATOR, AX_SUPPORTER, ADMIN)

### P7-FE-01: Dashboard page

- `/dashboard` — summary cards + charts (dùng Recharts hoặc Chart.js)
- Charts: bar chart by_job, pie chart by_ai_capability, line chart usage_trend
- Top 5 tables: clickable rows → redirect Library với filter pre-applied
- Date range filter (date picker)

**Commit:** `feat: dashboard — metrics aggregation, Redis cache, charts FE`

---

## P8 — User Management (Admin)

**Mục tiêu:** Admin assign role AX_SUPPORTER hoặc ADMIN cho user.

### P8-BE-01: User management endpoints

- `GET /api/v1/admin/users?search=&role=&page=&size=`
- `PUT /api/v1/admin/users/:id/role` — body: `{ role: "AX_SUPPORTER" | "ADMIN" }`
- Validation: chỉ cho phép set AX_SUPPORTER hoặc ADMIN; AX_CREATOR là auto-assigned khi tạo BP đầu tiên

### P8-FE-01: User Management page

- `/admin/users` — searchable table; role dropdown per row; confirm dialog khi đổi role

**Commit:** `feat: user management — admin assign role page`

---

## P9 — FE Hoàn thiện

**Mục tiêu:** i18n EN/VI, responsive, accessibility WCAG 2.1 AA, AI Insight page.

### P9-FE-01: i18n

- Dùng `react-i18next`
- Tạo `en.json` và `vi.json` cho tất cả text
- Language switcher component trong navbar

### P9-FE-02: Responsive

- Breakpoints: mobile (< 768px), tablet (768–1280px), desktop (> 1280px)
- Library grid: 1 col mobile / 2 col tablet / 3–4 col desktop
- Tables: horizontal scroll trên mobile

### P9-FE-03: Accessibility

- ARIA labels trên buttons, form fields, modals
- Keyboard navigation (Tab order, Enter/Escape cho modals)
- Contrast ratio ≥ 4.5:1 cho text
- Skip to main content link

### P9-FE-04: AI Insight page

- `GET /api/v1/ai-insight` → render 5 capability cards
- Mỗi card: tên, mô tả, embodiments list, scope

**Commit:** `feat: FE polish — i18n EN/VI, responsive, WCAG AA, AI Insight page`

---

## P10 — NFR & Quality

**Mục tiêu:** Performance test pass, CI/CD setup, Swagger, SonarQube.

### P10-01: Swagger / OpenAPI

- Thêm `@Operation`, `@Parameter`, `@ApiResponse` vào tất cả controllers
- Verify `GET /swagger-ui.html` có đủ 100% endpoints

### P10-02: JaCoCo + SonarQube

- Cấu hình JaCoCo trong `pom.xml`
- Minimum coverage: 70% line coverage
- SonarQube analysis trong CI

### P10-03: GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21' }
      - run: ./mvnw test jacoco:report
      - run: ./mvnw sonar:sonar
  build-fe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build
```

### P10-04: Performance test (k6)

```javascript
// k6/library-load-test.js
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  vus: 200,
  duration: '30s',
  thresholds: { 'http_req_duration': ['p(95)<3000'] }
};
export default function () {
  const res = http.get('http://localhost:8080/api/v1/best-practices');
  check(res, { 'status 200': (r) => r.status === 200 });
}
```

- Chạy: `k6 run k6/library-load-test.js`
- Kết quả mong đợi: p95 < 3000ms với 200 VUs

**Commit:** `feat: NFR — Swagger, JaCoCo, GitHub Actions CI, k6 performance test`

---

## P11 — Auth thật (Samsung CIP/AD SSO)

**Mục tiêu:** Login thật qua Samsung CIP/AD OAuth 2.0/SSO; department tự động map từ CIP/AD profile.

### P11-BE-01: CIPADProvider implementation

- Implement `SSOProvider` interface:
  - `exchange(code)` → call CIP/AD token endpoint → parse user info (name, email, department, cipId)
- Cấu hình: `spring.security.oauth2.client.*` trong `application-prod.yml`
- Inject bằng Spring profile: `dev` → MockSSOProvider; `prod` → CIPADProvider

### P11-BE-02: Department mapping

- Khi SSO callback, upsert `users.department` từ CIP/AD SRV Group
- Không cần bảng `departments` riêng — lưu thẳng string vào `users.department`
- Dashboard `by_department` group by `users.department` string (hoạt động tự nhiên vì P7 đã dùng users.department)

### P11-BE-03: Session timeout 30 phút

- Access token TTL: 30m (thay vì 15m cho dev)
- FE auto-refresh trước khi hết hạn hoặc logout

### P11-FE-01: Real login flow

- `/login` → `POST /auth/login` → backend redirect CIP/AD
- `/auth/callback` → nhận JWT → store in authStore → redirect `/library`

**Test:** Integration test với MockSSOProvider vẫn pass sau khi thêm CIPADProvider (profile separation).

**Commit:** `feat: SSO CIP/AD integration — OAuth 2.0 login, department mapping, 30m timeout`

---

## Definition of Done

Mỗi phase hoàn thành khi:
- [ ] Tất cả endpoints trả đúng status code và response format
- [ ] Unit tests cho business logic (service layer) pass
- [ ] FE render đúng và không có console error
- [ ] Không có lỗi lint (BE: Checkstyle; FE: ESLint)
- [ ] Committed với message rõ ràng

Plan hoàn thành khi P10 pass và P11 deployed to staging.