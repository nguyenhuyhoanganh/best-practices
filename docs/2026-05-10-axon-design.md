# AXon — AI Best Practice Hub (Design Spec)

**Version:** 2.0  
**Date:** 2026-05-11  
**Status:** Draft

## Context

Công ty cần một nơi tập trung để nội bộ chia sẻ và chuẩn hoá các AI best practice (skills, MCP configs, rule sets, v.v.). Hiện tại thông tin phân tán, không có quy trình phê duyệt hay đánh giá chất lượng. AXon giải quyết bài toán này: một web platform nơi AX Creator đăng ký → AX Supporter kiểm duyệt → publish → cộng đồng nội bộ sử dụng, để lại feedback, và AX Creator tổng hợp để cải thiện.

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    AXon Platform                        │
│                                                         │
│   ┌──────────────┐        ┌──────────────────────────┐  │
│   │  Frontend    │◄──────►│  Backend API             │  │
│   │  (React/TS)  │  REST  │  (Java Spring Boot)      │  │
│   └──────────────┘        └──────────┬───────────────┘  │
│                                      │                  │
│              ┌───────────────────────┼──────────────┐   │
│              │                       │              │   │
│         ┌────▼─────┐     ┌───────────▼──┐  ┌───────┐   │
│         │PostgreSQL│     │  File Store  │  │ Redis │   │
│         └──────────┘     │  (MinIO/S3)  │  └───────┘   │
│                          └──────────────┘               │
│              └───────────────────────────────────────   │
│                                                         │
│   ┌──────────────────────────────────────────────────┐  │
│   │  CIP/AD (Samsung — external authentication)      │  │
│   └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Actors và Roles

| Role | Quyền |
|------|-------|
| **User** | Browse library, xem detail, like, download, để lại feedback |
| **AX Creator** | Tất cả quyền của User + đăng ký/edit/delete BP của mình, xem analytics & feedback của BP mình |
| **AX Supporter** | Tất cả quyền của User + quản lý BP (review, approve, reject, close), xem dashboard |
| **Admin** | Tất cả quyền + quản lý user & phân quyền |

---

## 3. Các loại Best Practice (BP Type)

| Type | Nội dung | Ví dụ |
|------|----------|-------|
| `WEB` | Text input tối đa 256 ký tự (URL hoặc config text) | Link đến Confluence page, web tool |
| `TOOL` | File upload tối đa 50MB | Extension file, plugin package |
| `EXTENSION` | File upload tối đa 50MB | Browser extension, IDE plugin |

---

## 4. Taxonomy / Danh mục

Hệ thống có các bảng danh mục được quản lý bởi Admin:

| Danh mục | Ví dụ giá trị |
|----------|--------------|
| **Job** | Code Implementation, Research, Operation, Report |
| **AI Capability** | Q&A, Workflow Assistant, Auto AI Agent, AI Orchestration |
| **Work Category** | (parent của Work) |
| **Work** | (linked to Work Category, search/select khi đăng ký BP) |
| **Department** | Các phòng ban nội bộ |
| **AI Tool** | Claude, Cursor, GitHub Copilot, ChatGPT, … |

---

## 5. Data Model (PostgreSQL)

### Lookup Tables

```
jobs              — id, name, display_order
ai_capabilities   — id, name, display_order
work_categories   — id, name
works             — id, name, work_category_id
departments       — id, name
ai_tools          — id, name, display_order
```

### Users

```
users
  id UUID PK
  email VARCHAR UNIQUE
  name VARCHAR
  cip_id VARCHAR UNIQUE          -- Samsung CIP/AD identifier
  role ENUM(USER, AX_CREATOR, AX_SUPPORTER, ADMIN)
  department_id UUID → departments.id
  avatar_url VARCHAR
  created_at TIMESTAMP
```

### Best Practices

```
best_practices
  id UUID PK
  name VARCHAR(200) NOT NULL
  description TEXT
  thumbnail_url VARCHAR(500)
  installation_guide TEXT
  type ENUM(WEB, TOOL, EXTENSION)
  web_content VARCHAR(256)        -- chỉ dùng khi type=WEB
  key_value TEXT                  -- nhạy cảm, ẩn với User thông thường
  work_id UUID → works.id
  status ENUM(REQUESTED, REJECTED, PUBLISHED, CLOSED)
  close_reason TEXT               -- bắt buộc khi status=CLOSED
  view_count INT DEFAULT 0
  like_count INT DEFAULT 0
  download_count INT DEFAULT 0
  created_at TIMESTAMP
  updated_at TIMESTAMP
  published_at TIMESTAMP
```

### Junction Tables (Many-to-Many)

```
bp_creators        — bp_id, user_id (nhiều creator)
bp_jobs            — bp_id, job_id
bp_ai_capabilities — bp_id, ai_capability_id
bp_ai_tools        — bp_id, ai_tool_id
bp_departments     — bp_id, department_id (departments BP phục vụ)
```

### Files

```
bp_files
  id UUID PK
  bp_id UUID → best_practices.id
  file_name VARCHAR
  file_size BIGINT
  mime_type VARCHAR
  storage_key VARCHAR             -- key trong MinIO/S3
  uploaded_at TIMESTAMP
```

### Social & Interaction

```
bp_likes
  bp_id UUID → best_practices.id
  user_id UUID → users.id
  created_at TIMESTAMP
  PRIMARY KEY (bp_id, user_id)

bp_feedback
  id UUID PK
  bp_id UUID → best_practices.id
  user_id UUID → users.id
  content TEXT NOT NULL
  created_at TIMESTAMP

bp_downloads
  id UUID PK
  bp_id UUID → best_practices.id
  user_id UUID → users.id
  downloaded_at TIMESTAMP
```

### Review History

```
bp_reviews
  id UUID PK
  bp_id UUID → best_practices.id
  reviewer_id UUID → users.id
  action ENUM(APPROVED, REJECTED, CLOSED)
  comment TEXT
  reviewed_at TIMESTAMP
```

---

## 6. BP Status Flow

```
[Submit] ──► REQUESTED
               │
    ┌──────────┴──────────┐
    │                     │
  Reject               Approve
  (comment)               │
    │                     ▼
    ▼               PUBLISHED ──── Close (reason) ──► CLOSED
 REJECTED                │
    │             [Creator edit]
  [Edit +              │
  Resubmit]           ▼
    │            REQUESTED
    └──────────► (BP ẩn khỏi library)
```

---

## 7. Luồng nghiệp vụ chính

### 7.1 Đăng ký & Review

```
AX Creator điền form → Submit → status=REQUESTED
  → AX Supporter nhận thông báo
  → AX Supporter review (xem full detail kể cả key)
    → Approve → PUBLISHED → AX Creator nhận email
    → Reject + comment → REJECTED → AX Creator nhận email → có thể edit + resubmit
```

### 7.2 Sử dụng & Feedback

```
User browse library → filter/sort/search → xem detail
  → Download file (TOOL/EXTENSION) hoặc copy link (WEB)
  → Để lại feedback
  → Like BP

AX Creator xem analytics: view, download, like, feedback tổng hợp
```

### 7.3 Monitoring

```
AX Supporter xem dashboard:
  - Tổng số người submit, tổng BP, số đã published
  - Số lượng job/AI capability/department trong hệ thống
  - Top 5 Creator, Top 5 Work
```

### 7.4 Close BP

```
AX Supporter → Close published BP → nhập lý do bắt buộc
  → status=CLOSED → BP ẩn khỏi library → AX Creator nhận thông báo
```

---

## 8. Backend API (Spring Boot)

### Auth

```
POST /auth/login            — redirect to CIP/AD
GET  /auth/callback         — handle CIP/AD callback, issue session
POST /auth/logout
GET  /auth/me               — user hiện tại
```

### Library (Public / User)

```
GET  /api/v1/best-practices                          — list (filter, sort, search)
GET  /api/v1/best-practices/:id                      — view detail (log VIEW)
POST /api/v1/best-practices/:id/like                 — toggle like (auth required)
GET  /api/v1/best-practices/:id/download             — download file (auth required, log DOWNLOAD)
POST /api/v1/best-practices/:id/feedback             — submit feedback (auth required)
GET  /api/v1/best-practices/:id/feedback             — list feedback (auth required)
```

### AX Creator

```
GET  /api/v1/my-best-practices                       — danh sách BP của mình
POST /api/v1/best-practices                          — đăng ký BP mới
PUT  /api/v1/best-practices/:id                      — edit BP
DELETE /api/v1/best-practices/:id                    — xoá BP (REQUESTED hoặc REJECTED)
POST /api/v1/best-practices/:id/submit               — submit/resubmit for review
POST /api/v1/best-practices/:id/files                — upload file (TOOL/EXTENSION)
GET  /api/v1/best-practices/:id/analytics            — analytics (view, download, like, feedback)
```

### AX Supporter — Management

```
GET  /api/v1/management/best-practices               — management list (all statuses)
GET  /api/v1/management/best-practices/:id           — view detail (kể cả key)
PUT  /api/v1/management/best-practices/:id/approve   — approve
PUT  /api/v1/management/best-practices/:id/reject    — reject + comment
PUT  /api/v1/management/best-practices/:id/close     — close + reason
GET  /api/v1/management/reviews/:bpId               — lịch sử review của BP
```

### Admin

```
GET /api/v1/admin/users               — danh sách user
PUT /api/v1/admin/users/:id/role      — cập nhật role
```

### Dashboard

```
GET /api/v1/dashboard                 — stats tổng quan (AX Supporter)
```

### Lookup / Reference Data (Public Read)

```
GET /api/v1/jobs
GET /api/v1/ai-capabilities
GET /api/v1/work-categories
GET /api/v1/works?workCategoryId=...
GET /api/v1/departments
GET /api/v1/ai-tools
```

### Admin — Quản lý danh mục (CRUD)

Admin có thể thêm, sửa, xoá các mục trong từng danh mục. Áp dụng cho cả 6 lookup: **job**, **ai-capability**, **work-category**, **work**, **department**, **ai-tool**.

```
# Pattern chung — ví dụ với jobs:
GET    /api/v1/admin/jobs              — danh sách
POST   /api/v1/admin/jobs              — tạo mới
PUT    /api/v1/admin/jobs/:id          — sửa
DELETE /api/v1/admin/jobs/:id          — xoá (lỗi 409 nếu còn BP tham chiếu)

# Tương tự cho:
/api/v1/admin/ai-capabilities/:id
/api/v1/admin/work-categories/:id
/api/v1/admin/works/:id          (body include work_category_id)
/api/v1/admin/departments/:id
/api/v1/admin/ai-tools/:id
```

---

## 9. Frontend (React + TypeScript)

### Routes

| Route | Trang | Role |
|-------|-------|------|
| `/` | Library — Browse | All |
| `/best-practices/:id` | Detail | All |
| `/register` | Đăng ký BP (form đa bước) | AX Creator |
| `/my-bps` | My BPs — quản lý BP của mình | AX Creator |
| `/my-bps/:id/edit` | Edit BP | AX Creator |
| `/management` | Management List | AX Supporter |
| `/management/:id/review` | Review BP | AX Supporter |
| `/dashboard` | Dashboard Monitoring | AX Supporter |
| `/admin` | Admin — quản lý user | Admin |

### Component chính

- `BPCard` — card hiển thị trên library (name, description, thumbnail, job, work, creators)
- `TypeBadge` — badge WEB / TOOL / EXTENSION
- `StatusBadge` — badge REQUESTED / REJECTED / PUBLISHED / CLOSED
- `FilterPanel` — filter by job, AI capability, work, department, BP type, AI tool
- `LikeButton` — toggle like với count
- `FeedbackList` / `FeedbackForm` — hiển thị và gửi feedback
- `ReviewPanel` — approve/reject/close actions cho AX Supporter
- `AnalyticsCard` — view/download/like count cho AX Creator

---

## 10. Bảo mật & Phân quyền

| Action | User | AX Creator | AX Supporter | Admin |
|--------|------|-----------|--------------|-------|
| Browse / xem published BP | ✅ | ✅ | ✅ | ✅ |
| Xem detail (ẩn key) | ✅ | ✅ | — | ✅ |
| Xem key | ❌ | ✅ (owner) | ✅ | ✅ |
| Download file | ✅ | ✅ | ✅ | ✅ |
| Like BP | ✅ | ✅ | ✅ | ✅ |
| Để lại feedback | ✅ | ✅ | ✅ | ✅ |
| Đăng ký / edit BP | ❌ | ✅ (own) | — | ✅ |
| Xem My BPs + analytics | ❌ | ✅ (own) | — | ✅ |
| Management list | ❌ | ❌ | ✅ | ✅ |
| Approve / Reject / Close | ❌ | ❌ | ✅ (không self-approve) | ✅ |
| Dashboard monitoring | ❌ | ❌ | ✅ | ✅ |
| Quản lý user & roles | ❌ | ❌ | ❌ | ✅ |
| CRUD danh mục lookup | ❌ | ❌ | ❌ | ✅ |

---

## 11. Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | Java 21 + Spring Boot 3 + Spring Security |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (session, rate limiting) |
| File Store | MinIO (self-hosted) hoặc S3 |
| Auth | CIP/AD Samsung (OAuth2/OIDC pluggable, mock cho dev) |
| Container | Docker + Docker Compose (dev), K8s (prod) |
| CI/CD | GitHub Actions |

---

## 12. Phân chia công việc

### BE (Java)

- Auth module + CIP/AD abstraction layer (mock cho dev)
- CRUD API best practices + state machine
- File upload/download + pre-signed URL
- Like / feedback / download tracking
- Management APIs (approve/reject/close)
- Dashboard stats API
- Lookup/reference data APIs
- Role-based authorization

### FE (React)

- Layout + routing + auth flow
- Library page: browse, filter, sort, search
- Detail page: info, file download, like, feedback
- Register form (multi-step): basic info → file/content → guides → preview
- My BPs page: list, edit, delete, analytics
- Management page: management list, review flow
- Dashboard page
- Admin page: user management

### PM / Admin

- Quản lý danh mục lookup (job, AI capability, work, department, AI tool)
- SLA review (ví dụ: AX Supporter review trong 48h)
- Tiêu chí chất lượng để approve BP
- Template hướng dẫn đăng ký BP

---

## 13. Giai đoạn triển khai

### Phase 1 — Foundation (tuần 1–3)

- Auth (CIP/AD mock)
- Lookup/reference data APIs + seed data
- CRUD best practice (register, edit, delete)
- File upload (TOOL/EXTENSION)
- Submit → REQUESTED flow
- Library browse cơ bản

### Phase 2 — Review & Publish (tuần 4–5)

- Management list + review flow (approve/reject)
- Email notification
- Published state + detail page đầy đủ
- Like + feedback

### Phase 3 — Monitoring & UX Polish (tuần 6–7)

- Close BP flow
- Download tracking
- Analytics cho AX Creator
- Dashboard monitoring
- Filter/sort nâng cao

### Phase 4 — Production (tuần 8)

- Kết nối CIP/AD thật của Samsung
- Performance tuning + security review
- K8s deployment
