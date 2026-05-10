# AXon — AI Best Practice Hub (Design Spec)

## Context

Công ty cần một nơi tập trung để nội bộ chia sẻ và chuẩn hoá các AI best practice (skills, MCP configs, rule sets, agent workflows). Hiện tại thông tin phân tán, không có quy trình phê duyệt hay đánh giá chất lượng. AXon giải quyết bài toán này: một web platform nơi mọi người đăng ký → admin kiểm duyệt → publish → cộng đồng nội bộ sử dụng và xếp hạng.

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
│              ┌───────────────────────┼────────────────┐ │
│              │                       │                │ │
│         ┌────▼─────┐     ┌───────────▼──┐  ┌────────┐ │ │
│         │PostgreSQL│     │  File Store  │  │ Redis  │ │ │
│         └──────────┘     │  (S3/MinIO)  │  └────────┘ │ │
│                          └──────────────┘             │ │
│              └───────────────────────────────────────┘ │
│                                                         │
│   ┌──────────────────┐    ┌──────────────────────────┐  │
│   │  SSO Provider    │    │  Agent Builder (API)      │  │
│   │  (pluggable)     │    │  (existing system)        │  │
│   └──────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Các loại Best Practice (Category Types)

| Type | Mô tả | Ví dụ |
|------|-------|-------|
| `SKILL_SET` | Bộ skills cho AI coding tools | Claude Code skills cho viết code |
| `MCP_CONFIG` | MCP local server config | MCP đọc/tạo Confluence page tự động |
| `RULE_SET` | Bộ rules chuẩn hoá AI | Rules cho AI viết code đúng convention |
| `AGENT_WORKFLOW` | Workflow trong Agent Builder | Quy trình tự động hoá từ Agent Builder |

---

## 3. Data Model (PostgreSQL)

### Users
```
users
  id UUID PK
  email VARCHAR UNIQUE
  name VARCHAR
  role ENUM(USER, ADMIN)
  sso_provider VARCHAR       -- google, azure, keycloak, etc.
  sso_subject VARCHAR        -- sub claim từ SSO
  avatar_url VARCHAR
  created_at TIMESTAMP
```

### Best Practices
```
best_practices
  id UUID PK
  title VARCHAR NOT NULL
  description TEXT
  type ENUM(SKILL_SET, MCP_CONFIG, RULE_SET, AGENT_WORKFLOW)
  status ENUM(DRAFT, PENDING_REVIEW, UNDER_REVIEW, PUBLISHED, REJECTED)
  author_id UUID → users.id
  usage_guide TEXT           -- hướng dẫn sử dụng
  install_guide TEXT         -- hướng dẫn cài đặt
  external_links JSONB       -- [{label, url}]
  agent_workflow_id VARCHAR   -- ID trong Agent Builder (nếu type=AGENT_WORKFLOW)
  tags TEXT[]
  created_at TIMESTAMP
  published_at TIMESTAMP
  view_count INT DEFAULT 0
  download_count INT DEFAULT 0
  usage_score FLOAT          -- weighted ranking score
```

### Files
```
best_practice_files
  id UUID PK
  best_practice_id UUID → best_practices.id
  file_name VARCHAR
  file_size BIGINT
  mime_type VARCHAR
  storage_key VARCHAR        -- key trong S3/MinIO
  uploaded_at TIMESTAMP
```

### Approval workflow
```
approvals
  id UUID PK
  best_practice_id UUID → best_practices.id
  reviewer_id UUID → users.id
  status ENUM(PENDING, APPROVED, REJECTED)
  comment TEXT
  reviewed_at TIMESTAMP
```

### Usage tracking (cho ranking)
```
usage_logs
  id UUID PK
  best_practice_id UUID → best_practices.id
  user_id UUID → users.id
  action ENUM(VIEW, DOWNLOAD, WORKFLOW_USED)
  created_at TIMESTAMP
```

---

## 4. Luồng nghiệp vụ chính

### 4.1 Đăng ký Best Practice
```
User điền form → DRAFT
  → Submit → PENDING_REVIEW
  → Admin nhận thông báo → UNDER_REVIEW
  → Admin approve → PUBLISHED (user nhận notification)
  → Admin reject → REJECTED (kèm comment lý do)
```

### 4.2 Tìm kiếm & Sử dụng
```
Browse/Search → Xem detail → Download files / Copy config / Mở workflow
  → Log usage action → Cập nhật usage_score
```

### 4.3 Ranking
```
usage_score = (download_count × 3) + (workflow_used_count × 5) + (view_count × 0.5)
             với decay theo thời gian (tuần cũ weight thấp hơn)
Recompute mỗi 1h bằng scheduled job, cache vào Redis
```

---

## 5. Backend API (Spring Boot)

### Module Auth
- `POST /auth/sso/callback` — nhận code từ SSO provider, tạo session
- `POST /auth/logout`
- `GET /auth/me` — thông tin user hiện tại
- Auth pluggable qua `SSOProvider` interface (implement OAuth2/SAML/OIDC tuỳ provider)

### Module Best Practices
- `GET /api/v1/best-practices` — list (filter type, tags, search, sort by ranking)
- `GET /api/v1/best-practices/:id` — detail (log VIEW)
- `POST /api/v1/best-practices` — tạo mới (authenticated)
- `PUT /api/v1/best-practices/:id` — cập nhật (author/admin)
- `DELETE /api/v1/best-practices/:id` — xoá (author/admin)
- `POST /api/v1/best-practices/:id/submit` — submit để review
- `POST /api/v1/best-practices/:id/files` — upload file
- `GET /api/v1/best-practices/:id/files/:fileId/download` — download (log DOWNLOAD)

### Module Admin
- `GET /api/v1/admin/queue` — danh sách chờ duyệt
- `PUT /api/v1/admin/best-practices/:id/approve`
- `PUT /api/v1/admin/best-practices/:id/reject` — kèm comment
- `GET /api/v1/admin/users` — quản lý user & phân quyền

### Module Agent Builder Integration
- `GET /api/v1/agent-builder/workflows` — proxy lấy workflow list từ Agent Builder API
- `GET /api/v1/agent-builder/workflows/:id` — proxy detail
- Khi user "use" một AGENT_WORKFLOW best practice → log `WORKFLOW_USED` + redirect/embed Agent Builder

### Module Ranking
- `GET /api/v1/best-practices/trending` — top theo usage_score
- Scheduled job recompute ranking mỗi 1h

---

## 6. Frontend (React + TypeScript)

### Trang chính
| Route | Trang | Chức năng |
|-------|-------|-----------|
| `/` | Browse | Grid/list BP, filter type + tags, sort (newest / trending) |
| `/best-practices/:id` | Detail | Info đầy đủ, files, links, usage guide, install guide, Agent Builder embed |
| `/submit` | Submit | Form đa bước: thông tin cơ bản → files → links → preview → submit |
| `/my-submissions` | My Work | Danh sách BP của user, trạng thái từng cái |
| `/admin` | Admin Dashboard | Queue phê duyệt, stats, quản lý user |
| `/admin/:id/review` | Review Detail | Xem đầy đủ BP, approve/reject kèm comment |

### Component chính
- `BestPracticeCard` — card hiển thị trên browse
- `TypeBadge` — badge màu theo type (SKILL, MCP, RULE, WORKFLOW)
- `StatusTimeline` — hiển thị trạng thái approval
- `FileList` — list files kèm download
- `RankingBadge` — hiển thị điểm/ranking
- `AgentWorkflowEmbed` — iframe/widget từ Agent Builder

---

## 7. Bảo mật & Phân quyền

| Action | USER | ADMIN |
|--------|------|-------|
| Browse / xem published BP | ✅ | ✅ |
| Download files | ✅ (authenticated) | ✅ |
| Tạo / submit BP | ✅ | ✅ |
| Sửa BP của mình | ✅ | ✅ |
| Xem queue chờ duyệt | ❌ | ✅ |
| Approve / Reject | ❌ | ✅ |
| Quản lý user | ❌ | ✅ |
| Sửa BP của người khác | ❌ | ✅ |

- SSO bắt buộc — không có tài khoản local
- JWT token (access 15m + refresh 7d) sau khi SSO callback thành công
- File storage: signed URL có TTL để download

---

## 8. Tech Stack đề xuất

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | Java 21 + Spring Boot 3 + Spring Security |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| File Store | MinIO (self-hosted) hoặc S3 |
| Auth | Spring Security OAuth2 Client (pluggable provider) |
| Container | Docker + Docker Compose (dev), K8s (prod) |
| CI/CD | GitHub Actions |

---

## 9. Phân chia công việc theo role

### BE (Java)
- Auth module + SSO abstraction layer
- CRUD API best practices
- File upload/download + signed URL
- Approval workflow state machine
- Agent Builder API proxy client
- Ranking scheduled job
- Role-based authorization

### FE (React)
- Layout + routing
- Browse page + search/filter
- Submit form (multi-step)
- Detail page + Agent Builder embed
- Admin dashboard + review flow
- Auth flow (SSO redirect → callback → session)

### PM
- Định nghĩa SLA phê duyệt (ví dụ: admin xem xét trong 48h)
- Quy trình onboarding admin
- Template hướng dẫn đăng ký best practice
- Tiêu chí chất lượng để admin approve

---

## 10. Kiểm thử & Xác nhận

- Unit test: service layer (JUnit 5 + Mockito)
- Integration test: API với Testcontainers (PostgreSQL + MinIO thật)
- E2E FE: Playwright — luồng submit → admin approve → user download
- Manual: đăng nhập qua SSO mock → tạo BP → submit → duyệt → download → kiểm tra ranking tăng

---

## 11. Giai đoạn triển khai (Phasing)

### Phase 1 — Foundation (tuần 1-3)
- Auth (SSO mock → thật sau)
- CRUD best practice + file upload
- Submit → Pending flow
- Browse page cơ bản

### Phase 2 — Approval & Publish (tuần 4-5)
- Admin dashboard + review flow
- Notification (email / in-app)
- Published state + detail page đầy đủ

### Phase 3 — Ranking & Integration (tuần 6-7)
- Usage tracking + ranking job
- Trending page
- Agent Builder integration (proxy + embed)

### Phase 4 — Polish & SSO thật (tuần 8)
- Kết nối SSO thật của công ty
- Performance tuning
- Security review
