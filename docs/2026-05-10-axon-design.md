# AXon — AI Best Practice Hub (Design Spec)

**Version:** 2.1
**Date:** 2026-05-12
**Status:** Approved

## Context

Samsung SEV cần một nơi tập trung để chia sẻ và chuẩn hoá các AI best practice nội bộ (skills, MCP configs, rule sets, browser extensions, fine-tuned tools, v.v.). Thông tin hiện phân tán, chưa có quy trình review hay đánh giá chất lượng. AXon giải quyết bài toán: web platform nơi AX Creator đăng ký BP → AX Supporter review → publish → cộng đồng nội bộ sử dụng, để lại feedback, AX Creator tổng hợp để cải thiện. Dashboard cho phép tất cả roles monitor usage.

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                       AXon Platform                              │
│                                                                  │
│   ┌──────────────┐        ┌──────────────────────────────────┐   │
│   │  Frontend    │◄──────►│  Backend API                     │   │
│   │  (React/TS)  │  REST  │  (Java Spring Boot 3 + Java 21)  │   │
│   └──────────────┘        └──────────┬───────────────────────┘   │
│                                      │                           │
│              ┌───────────────────────┼──────────────────────┐    │
│              │                       │                      │    │
│         ┌────▼─────┐         ┌───────▼──────┐    ┌────────┐     │
│         │PostgreSQL│         │ Docker Volume │   │ Redis  │     │
│         │ (Schema +│         │ (file storage)│   │ (cache)│     │
│         │  audit)  │         └──────────────┘    └────────┘     │
│         └──────────┘                                             │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │  CIP/AD (Samsung — external SSO + MFA, P11)             │    │
│   └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

Không còn dùng MinIO/S3 — file lưu trên Docker volume (`/app/uploads`).

---

## 2. Actors và Roles

| Role | Quyền |
|------|-------|
| **USER** | Browse library, xem detail (ẩn key), download file, like, để lại feedback |
| **AX_CREATOR** | Tất cả quyền của USER + đăng ký/edit/delete BP của mình; xem analytics & feedback BP mình; xem key BP mình owner |
| **AX_SUPPORTER** | Tất cả quyền của USER + quản lý BP (review/approve/reject/close); xem key tất cả BPs; xem dashboard; quản lý master data nếu Admin uỷ quyền (mặc định Admin) |
| **ADMIN** | Toàn bộ quyền + quản lý user & role assignment + CRUD master data |

**Role assignment:**
- USER: mặc định khi login CIP/AD lần đầu
- AX_CREATOR: auto promote từ USER khi tạo BP đầu tiên
- AX_SUPPORTER / ADMIN: Admin assign qua `/admin/users`

---

## 3. BP Types

| Type | Nội dung | Constraint |
|------|----------|-----------|
| `WEB` | Text URL hoặc config text | ≤ 256 ký tự |
| `TOOL` | Upload file | ≤ 50MB/file |
| `EXTENSION` | Upload file | ≤ 50MB/file |

---

## 4. Taxonomy / Master Data

Hệ thống có **4** danh mục lookup được quản lý bởi Admin:

| Danh mục | Mô tả | Ví dụ |
|----------|------|-------|
| **Job** | Loại công việc cấp 1 | Code Implementation, Research, Operation, Report |
| **Work Category** | Phân loại con của Job | (linked to Job) |
| **Work** | Phân loại con của Work Category | (linked to Job + Work Category; có `code` unique) |
| **AI Capability** | Loại năng lực AI | Q&A, Workflow Assistant, Autonomous AI Agent, AI-based Tools & Applications, AI Orchestration |

**Không còn lookup tables sau:**
- ~~Department~~ → lấy trực tiếp từ CIP/AD `SRV Group`, lưu string `users.department`
- ~~AI Tool~~ → free text trong `best_practices.ai_tools_description`

---

## 5. Data Model (PostgreSQL)

### 5.1 Lookup Tables (4)

```
jobs              — id, name (256 unique), description (4096), created_at
ai_capabilities   — id, name (256 unique), is_default (bool), created_at
work_categories   — id, job_id FK, name (256), description (4096), unique (job_id, name)
works             — id, job_id FK, work_category_id FK, name (256), code (50 unique), description (4096)
```

### 5.2 Users

```
users
  id UUID PK
  email VARCHAR(255) UNIQUE
  name VARCHAR(255)
  cip_id VARCHAR(100) UNIQUE        — Samsung CIP/AD identifier
  role ENUM(USER, AX_CREATOR, AX_SUPPORTER, ADMIN)
  department VARCHAR(256)            — SRV Group từ CIP/AD (string, không phải FK)
  avatar_url VARCHAR(500)
  created_at TIMESTAMP
```

### 5.3 Best Practices

```
best_practices
  id UUID PK
  name VARCHAR(200) NOT NULL
  description TEXT
  thumbnail_url VARCHAR(500)
  installation_guide TEXT
  type ENUM(WEB, TOOL, EXTENSION)
  web_content VARCHAR(256)           — chỉ dùng khi type=WEB
  key_value TEXT                     — nhạy cảm, ẩn với USER role thường
  ai_tools_description TEXT          — mô tả AI tools (text tự do)
  work_id UUID → works.id
  status ENUM(REQUESTED, REJECTED, PUBLISHED)   — 3 trạng thái
  close_reason TEXT                  — populated khi Supporter close
  view_count INT DEFAULT 0
  like_count INT DEFAULT 0
  download_count INT DEFAULT 0
  created_at, updated_at, published_at TIMESTAMP
```

### 5.4 Junction Tables (3)

```
bp_creators        — bp_id, user_id (multi-creator)
bp_jobs            — bp_id, job_id (multi-job)
bp_ai_capabilities — bp_id, ai_capability_id (multi-capability)
```

(không còn `bp_ai_tools`, `bp_departments`)

### 5.5 Files

```
bp_files
  id UUID PK
  bp_id UUID → best_practices.id
  file_name VARCHAR(255)
  file_size BIGINT
  mime_type VARCHAR(100)
  file_path VARCHAR(500)            — absolute path trong Docker volume
  uploaded_at TIMESTAMP
```

### 5.6 Interaction Tables

```
bp_likes        — bp_id, user_id, created_at (PK composite)
bp_feedback     — id, bp_id, user_id, content TEXT, created_at
bp_downloads    — id, bp_id, user_id, downloaded_at
```

### 5.7 Review History

```
bp_reviews
  id UUID PK
  bp_id UUID → best_practices.id
  reviewer_id UUID → users.id
  action ENUM(APPROVED, REJECTED, CLOSED)   — CLOSED action vẫn track (status=REJECTED)
  comment TEXT
  reviewed_at TIMESTAMP
```

### 5.8 Audit Logs (P11 deferred — schema ready)

```
audit_logs
  id UUID PK
  actor_id UUID → users.id
  action ENUM(VIEW_PII, EDIT_PII, DELETE_PII, EXPORT_PII)
  target_type VARCHAR(50)       — 'USER', 'BEST_PRACTICE', etc.
  target_id UUID
  ip_address VARCHAR(45)
  user_agent VARCHAR(500)
  occurred_at TIMESTAMP
```
Retention: 30 ngày (P11 implements scheduled cleanup).

---

## 6. BP Status Flow (3 trạng thái)

```
[Submit]
   │
   ▼
REQUESTED ──reject──► REJECTED ──(creator edit + resubmit)──┐
   │                                                          │
   │ approve                                                  │
   ▼                                                          │
PUBLISHED ──close (reason)──► REJECTED                        │
   │                                                          │
   │ creator edit + resubmit                                  │
   ▼                                                          │
REQUESTED ◄───────────────────────────────────────────────────┘
(BP ẩn khỏi library)
```

| State | Mô tả |
|-------|-------|
| `REQUESTED` | Vừa submit hoặc resubmit; chờ review |
| `PUBLISHED` | Được approve; hiển thị trên Library |
| `REJECTED` | Bị reject (review) hoặc bị close; Creator có thể edit + resubmit |

**Không có trạng thái CLOSED riêng.** Close action = `PUBLISHED → REJECTED`. Phân biệt close vs reject qua `bp_reviews.action` (CLOSED vs REJECTED).

---

## 7. Luồng nghiệp vụ chính

### 7.1 Đăng ký & Review

```
AX_CREATOR điền form → Submit → status=REQUESTED
  → AX_SUPPORTER nhận email notification
  → AX_SUPPORTER review (full detail bao gồm key)
    → Approve → status=PUBLISHED → email AX_CREATOR + BP lên Library
    → Reject + comment → status=REJECTED → email AX_CREATOR → có thể edit + resubmit
```

### 7.2 Edit BP (3-case logic)

```
status=REQUESTED  → edit tự do → status giữ REQUESTED
status=REJECTED   → edit bất kỳ → status → REQUESTED (resubmit)
status=PUBLISHED, sửa web_content/file → status → REQUESTED (BP ẩn)
status=PUBLISHED, không sửa link/file → status giữ PUBLISHED (chỉ update metadata)
```

### 7.3 Sử dụng & Feedback

```
USER browse Library → filter/sort/search → xem detail
  → Download file (TOOL/EXTENSION) hoặc open URL (WEB)
  → Like BP, để lại feedback (text 2000 chars)
  → AX_CREATOR xem analytics: view/download/like/feedback của BP mình
```

### 7.4 Close BP

```
AX_SUPPORTER → Management page → BP PUBLISHED → Close action
  → popup nhập close reason (bắt buộc)
  → status: PUBLISHED → REJECTED
  → close_reason populated; bp_reviews.action=CLOSED ghi history
  → BP ẩn khỏi library
  → email AX_CREATOR
  → Creator có thể edit và resubmit để re-publish
```

### 7.5 Monitoring (Dashboard)

```
Tất cả roles → /dashboard
  → Submitters count, Total published BPs
  → Count by job / AI capability / department (creator's dept string)
  → Top 5 BP by work (số BP/work, descending)
  → Total usage (sum downloads), Active users (distinct users với view/like/download/feedback)
  → Usage trend 6 tháng (line chart)
  → Top 5 BP usage (số download per BP)
  → Date range filter
```

---

## 8. Backend API (Spring Boot)

### Auth

```
POST /auth/login            — redirect to CIP/AD (P11)
GET  /auth/callback         — handle CIP/AD callback, issue JWT
POST /auth/refresh          — exchange refresh token → new access
POST /auth/logout
GET  /auth/me               — current user info
```

### Library (Public / User)

```
GET  /api/v1/best-practices                          — list (filter, sort, search; chỉ PUBLISHED)
GET  /api/v1/best-practices/:id                      — view detail (log VIEW); mask key nếu USER
POST /api/v1/best-practices/:id/like                 — toggle like
POST /api/v1/best-practices/:id/feedback             — submit feedback (max 2000 chars)
GET  /api/v1/best-practices/:id/feedback             — list feedback
GET  /api/v1/best-practices/:id/files/:fileId/download — stream file (log download)
```

### AX Creator — My BPs

```
GET    /api/v1/my-best-practices                      — list của mình (all statuses)
POST   /api/v1/best-practices                         — register BP (auto-promote USER → AX_CREATOR)
PUT    /api/v1/best-practices/:id                     — edit (3-case status logic — xem §7.2)
DELETE /api/v1/best-practices/:id                     — delete (REQUESTED/REJECTED)
POST   /api/v1/best-practices/:id/submit              — resubmit (REJECTED → REQUESTED hoặc PUBLISHED → REQUESTED)
POST   /api/v1/best-practices/:id/files               — upload file (multipart, ≤ 50MB)
GET    /api/v1/best-practices/:id/analytics           — view/download/like/feedback aggregate
```

### AX Supporter — Management

```
GET  /api/v1/management/best-practices               — list all (filter status/type/job/AI cap)
GET  /api/v1/management/best-practices/:id           — full detail (key visible)
PUT  /api/v1/management/best-practices/:id/approve   — REQUESTED → PUBLISHED (no self-approve)
PUT  /api/v1/management/best-practices/:id/reject    — REQUESTED → REJECTED (comment required)
PUT  /api/v1/management/best-practices/:id/close     — PUBLISHED → REJECTED + close_reason
GET  /api/v1/management/reviews/:bpId                — review history
```

### Admin

```
GET /api/v1/admin/users               — list users (search, filter)
PUT /api/v1/admin/users/:id/role      — update role (AX_SUPPORTER hoặc ADMIN); AX_CREATOR auto-only
```

### Dashboard

```
GET /api/v1/dashboard?startDate=&endDate=    — full stats (tất cả roles); Redis cache 15m
```

### AI Insight

```
GET /api/v1/ai-insight    — hardcoded content (5 AI capability classifications); tất cả roles
```

### Lookup / Reference (Public Read)

```
GET /api/v1/jobs                       → [{ id, name }]
GET /api/v1/ai-capabilities            → [{ id, name }]
GET /api/v1/work-categories?jobId=     → [{ id, name, job }]
GET /api/v1/works?workCategoryId=      → [{ id, name, code, work_category }]
```

### Admin — Master Data CRUD (4 categories)

Pattern chung cho mỗi category (jobs, work-categories, works, ai-capabilities):

```
GET    /api/v1/admin/master-data/{category}
POST   /api/v1/admin/master-data/{category}
PUT    /api/v1/admin/master-data/{category}/:id
DELETE /api/v1/admin/master-data/{category}/:id   — 409 nếu còn BP/child reference
POST   /api/v1/admin/master-data/{category}/upload — bulk import Excel/CSV
```

Categories: `jobs`, `work-categories`, `works`, `ai-capabilities` (không còn `departments`, `ai-tools`).

---

## 9. Frontend (React + TypeScript)

### Routes

| Route | Trang | Role |
|-------|-------|------|
| `/` | Library — Browse | All |
| `/best-practices/:id` | Detail | All |
| `/ai-insight` | AI Capability Classifications | All |
| `/register` | Đăng ký BP (multi-step form) | AX_CREATOR+ |
| `/my-bps` | My BPs — quản lý BP của mình | AX_CREATOR+ |
| `/my-bps/:id/edit` | Edit BP | AX_CREATOR+ |
| `/management` | Management List | AX_SUPPORTER+ |
| `/management/:id/review` | Review BP | AX_SUPPORTER+ |
| `/dashboard` | Dashboard Monitoring | All roles |
| `/admin/users` | Admin — quản lý user | ADMIN |
| `/admin/master-data` | Admin — CRUD 4 lookups | ADMIN |

### Component chính

- `BPCard` — card hiển thị trên library (name, description, thumbnail, work, creators)
- `TypeBadge` — badge WEB / TOOL / EXTENSION
- `StatusBadge` — badge REQUESTED / REJECTED / PUBLISHED (3 trạng thái)
- `FilterPanel` — filter by job, AI capability, work category, work, type, department-search, ai-tool-text-search
- `LikeButton` — toggle like với count
- `FeedbackList` / `FeedbackForm` — hiển thị và gửi feedback
- `ReviewPanel` — approve/reject/close actions cho AX_SUPPORTER
- `AnalyticsCard` — view/download/like/feedback count cho AX_CREATOR
- `MasterDataTable` — CRUD inline cho admin master data pages
- `AIInsightCard` — render 5 AI capability classifications

---

## 10. Bảo mật & Phân quyền

| Action | USER | AX_CREATOR | AX_SUPPORTER | ADMIN |
|--------|------|-----------|--------------|-------|
| Browse / xem published BP | ✅ | ✅ | ✅ | ✅ |
| Xem detail (ẩn key) | ✅ | ✅ | ✅ | ✅ |
| Xem key BP | ❌ | ✅ (owner) | ✅ | ✅ |
| Download file | ✅ | ✅ | ✅ | ✅ |
| Like BP | ✅ | ✅ | ✅ | ✅ |
| Submit feedback | ✅ | ✅ | ✅ | ✅ |
| Register / edit BP | ❌ | ✅ (own) | ✅ (own) | ✅ |
| View My BPs + analytics | ❌ | ✅ (own) | ✅ (own) | ✅ |
| Management list | ❌ | ❌ | ✅ | ✅ |
| Approve / Reject / Close | ❌ | ❌ | ✅ (no self-approve) | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Quản lý user & role | ❌ | ❌ | ❌ | ✅ |
| CRUD master data | ❌ | ❌ | ❌ | ✅ |

---

## 11. Tech Stack

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS | Type-safe, fast build, utility-first |
| State | Zustand (auth) + TanStack Query (server state) | Tách rõ client/server state |
| Backend | Java 21 + Spring Boot 3 | Enterprise-grade, virtual threads |
| Database | PostgreSQL 16 | JSONB, GIN index, mature |
| Migration | Flyway | Versioned, auto-run |
| Cache | Redis 7 | Dashboard cache (15m), session (P11) |
| File Store | Docker Volume (local FS) | Đơn giản, không cần service ngoài; prod backup riêng |
| Auth | CIP/AD Samsung (P11) — OAuth2 pluggable, MockSSO ở dev | Profile-based separation |
| Container | Docker + Docker Compose (dev), K8s (prod) | Consistent env |
| CI/CD | GitHub Actions | Integrated with repo |

---

## 12. Phân chia công việc

### BE (Java)

- Auth module (MockSSO ở P1, CIPADProvider ở P11)
- CRUD API best practices + state machine (3 trạng thái, 3-case edit logic)
- File upload/download qua Docker volume (stream)
- Master data CRUD (Job, WorkCategory, Work, AICapability) + bulk upload
- Like / feedback / download tracking
- Management APIs (approve/reject/close + self-approve check)
- Dashboard stats API (cached 15m)
- AI Insight static endpoint
- User management API
- Role-based authorization (RBAC)
- P11: SSO + MFA + PII encryption + audit log + masking

### FE (React)

- Layout + routing + auth flow
- Library page: browse, filter (job/AI cap/work cat/work/type/dept-search/ai-tool-text), sort, search
- Detail page: info, file download, like, feedback
- Register form (multi-step): basic info → content/files → guide → preview
- My BPs page: list (3-status filter), edit, delete, analytics
- Management page: list (filter), review/close flow
- Dashboard page: cards + charts (Recharts hoặc Chart.js)
- Admin pages: User Management + Master Data CRUD (4 categories)
- AI Insight page
- i18n (EN/VI), Responsive, WCAG 2.1 AA

### PM / Admin

- Quản lý 4 master data lookups (Job, WorkCategory, Work, AICapability)
- SLA review (e.g., AX Supporter review trong 48h)
- Tiêu chí chất lượng để approve BP
- Template hướng dẫn đăng ký BP

---

## 13. Giai đoạn triển khai (12 phases — đồng bộ implementation-plan v2.1)

| Phase | Nội dung | Output |
|-------|----------|--------|
| P0 | Project setup, Docker Compose, DB schema baseline (Flyway V1-V11) | App khởi động |
| P1 | Auth mock (JWT local), Spring Security, RBAC guards | Endpoints có auth |
| P2 | Master data CRUD (Admin) — 4 categories + bulk upload | Admin manages lookups |
| P3 | BP Library — register + file upload Docker volume + list + detail | Creator đăng ký, User browse |
| P4 | BP Lifecycle — submit/review/approve/reject/close + 3-case edit | Workflow đầy đủ |
| P5 | My Practice — view list, edit, delete + popup confirm | Creator quản lý BP mình |
| P6 | Interactions — like, feedback, download tracking | Engagement features |
| P7 | Dashboard — aggregations, charts, Redis cache, date range | Dashboard production |
| P8 | User Management (Admin) — assign role | Admin quản lý role |
| P9 | FE polish — i18n EN/VI, responsive, WCAG 2.1 AA, AI Insight page | FE ready |
| P10 | NFR — Swagger 100%, SonarQube/JaCoCo, CI/CD GitHub Actions, k6 performance test | NFR pass |
| P11 | Auth thật — SSO CIP/AD + MFA admin + PII encryption + audit log + masking + TLS enforce | SSO + Security NFRs live |

Mỗi phase: BE tasks → FE tasks → integration test → merge.
