# AXon Docs Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cập nhật 4 docs AXon (requirements, HLD, DLD, implementation-plan) theo spec v2 — mỗi doc là tài liệu hoàn chỉnh, standalone, ai đọc vào cũng hiểu hệ thống mà không cần cross-reference.

**Architecture:** Mixed rewrite — requirements.md và implementation-plan.md viết lại hoàn toàn; HLD.md và DLD.md chỉnh sửa in-place (output vẫn là doc hoàn chỉnh). Tham chiếu spec tại `docs/superpowers/specs/2026-05-12-axon-doc-update-design.md`.

**Tech Stack:** Markdown, Git

---

## File Map

| File | Action | Lý do |
|------|--------|-------|
| `docs/2026-05-10-axon-requirements.md` | Viết lại hoàn toàn | State machine thay đổi; 18 FRs mới; NFRs mới |
| `docs/2026-05-10-axon-hld.md` | Chỉnh sửa in-place | Bỏ MinIO; thêm modules mới; cập nhật state machine |
| `docs/2026-05-10-axon-dld.md` | Chỉnh sửa in-place | Schema mới; API mới; edit logic mới |
| `docs/2026-05-10-axon-implementation-plan.md` | Viết lại hoàn toàn | Phạm vi thay đổi hoàn toàn; 12 phases mới |

---

## Task 1: Viết lại requirements.md

**Files:**
- Modify: `docs/2026-05-10-axon-requirements.md`

- [ ] **Step 1: Xoá toàn bộ nội dung cũ và thay bằng nội dung sau**

```markdown
# AXon — Requirements v2.0

**Version:** 2.0
**Date:** 2026-05-12
**Status:** Approved

---

## 1. Tổng quan hệ thống

AXon (AI eXchange on) là nền tảng chia sẻ và quản lý AI Best Practices (BP) nội bộ Samsung SEV. Hệ thống kết nối AX Creator (người đóng góp BP), AX Supporter (người kiểm duyệt), và User (người sử dụng BP) trên một nền tảng tập trung.

**Luồng nghiệp vụ chính:**
1. AX Creator đăng ký BP → trạng thái `REQUESTED`
2. AX Supporter review → `PUBLISHED` (approve) hoặc `REJECTED` (reject + comment)
3. User xem library, cài đặt BP, like, feedback
4. AX Creator xem feedback/analytics để cải thiện BP
5. AX Supporter monitor dashboard usage
6. AX Supporter có thể close BP đang published → `REJECTED` (BP ẩn khỏi library; creator có thể edit và submit lại)

---

## 2. Actors & Roles

| Role | Mô tả | Cách gán |
|------|-------|---------|
| `USER` | Người dùng nội bộ Samsung. Xem library, cài đặt BP, like, feedback | Mặc định khi login qua CIP/AD lần đầu |
| `AX_CREATOR` | Đăng ký/edit/delete BP của mình; xem analytics | Tự động nâng từ USER khi tạo BP đầu tiên |
| `AX_SUPPORTER` | Kiểm duyệt BP, close BP, quản lý master data, monitor dashboard | Admin assign |
| `ADMIN` | Quản lý user & permission. Có toàn bộ quyền của AX_SUPPORTER | Admin assign |

---

## 3. BP Status State Machine

```
                   [AX Creator submit]
                          │
                          ▼
                      REQUESTED
                     /         \
          [Supporter reject]   [Supporter approve]
                /                     \
           REJECTED                 PUBLISHED
               │                       │
    [Creator edit + resubmit]  [Supporter close]
               │                       │
               └───────────────────────┘
                          │
                      REQUESTED
                   (BP ẩn khỏi library)
```

| Trạng thái | Mô tả | Ai trigger |
|------------|-------|-----------|
| `REQUESTED` | Vừa submit hoặc resubmit; chờ review | Creator submit / Supporter reject + Creator resubmit |
| `PUBLISHED` | Được approve; hiển thị trên Library | Supporter approve |
| `REJECTED` | Bị reject hoặc bị close; Creator có thể edit + resubmit | Supporter reject / Supporter close |

> **Không có trạng thái CLOSED riêng.** Action "close" chuyển `PUBLISHED → REJECTED`.

---

## 4. BP Type

| Type | Cách nhập nội dung cài đặt | Constraint |
|------|--------------------------|------------|
| `WEB` | URL text | Tối đa 256 ký tự |
| `TOOL` | Upload file | Tối đa 50MB |
| `EXTENSION` | Upload file | Tối đa 50MB |

---

## 5. Functional Requirements

### 5.1 Epic: Library

#### FR-LIB-01 — View List BP
- **Mô tả:** Hiển thị danh sách BP đã PUBLISHED dưới dạng card
- **Thông tin mỗi card:** thumbnail, name, description (truncate), job, work, creator (tên đầu tiên + "+N others" nếu nhiều)
- **Role:** USER, AX_SUPPORTER, ADMIN
- **Điều kiện:** Chỉ hiển thị BP có status = `PUBLISHED`

#### FR-LIB-02 — Register BP
- **Mô tả:** Đăng ký best practice mới
- **Fields:**
  - `name`: text, bắt buộc
  - `description`: text, bắt buộc
  - `installation_guide`: text/rich text, bắt buộc
  - `work`: chọn từ danh sách (search + select), bắt buộc
  - `ai_capability`: chọn từ danh sách (search + select), bắt buộc
  - `ai_tools`: text mô tả công cụ cụ thể, tùy chọn
  - `type`: WEB / TOOL / EXTENSION
    - Nếu WEB: nhập URL (≤256 ký tự)
    - Nếu TOOL hoặc EXTENSION: upload file (≤50MB)
  - `key`: text nhạy cảm, ẩn khi hiển thị ở library
  - `creators`: search CIP theo tên/email, multi-select; phải bao gồm người đang tạo
- **Khi submit:** status → `REQUESTED`; nếu submitter chưa có role `AX_CREATOR` → auto promote
- **Role:** USER (và AX_CREATOR, ADMIN)

#### FR-LIB-03 — View Detail BP
- **Mô tả:** Xem chi tiết BP
- **Hiển thị:** tất cả fields, trừ `key` bị ẩn với USER thông thường
- **Side effect:** mỗi lần GET → tăng `view_count`
- **`key` visible với:** AX_CREATOR là owner, AX_SUPPORTER, ADMIN
- **Role:** USER, AX_SUPPORTER, ADMIN

#### FR-LIB-04 — Like BP
- **Mô tả:** User like/unlike BP từ trang detail
- **Logic:** toggle — like lần 1 → thêm; like lần 2 → bỏ
- **Ràng buộc:** mỗi user chỉ like được 1 lần; `like_count` cập nhật atomic
- **Role:** USER, AX_SUPPORTER, ADMIN

#### FR-LIB-05 — Sort & Filter
- **Mô tả:** Lọc và sắp xếp danh sách BP trong Library
- **Filter by:** job, AI capability, work category, work, department, BP type, AI tool
- **Sort by:** job, work category, work
- **Ví dụ job values:** Code Implementation, Research, Operation, Report
- **Ví dụ AI capability values:** Q&A, Workflow Assistant, Autonomous AI Agent, AI-based Tools & Applications, AI Orchestration
- **Role:** USER, AX_SUPPORTER, ADMIN

---

### 5.2 Epic: My Practice

#### FR-MY-01 — View List My BP
- **Mô tả:** AX Creator xem danh sách tất cả BP của mình (mọi trạng thái)
- **Columns:** thumbnail, BP name, BP type, status, job, AI capability, submitter, submitted date, comment (từ reviewer), action (edit, delete)
- **Role:** AX_CREATOR

#### FR-MY-02 — Edit BP
- **Mô tả:** Edit BP theo trạng thái hiện tại
- **Logic theo status:**

| Status | Điều kiện edit | Kết quả |
|--------|---------------|---------|
| `REQUESTED` | Edit tự do tất cả fields | Status không đổi (`REQUESTED`) |
| `PUBLISHED` | Sửa file hoặc URL cài đặt | Status → `REQUESTED`, BP ẩn khỏi library chờ review |
| `PUBLISHED` | Không sửa file/URL cài đặt | Status giữ nguyên `PUBLISHED`, BP vẫn hiển thị |
| `REJECTED` | Edit bất kỳ field | Status → `REQUESTED` (submit lại) |

- **Role:** AX_CREATOR (chỉ BP của mình)

#### FR-MY-03 — Delete BP
- **Mô tả:** Xóa BP
- **UX:** Hiển thị popup confirm trước khi xóa
- **Điều kiện:** Chỉ xóa BP của mình; bất kỳ status nào
- **Role:** AX_CREATOR

---

### 5.3 Epic: Manage Best Practice

#### FR-MGT-01 — View List BP (Supporter View)
- **Mô tả:** Xem danh sách tất cả BP để quản lý
- **Columns:** thumbnail, BP name, BP type, status, job, AI capability, submitter, submitted date, comment, action (review / close)
- **Filter:** theo type, status, job, AI capability
- **Click BP name:** mở BP detail (key visible)
- **Role:** AX_SUPPORTER, ADMIN

#### FR-MGT-02 — Review BP
- **Mô tả:** Approve hoặc reject BP
- **Điều kiện:** BP phải có status = `REQUESTED`
- **Approve:** status → `PUBLISHED`; BP hiển thị trên Library
- **Reject:** status → `REJECTED`; nhập comment lý do (bắt buộc)
- **Popup:** nhập comment trước khi xác nhận
- **Ràng buộc:** AX Supporter không được approve BP mà mình là creator
- **Role:** AX_SUPPORTER, ADMIN

#### FR-MGT-03 — Close BP
- **Mô tả:** Đóng BP đang published
- **Điều kiện:** BP phải có status = `PUBLISHED`
- **Action:** status → `REJECTED`; nhập close reason (popup riêng biệt với review)
- **Ý nghĩa:** BP ẩn khỏi library; Creator có thể edit và submit lại
- **Role:** AX_SUPPORTER, ADMIN

---

### 5.4 Epic: Master Data

#### FR-MDATA-01 — Manage Job
- **Mô tả:** CRUD danh mục Job
- **Fields:** `name` (text, ≤256 ký tự, unique), `description` (text, ≤4096 ký tự)
- **Validation:** duplicate name bị chặn
- **Upload:** import từ file template (Excel/CSV)
- **Role:** ADMIN

#### FR-MDATA-02 — Manage Work Category
- **Mô tả:** CRUD danh mục Work Category
- **Fields:** `job` (chọn từ Job list), `name` (text, ≤256 ký tự), `description` (text, ≤4096 ký tự)
- **Validation:** trong cùng 1 job, không có work category trùng name
- **Upload:** import từ file template
- **Role:** ADMIN

#### FR-MDATA-03 — Manage Work
- **Mô tả:** CRUD danh mục Work
- **Fields:**
  - `job`: chọn từ Job list
  - `work_category`: chọn từ Work Category list (filter theo job; nếu đổi job → reset work category)
  - `name`: text, ≤256 ký tự
  - `code`: text, ≤50 ký tự, unique toàn hệ thống
  - `description`: text, ≤4096 ký tự
- **Upload:** import từ file template
- **Role:** ADMIN

#### FR-MDATA-04 — Manage AI Capability
- **Mô tả:** CRUD danh mục AI Capability
- **Fields:** `name` (text, ≤256 ký tự, unique)
- **Seed data (5 defaults):**
  1. Q&A
  2. Workflow Assistant
  3. Autonomous AI Agent
  4. AI-based Tools & Applications
  5. AI Orchestration
- **Role:** ADMIN

---

### 5.5 Epic: User Management

#### FR-USER-01 — Manage User & Permission
- **Mô tả:** Admin assign role elevated cho user
- **Roles có thể assign:** `ADMIN`, `AX_SUPPORTER`
- **Lưu ý:** `USER → AX_CREATOR` tự động khi tạo BP đầu tiên (không cần Admin)
- **Role:** ADMIN

---

### 5.6 Epic: Dashboard & Monitoring

#### FR-DASH-01 — Monitor Dashboard
- **Mô tả:** Dashboard tổng quan
- **Metrics:**
  - Số người đã submit BP (submitters count)
  - Tổng BP đã published
  - Count by job
  - Count by AI capability
  - Count by department (= SRV Group từ CIP/AD)
  - Top 5 Best Practice by work (số BP theo work, giảm dần)
  - Total usage (tổng lượt install/download)
  - Active users (users có interaction trong kỳ)
  - Usage trend (biểu đồ 6 tháng gần nhất)
  - Top 5 usage (số lượt theo BP, giảm dần)
- **Interaction:**
  - "View more" trên Top 5 → chuyển sang Library, sort theo số lượng từ cao xuống thấp
  - Click 1 rank trong Top 5 → Library, filter theo job/work đó
- **Filter:** theo khoảng ngày
- **Role:** tất cả roles (USER, AX_CREATOR, AX_SUPPORTER, ADMIN)

---

### 5.7 Epic: AI Code Insight

#### FR-INSIGHT-01 — AI Capability Classification
- **Mô tả:** Trang giới thiệu 5 loại AI capability với mô tả embodiments & scope

| AI Capability | Embodiments | Scope |
|--------------|-------------|-------|
| Q&A | Prompting templates, chatbots | Individual / nhóm nhỏ specific |
| Workflow Assistant | Cline rules/skills/workflows, MCP implementations/configs, custom workflows | Across Dept/group cùng job; giải quyết một số bước |
| Autonomous AI Agent | Standalone AI agents (tools + execute actions), multi-agent systems | Company-wide với general purposes |
| AI-based Tools & Applications | Fine-tuned models/tools for specific purpose | Specific technical domain, design solutions |
| AI Orchestration | AI-driven products | AI-driven UX, AI-driven logic and workflows |

- **Role:** tất cả roles

---

## 6. Non-Functional Requirements

### 6.1 Performance
- p95 response time < 3s cho thao tác cơ bản (view list, view detail, submit)
- Hỗ trợ > 200 concurrent users
- Đo bằng JMeter / k6

### 6.2 Security
- **Authentication:** Samsung CIP/AD OAuth 2.0/SSO (triển khai P11); dev dùng mock user
- **Authorization:** RBAC — mỗi role chỉ truy cập resource được phân quyền
- **OWASP Top 10 cơ bản:** parameterized queries (SQL injection), sanitize input (XSS), CSRF token
- **Session timeout:** 30 phút

### 6.3 Internationalization
- Hỗ trợ tiếng Anh (EN) và tiếng Việt (VI)
- Ngôn ngữ mặc định: EN

### 6.4 Accessibility
- Tiêu chuẩn WCAG 2.1 AA

### 6.5 Responsive
- Hỗ trợ desktop, tablet, mobile

### 6.6 Quality
- SonarQube + JaCoCo coverage report
- CI/CD pipeline kiểm tra coverage tự động
- 100% API endpoint có Swagger/OpenAPI documentation

### 6.7 File Storage
- File upload (TOOL/EXTENSION): lưu vào Docker volume (local filesystem)
- File size tối đa: 50MB per file

---

## 7. Constraints & Assumptions

- Login qua Samsung CIP/AD; dev dùng mock SSO (auth tích hợp thật ở Phase P11)
- Không có versioning cho BP — edit published BP = resubmit để review
- Department lấy từ CIP/AD khi SSO; P0–P10 dùng giá trị hardcode
- "Token count per user/project" cần nối hệ thống khác — không implement trong scope này
- Thumbnail: nhận URL string (không upload file thumbnail)
- Notification: chỉ email (không có in-app notification)
```

- [ ] **Step 2: Kiểm tra doc self-contained**

Đọc lại file và xác nhận:
- Tất cả 18 FRs có mặt đầy đủ
- Bảng edit logic FR-MY-02 có đủ 3 case (REQUESTED / PUBLISHED / REJECTED)
- State machine chỉ có 3 trạng thái (không có CLOSED)
- NFR section đầy đủ 7 mục
- Không có chữ "xem doc khác" hay "theo phiên bản trước"

- [ ] **Step 3: Commit**

```bash
git add docs/2026-05-10-axon-requirements.md
git commit -m "docs: rewrite axon requirements v2.0 — 18 FRs, 3 statuses, new NFRs"
```

---

## Task 2: Chỉnh sửa HLD.md — Infrastructure & State Machine

**Files:**
- Modify: `docs/2026-05-10-axon-hld.md`

- [ ] **Step 1: Cập nhật dòng header System Overview (§1)**

Tìm dòng:
```
| Infrastructure | PostgreSQL, Redis, MinIO | Dữ liệu, session/cache, file storage |
```
Thay bằng:
```
| Infrastructure | PostgreSQL, Redis, Docker Volume | Dữ liệu, session/cache, file storage |
```

- [ ] **Step 2: Cập nhật Architecture Diagram (§2)**

Tìm và xoá toàn bộ box `MinIO` trong diagram:
```
│                    ┌────────────▼┐  ┌──▼───┐  ┌▼──────────┐         │
│                    │ PostgreSQL  │  │Redis │  │  MinIO    │         │
│                    │ (Port 5432) │  │6379  │  │  (9000)   │         │
│                    └─────────────┘  └──────┘  └───────────┘         │
```
Thay bằng:
```
│                    ┌────────────▼┐  ┌──▼───┐  ┌▼──────────────┐    │
│                    │ PostgreSQL  │  │Redis │  │ Docker Volume │    │
│                    │ (Port 5432) │  │6379  │  │ (file storage)│    │
│                    └─────────────┘  └──────┘  └───────────────┘    │
```

- [ ] **Step 3: Cập nhật Frontend module list (§3.1)**

Tìm:
```
├── Dashboard Module  — Monitoring stats (AX Supporter)
└── Admin Module      — User management (Admin)
```
Thay bằng:
```
├── Dashboard Module  — Monitoring stats (tất cả roles)
├── MasterData Module — Quản lý Job, WorkCategory, Work, AI Capability (Admin)
├── AIInsight Module  — Phân loại 5 AI capability types
└── Admin Module      — User management (Admin)
```

- [ ] **Step 4: Cập nhật Backend package list (§3.2)**

Tìm:
```
├── file/             — Upload/download qua MinIO, pre-signed URL
```
Thay bằng:
```
├── file/             — Upload/download qua Docker volume (local filesystem)
```

Tìm:
```
└── notification/     — Email notification service
```
Thay bằng:
```
├── masterdata/       — CRUD Job, WorkCategory, Work, AICapability (Admin)
├── aiinsight/        — Static content: 5 AI capability classifications
└── notification/     — Email notification service
```

- [ ] **Step 5: Cập nhật Database lookup tables count (§3.3)**

Tìm:
```
**Lookup tables (6):** `jobs`, `ai_capabilities`, `work_categories`, `works`, `departments`, `ai_tools`
```
Thay bằng:
```
**Lookup tables (5):** `jobs`, `ai_capabilities`, `work_categories`, `works`, `departments`
```
*(bỏ `ai_tools` vì AI tool không còn là bảng lookup riêng — chỉ là text field trên BP)*

- [ ] **Step 6: Cập nhật File Store section (§3.5)**

Tìm toàn bộ section `### 3.5 File Store (MinIO)` và thay bằng:

```markdown
### 3.5 File Store (Docker Volume)

- Mount path trong container: `/app/uploads`
- Host mount: `./uploads:/app/uploads` trong Docker Compose
- File key pattern: `{best_practice_id}/{original_filename}`
- Download: Backend stream file từ volume, kiểm tra JWT + quyền trước khi serve
- Chỉ áp dụng với BP type TOOL và EXTENSION
```

- [ ] **Step 7: Cập nhật BP Status State Machine (§4.2)**

Tìm toàn bộ section `### 4.2 BP Status State Machine` và thay bằng:

```markdown
### 4.2 BP Status State Machine

```
REQUESTED ─── approve ──► PUBLISHED ─── close ──► REJECTED
    ▲                                                  │
    └──────────── Creator edit + resubmit ─────────────┘
    │
    ◄── reject ── REQUESTED
```

Transition rules:
- Chỉ AX Supporter/Admin mới được approve / reject / close
- AX Supporter không thể approve BP mà mình là creator
- **3 trạng thái:** REQUESTED / PUBLISHED / REJECTED (không có CLOSED)
- Close = `PUBLISHED → REJECTED`; creator vẫn có thể edit và resubmit
- Edit PUBLISHED BP:
  - Sửa file/URL cài đặt → auto `REQUESTED` (BP ẩn)
  - Không sửa file/URL → giữ `PUBLISHED`
```

- [ ] **Step 8: Cập nhật File Download Security (§4.3)**

Tìm toàn bộ section `### 4.3 File Download Security` và thay bằng:

```markdown
### 4.3 File Download

Files không public. Mọi download đều qua:
1. Backend kiểm tra JWT + quyền xem BP
2. Backend stream file từ Docker volume
3. Backend ghi log DOWNLOAD (bp_downloads table)

Không dùng pre-signed URL (không còn MinIO).
```

- [ ] **Step 9: Cập nhật Deployment Architecture (§6)**

Tìm section Dev Docker Compose:
```yaml
services:
  axon-backend:  # Spring Boot, port 8080
  axon-frontend: # Vite dev server, port 5173
  postgres:      # PostgreSQL 16, port 5432
  redis:         # Redis 7, port 6379
  minio:         # MinIO, port 9000 (API) + 9001 (console)
```
Thay bằng:
```yaml
services:
  axon-backend:  # Spring Boot, port 8080
  axon-frontend: # Vite dev server, port 5173
  postgres:      # PostgreSQL 16, port 5432
  redis:         # Redis 7, port 6379
  # volumes: uploads (Docker volume mount for file storage)
```

Tìm và xoá dòng MinIO trong Production section:
```
Secret:     axon-secrets (DB creds, JWT secret, MinIO creds, CIP/AD client secret)
```
Thay bằng:
```
Secret:     axon-secrets (DB creds, JWT secret, CIP/AD client secret)
```

Tìm:
```
- MinIO: on-prem hoặc S3 compatible
```
Và xoá dòng đó.

- [ ] **Step 10: Cập nhật Non-Functional Design table (§8)**

Tìm:
```
| File storage | MinIO tách biệt khỏi app server — scale độc lập |
```
Thay bằng:
```
| File storage | Docker volume mount — đơn giản, phù hợp dev/staging; backup riêng cho prod |
```

- [ ] **Step 11: Cập nhật Technology Stack Summary (§9)**

Tìm:
```
| File Store | MinIO | S3-compatible, self-hosted, dễ thay bằng S3 |
```
Thay bằng:
```
| File Store | Docker Volume (local FS) | Đơn giản, không cần service ngoài; prod cần backup policy |
```

- [ ] **Step 12: Thêm section Auth Strategy cuối file**

Thêm section mới sau §9:

```markdown
---

## 10. Auth Strategy

**Development (P0–P10):** MockSSOProvider — trả về hardcoded users với role khác nhau để test nghiệp vụ.

**Production (P11):** Samsung CIP/AD OAuth 2.0/SSO:
- Browser redirect → CIP/AD login
- Callback → backend exchange code → get user info (name, email, department)
- Backend upsert user trong DB → issue JWT pair (access 15m, refresh 7d)
- Department tự động map từ CIP/AD

```
SSOProvider (interface)
  ├── MockSSOProvider  (dev — hardcoded users per role)
  └── CIPADProvider    (prod — Samsung CIP/AD OAuth 2.0)
```

Security scope: delegated to Samsung CIP/AD. App enforces RBAC only.
```

- [ ] **Step 13: Đọc lại toàn bộ HLD.md, xác nhận không còn chữ "MinIO" nào**

```bash
grep -n "MinIO\|minio\|Minio" docs/2026-05-10-axon-hld.md
```

Kết quả mong đợi: không có dòng nào.

- [ ] **Step 14: Commit**

```bash
git add docs/2026-05-10-axon-hld.md
git commit -m "docs: update HLD — remove MinIO, add new modules, fix state machine (3 statuses)"
```

---

## Task 3: Chỉnh sửa DLD.md — Schema

**Files:**
- Modify: `docs/2026-05-10-axon-dld.md`

- [ ] **Step 1: Cập nhật `bp_status` enum trong DDL**

Tìm:
```sql
CREATE TYPE bp_status AS ENUM ('REQUESTED', 'REJECTED', 'PUBLISHED', 'CLOSED');
```
Thay bằng:
```sql
CREATE TYPE bp_status AS ENUM ('REQUESTED', 'REJECTED', 'PUBLISHED');
-- Không có CLOSED. Action "close" = PUBLISHED → REJECTED.
```

- [ ] **Step 2: Cập nhật `review_action` enum**

Tìm:
```sql
CREATE TYPE review_action AS ENUM ('APPROVED', 'REJECTED', 'CLOSED');
```
Thay bằng:
```sql
CREATE TYPE review_action AS ENUM ('APPROVED', 'REJECTED', 'CLOSED');
-- CLOSED vẫn dùng trong bp_reviews để phân biệt lý do reject là "close" hay "review reject"
```

- [ ] **Step 3: Cập nhật bảng `jobs`**

Tìm:
```sql
CREATE TABLE jobs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);
```
Thay bằng:
```sql
CREATE TABLE jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(256) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 4: Cập nhật bảng `ai_capabilities`**

Tìm:
```sql
CREATE TABLE ai_capabilities (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);
```
Thay bằng:
```sql
CREATE TABLE ai_capabilities (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(256) NOT NULL UNIQUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 5: Cập nhật bảng `work_categories`**

Tìm:
```sql
CREATE TABLE work_categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);
```
Thay bằng:
```sql
CREATE TABLE work_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID NOT NULL REFERENCES jobs(id),
    name        VARCHAR(256) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, name)   -- unique name per job
);
```

- [ ] **Step 6: Cập nhật bảng `works`**

Tìm:
```sql
CREATE TABLE works (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100) NOT NULL,
    work_category_id UUID REFERENCES work_categories(id)
);
```
Thay bằng:
```sql
CREATE TABLE works (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id           UUID NOT NULL REFERENCES jobs(id),
    work_category_id UUID NOT NULL REFERENCES work_categories(id),
    name             VARCHAR(256) NOT NULL,
    code             VARCHAR(50) NOT NULL UNIQUE,
    description      TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 7: Cập nhật bảng `bp_files` — thay storage_key bằng file_path**

Tìm:
```sql
CREATE TABLE bp_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100),
    storage_key VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```
Thay bằng:
```sql
CREATE TABLE bp_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bp_id       UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_size   BIGINT NOT NULL,
    mime_type   VARCHAR(100),
    file_path   VARCHAR(500) NOT NULL,  -- absolute path trong Docker volume
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 8: Cập nhật xử lý `departments` — đổi sang VARCHAR string trong users**

Thay vì bảng `departments` riêng (FK), lưu department trực tiếp trong `users` để đơn giản hóa (giá trị lấy từ CIP/AD khi SSO).

Trong DDL bảng `users`, tìm:
```sql
    department_id UUID REFERENCES departments(id),
```
Thay bằng:
```sql
    department    VARCHAR(256),   -- SRV Group từ CIP/AD, lưu thẳng string
```

Xoá bảng `departments` và junction table `bp_departments` khỏi DDL:
```sql
-- XOÁ các block sau:
CREATE TABLE departments (
    ...
);
CREATE TABLE bp_departments (
    ...
);
```

Cập nhật ERD: bỏ `departments (1) ──── users` và `bp_departments`.

- [ ] **Step 9: Xoá bảng `ai_tools` (không còn là lookup table riêng)**

Tìm và xoá:
```sql
CREATE TABLE ai_tools (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);
```
Và xoá các junction tables liên quan:
```sql
CREATE TABLE bp_ai_tools (
    bp_id       UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
    ai_tool_id  UUID NOT NULL REFERENCES ai_tools(id),
    PRIMARY KEY (bp_id, ai_tool_id)
);
```

- [ ] **Step 10: Thêm field `ai_tools_description` vào `best_practices`**

Tìm trong DDL của `best_practices`:
```sql
    key_value         TEXT,                      -- nhạy cảm, masked với USER role
```
Thêm sau dòng đó:
```sql
    ai_tools_description TEXT,                 -- mô tả AI tools sử dụng (text tự do)
```

- [ ] **Step 11: Cập nhật Seed Data**

Tìm:
```sql
INSERT INTO ai_capabilities (name, display_order) VALUES
    ('Q&A', 1),
    ('Workflow Assistant', 2),
    ('Auto AI Agent', 3),
    ('AI Orchestration', 4);
```
Thay bằng:
```sql
INSERT INTO ai_capabilities (name, is_default) VALUES
    ('Q&A', TRUE),
    ('Workflow Assistant', TRUE),
    ('Autonomous AI Agent', TRUE),
    ('AI-based Tools & Applications', TRUE),
    ('AI Orchestration', TRUE);
```
*(5 defaults; tên chuẩn theo spec)*

- [ ] **Step 12: Cập nhật ERD text (§1.1) phản ánh schema mới**

Tìm ERD hiện tại và thay bằng:
```
jobs (1) ──────────────── (*) work_categories (1) ──── (*) works (1) ──── (*) best_practices
ai_capabilities (1) ─────────── (*) bp_ai_capabilities ─────────────────────────── │
departments (1) ──────────────────────────────────────────────────────────── users  │
users (1) ──────────────────── (*) bp_creators ───────────────────────────────────── │
                                                                                      │
                                                          ├──── (*) bp_files
                                                          ├──── (*) bp_likes ─── users
                                                          ├──── (*) bp_feedback ─ users
                                                          ├──── (*) bp_downloads ─ users
                                                          └──── (*) bp_reviews ── users
```

- [ ] **Step 13: Kiểm tra không còn ai_tools và departments table reference nào**

```bash
grep -n "ai_tool\|AiTool\|aitool" docs/2026-05-10-axon-dld.md | grep -v "ai_tools_description"
grep -n "department_id\|bp_departments\|CREATE TABLE departments" docs/2026-05-10-axon-dld.md
```

Kết quả mong đợi: không có dòng nào.

- [ ] **Step 14: Commit**

```bash
git add docs/2026-05-10-axon-dld.md
git commit -m "docs: update DLD schema — remove MinIO/ai_tools, fix enums, update lookup tables"
```

---

## Task 4: Chỉnh sửa DLD.md — API & Business Logic

**Files:**
- Modify: `docs/2026-05-10-axon-dld.md`

- [ ] **Step 1: Cập nhật Backend Package Structure (§2) — bỏ MinIO, thêm modules mới**

Tìm:
```
├── config/
│   ├── SecurityConfig.java          -- Spring Security, CORS, JWT filter
│   ├── RedisConfig.java             -- RedisTemplate, connection
│   ├── MinioConfig.java             -- MinioClient bean
│   └── WebMvcConfig.java            -- CORS, Jackson config
```
Thay bằng:
```
├── config/
│   ├── SecurityConfig.java          -- Spring Security, CORS, JWT filter
│   ├── RedisConfig.java             -- RedisTemplate, connection
│   ├── StorageConfig.java           -- Docker volume base path config
│   └── WebMvcConfig.java            -- CORS, Jackson config
```

Tìm:
```
├── file/
│   ├── BpFile.java                  -- @Entity
│   ├── BpFileRepository.java
│   ├── FileService.java             -- upload to MinIO, generate presigned URL
│   ├── FileController.java          -- POST /files, GET /files/:id/download
│   └── dto/FileResponse.java
```
Thay bằng:
```
├── file/
│   ├── BpFile.java                  -- @Entity
│   ├── BpFileRepository.java
│   ├── FileService.java             -- upload/download từ Docker volume (local filesystem)
│   ├── FileController.java          -- POST /files, GET /files/:id/download (stream)
│   └── dto/FileResponse.java
```

Tìm:
```
└── notification/     — Email notification service
```
Thay bằng:
```
├── masterdata/       — CRUD Job, WorkCategory, Work, AICapability (Admin)
│   ├── job/          — JobController, JobService, Job entity
│   ├── workcategory/ — WorkCategoryController, WorkCategoryService
│   ├── work/         — WorkController, WorkService
│   └── aicapability/ — AiCapabilityController, AiCapabilityService
├── aiinsight/        — Static content: 5 AI capability classifications
│   └── AiInsightController.java     -- GET /api/v1/ai-insight (no DB, hardcoded content)
└── notification/     — Email notification service
```

- [ ] **Step 2: Cập nhật API file download — bỏ MinIO presigned URL (§3.2)**

Tìm:
```
GET /api/v1/best-practices/:id/files/:fileId/download
  Auth: required
  Response 302: redirect to MinIO pre-signed URL (TTL 15 min)
  Side effect: log download (async)
```
Thay bằng:
```
GET /api/v1/best-practices/:id/files/:fileId/download
  Auth: required
  Response 200: file binary stream (Content-Disposition: attachment)
  Headers: Content-Type (mime_type), Content-Length (file_size)
  Side effect: log download (async)
```

- [ ] **Step 3: Cập nhật file upload endpoint (§3.3)**

Tìm:
```
POST /api/v1/best-practices/:id/files
  Auth: required (creator or SUPPORTER or ADMIN)
  Constraint: BP type phải là TOOL hoặc EXTENSION
  Content-Type: multipart/form-data
  Body: file (binary, max 50MB)
  Response 201: FileResponse { id, file_name, file_size, mime_type, uploaded_at }
```
Thay bằng:
```
POST /api/v1/best-practices/:id/files
  Auth: required (creator or SUPPORTER or ADMIN)
  Constraint: BP type phải là TOOL hoặc EXTENSION; file size ≤ 50MB
  Content-Type: multipart/form-data
  Body: file (MultipartFile)
  Response 201: FileResponse { id, file_name, file_size, mime_type, file_path, uploaded_at }
  Storage: lưu tại {volumeBasePath}/{bpId}/{uuid}_{original_filename}
```

- [ ] **Step 4: Cập nhật PUT edit BP — thêm logic 3-case (§3.3)**

Tìm:
```
PUT /api/v1/best-practices/:id
  Auth: required (creator or ADMIN)
  Constraint: status=REQUESTED hoặc REJECTED
  Body: same as POST (trừ creator_ids)
  Response 200: BestPracticeResponse
```
Thay bằng:
```
PUT /api/v1/best-practices/:id
  Auth: required (creator or ADMIN)
  Body: same as POST (trừ creator_ids)
  Response 200: BestPracticeResponse

  Status transition rules:
  - status=REQUESTED → edit tự do → status không đổi
  - status=REJECTED  → edit bất kỳ field → status → REQUESTED
  - status=PUBLISHED, có thay đổi web_content hoặc files → status → REQUESTED (BP ẩn)
  - status=PUBLISHED, không thay đổi web_content/files → status giữ PUBLISHED
```

- [ ] **Step 5: Cập nhật close endpoint — status về REJECTED (§3.4)**

Tìm:
```
PUT /api/v1/management/best-practices/:id/close
  Auth: AX_SUPPORTER+
  Constraint: status=PUBLISHED
  Body: { "reason": "string (required)" }
  Response 200: BestPracticeResponse (status=CLOSED)
  Side effect: email notify AX Creator
```
Thay bằng:
```
PUT /api/v1/management/best-practices/:id/close
  Auth: AX_SUPPORTER+
  Constraint: status=PUBLISHED
  Body: { "reason": "string (required)" }
  Response 200: BestPracticeResponse (status=REJECTED, close_reason populated)
  Side effect: email notify AX Creator
  Note: "close" là action riêng; status = REJECTED nhưng bp_reviews.action = CLOSED
```

- [ ] **Step 6: Cập nhật Dashboard API — mở rộng response (§3.6)**

Tìm section `### 3.6 Dashboard` và thay bằng:

```
### 3.6 Dashboard

GET /api/v1/dashboard
  Auth: required (tất cả roles)
  Query: startDate (ISO date, optional), endDate (ISO date, optional)
  Response 200:
    {
      "total_submitters": 35,
      "total_published_bps": 95,
      "by_job": [{ "job": { "id", "name" }, "count": 23 }],
      "by_ai_capability": [{ "capability": { "id", "name" }, "count": 40 }],
      "by_department": [{ "department": "R&D", "count": 18 }],
      "top5_bps_by_work": [
        { "work": { "id", "name", "work_category": { "name" } }, "bp_count": 23 }
      ],
      "total_usage": 1250,
      "active_users": 87,
      "usage_trend": [
        { "month": "2025-12", "count": 180 },
        { "month": "2026-01", "count": 210 }
      ],
      "top5_usage": [
        { "bp": { "id", "name" }, "usage_count": 320 }
      ]
    }
  Cache: Redis, TTL 15 phút
```

- [ ] **Step 7: Thêm Master Data API section mới (§3.8)**

Thêm section sau Dashboard (§3.6 hoặc sau Lookup section):

```markdown
### 3.8 Master Data (Admin)

#### Jobs
GET /api/v1/admin/master-data/jobs
  Auth: ADMIN
  Response 200: [{ id, name, description, created_at }]

POST /api/v1/admin/master-data/jobs
  Auth: ADMIN
  Body: { "name": "string (max 256, unique)", "description": "string (max 4096)" }
  Response 201: { id, name, description, created_at }

PUT /api/v1/admin/master-data/jobs/:id
  Auth: ADMIN
  Body: { "name": "string", "description": "string" }
  Response 200: { id, name, description }

DELETE /api/v1/admin/master-data/jobs/:id
  Auth: ADMIN
  Constraint: không có WorkCategory nào reference job này
  Response 204

POST /api/v1/admin/master-data/jobs/upload
  Auth: ADMIN
  Content-Type: multipart/form-data
  Body: file (Excel/CSV template)
  Response 200: { "imported": 10, "skipped": 2, "errors": [] }

#### Work Categories
GET /api/v1/admin/master-data/work-categories?jobId=UUID
  Auth: ADMIN
  Response 200: [{ id, job: { id, name }, name, description }]

POST /api/v1/admin/master-data/work-categories
  Body: { "job_id": "UUID", "name": "string (max 256)", "description": "string (max 4096)" }
  Response 201

PUT /api/v1/admin/master-data/work-categories/:id
  Body: { "name": "string", "description": "string" }
  Response 200

DELETE /api/v1/admin/master-data/work-categories/:id
  Constraint: không có Work nào reference work_category này
  Response 204

POST /api/v1/admin/master-data/work-categories/upload
  Body: file (Excel/CSV)
  Response 200: { "imported": N }

#### Works
GET /api/v1/admin/master-data/works?workCategoryId=UUID
  Response 200: [{ id, job, work_category, name, code, description }]

POST /api/v1/admin/master-data/works
  Body: { "job_id", "work_category_id", "name", "code", "description" }
  Response 201

PUT /api/v1/admin/master-data/works/:id
  Body: { "name", "code", "description" }
  Response 200

DELETE /api/v1/admin/master-data/works/:id
  Constraint: không có BP nào reference work này
  Response 204

POST /api/v1/admin/master-data/works/upload
  Response 200: { "imported": N }

#### AI Capabilities
GET /api/v1/admin/master-data/ai-capabilities
  Response 200: [{ id, name, is_default }]

POST /api/v1/admin/master-data/ai-capabilities
  Body: { "name": "string (max 256, unique)" }
  Response 201

PUT /api/v1/admin/master-data/ai-capabilities/:id
  Body: { "name": "string" }
  Response 200

DELETE /api/v1/admin/master-data/ai-capabilities/:id
  Constraint: không có BP nào reference ai_capability này
  Response 204
```

- [ ] **Step 8: Thêm AI Insight API section mới (§3.9)**

```markdown
### 3.9 AI Insight

GET /api/v1/ai-insight
  Auth: required (tất cả roles)
  Response 200: hardcoded content, không query DB
    {
      "classifications": [
        {
          "name": "Q&A",
          "description": "BPs to use AI as a search engine, looking for the answer of simple repetitive questions",
          "embodiments": ["Prompting templates", "Chatbots"],
          "scope": "Apply individually, can be shared among a small specific team"
        },
        {
          "name": "Workflow Assistant",
          "description": "BPs help to use AI as a collaborator to solve or execute some steps of a job",
          "embodiments": ["Cline rules/skills/workflows", "MCP implementations/configurations", "Custom workflows"],
          "scope": "Can be shared across Dept or group with the same job"
        },
        {
          "name": "Autonomous AI Agent",
          "description": "BPs to build AI agents that automatically decide and implement tasks using determined tools",
          "embodiments": ["Standalone AI agents", "Multi-agent systems"],
          "scope": "Can serve company-wide with general purposes"
        },
        {
          "name": "AI-based Tools & Applications",
          "description": "BPs that build and deploy specific purpose AI-based tools",
          "embodiments": ["Fine-tuned models/tools for specific purpose"],
          "scope": "Master in a specific technical domain, design solutions"
        },
        {
          "name": "AI Orchestration",
          "description": "BPs to create an AI agent to analyze, select and organize other agents to solve complex problems",
          "embodiments": ["AI-driven products"],
          "scope": "AI-driven user experience, AI-driven logic and workflows"
        }
      ]
    }
```

- [ ] **Step 9: Kiểm tra không còn MinIO reference trong DLD**

```bash
grep -n "MinIO\|minio\|presigned\|pre-signed\|storage_key" docs/2026-05-10-axon-dld.md
```

Kết quả mong đợi: không có dòng nào.

- [ ] **Step 10: Commit**

```bash
git add docs/2026-05-10-axon-dld.md
git commit -m "docs: update DLD API — file stream download, edit 3-case logic, master data APIs, AI insight"
```

---

## Task 5: Viết lại implementation-plan.md

**Files:**
- Modify: `docs/2026-05-10-axon-implementation-plan.md`

- [ ] **Step 1: Xoá toàn bộ nội dung cũ và thay bằng nội dung sau**

> Viết đầy đủ từng phase. Mỗi phase có: mục tiêu, danh sách task BE + FE, test, commit.

```markdown
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
| P6 | Manage BP (Supporter) — view, review, close | Supporter review được |
| P7 | Interactions — like, feedback, download tracking | Engagement features |
| P8 | Dashboard & monitoring | Dashboard đầy đủ metrics |
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
- `V1__create_lookup_tables.sql` — jobs, ai_capabilities, work_categories, works, departments
- `V2__create_users.sql` — users table, user_role enum
- `V3__create_best_practices.sql` — best_practices, bp_status enum, bp_type enum
- `V4__create_junction_tables.sql` — bp_creators, bp_jobs, bp_ai_capabilities
- `V5__create_bp_files.sql` — bp_files table
- `V6__create_interactions.sql` — bp_likes, bp_feedback, bp_downloads
- `V7__create_reviews.sql` — bp_reviews, review_action enum
- `V8__seed_data.sql` — seed 4 jobs, 5 ai_capabilities (is_default=true)

DDL theo schema đã định nghĩa trong DLD §1.2 (phiên bản đã cập nhật).

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

### P3-BE-01: File upload service

- `FileService.upload(MultipartFile, bpId)`:
  - Validate: size ≤ 50MB, mime type allowed
  - Save to: `{volumeBasePath}/{bpId}/{UUID}_{originalFilename}`
  - Persist `BpFile` entity với `file_path`
- `FileService.download(fileId)`:
  - Load `BpFile`, stream file từ `file_path`
  - Throw `FileNotFoundException` nếu không tồn tại
- `FileController`: `POST /api/v1/best-practices/:id/files`, `GET .../files/:fileId/download`

### P3-BE-02: BP CRUD

- Entity `BestPractice` với tất cả fields theo DLD
- `BestPracticeService.create(request, currentUser)`:
  - Validate fields
  - Tạo BP với status=REQUESTED
  - Auto-promote submitter USER → AX_CREATOR nếu cần
  - Associate creators, ai_capabilities
- `BestPracticeService.findAll(filter, pageable)`: chỉ trả PUBLISHED; support filter/sort
- `BestPracticeService.findById(id, currentUser)`: tăng view_count async; mask key_value nếu role=USER
- `BestPracticeController`: `GET /api/v1/best-practices`, `GET /:id`, `POST`

### P3-FE-01: Library page

- `/library` — grid card view; filter sidebar (job, AI capability, type, work...); sort dropdown
- Card component: thumbnail, name, description (truncated), work, creator chips
- Pagination

### P3-FE-02: Register BP form

- `/library/register` (hoặc `/my-practice/new`)
- Multi-step form hoặc single long form
- Conditional upload: type=WEB → text input; type=TOOL/EXTENSION → file upload (max 50MB, progress bar)
- Creator search: mock CIP search (search users by name)

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
  - status=REJECTED: update → status=REQUESTED
  - status=PUBLISHED + thay đổi web_content hoặc files → status=REQUESTED (BP ẩn)
  - status=PUBLISHED + không thay đổi web_content/files → giữ PUBLISHED
- Detection "có thay đổi file": so sánh danh sách file mới với file cũ; hoặc flag `installationChanged` trong request

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
- Response columns: thumbnail, name, type, status, job, ai_capability, submitter, submitted_date, comment (lấy từ bp_reviews cuối cùng)

### P5-FE-01: My Practice page

- `/my-practice` — table view
- Status badge: REQUESTED (yellow), PUBLISHED (green), REJECTED (red)
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
  - Atomic: dùng `@Transactional` + UPDATE ... SET like_count = like_count ± 1
- `POST /api/v1/best-practices/:id/like`

### P6-BE-02: Feedback

- `POST /api/v1/best-practices/:id/feedback` — body: `{ content: string (max 2000) }`
- `GET /api/v1/best-practices/:id/feedback` — paginated

### P6-BE-03: Download tracking (async)

- Sau khi stream file thành công → async log `BpDownload` + tăng `download_count`

### P6-FE-01: Like button + feedback section trong Detail page

- Like button: heart icon, count, đổi trạng thái optimistically
- Feedback: textarea + submit; list feedback bên dưới

**Commit:** `feat: interactions — like toggle, feedback, download tracking`

---

## P7 — Dashboard & Monitoring

**Mục tiêu:** Dashboard hiển thị đầy đủ metrics cho tất cả roles.

### P7-BE-01: Dashboard service

- `DashboardService.getStats(startDate, endDate)`:
  - total_submitters: COUNT DISTINCT submitter_id FROM best_practices
  - total_published_bps: COUNT WHERE status=PUBLISHED
  - by_job: GROUP BY job
  - by_ai_capability: GROUP BY ai_capability
  - by_department: GROUP BY department (từ users.department)
  - top5_bps_by_work: COUNT BPs per work, top 5
  - total_usage: SUM download_count
  - active_users: COUNT DISTINCT user_id FROM bp_downloads WHERE date IN range
  - usage_trend: GROUP BY month (6 tháng)
  - top5_usage: top 5 BPs by download_count
- Cache Redis TTL 15 phút, invalidate khi có approve/reject/close

### P7-BE-02: Dashboard controller

- `GET /api/v1/dashboard?startDate=&endDate=`
- Auth: tất cả roles

### P7-FE-01: Dashboard page

- `/dashboard` — cards + charts (dùng Recharts hoặc Chart.js)
- Charts: bar chart by_job, pie chart by_ai_capability, line chart usage_trend
- Top 5 tables: clickable rows → redirect Library với filter pre-applied
- Date range filter

**Commit:** `feat: dashboard — metrics aggregation, Redis cache, charts FE`

---

## P8 — User Management (Admin)

**Mục tiêu:** Admin assign role AX_SUPPORTER hoặc ADMIN cho user.

### P8-BE-01: User management endpoints

- `GET /api/v1/admin/users?search=&role=&page=&size=`
- `PUT /api/v1/admin/users/:id/role` — body: `{ role: "AX_SUPPORTER" | "ADMIN" }`
- Validation: chỉ cho phép set AX_SUPPORTER hoặc ADMIN (không set AX_CREATOR vì auto)

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
- Library grid: 1 col mobile / 2 col tablet / 3-4 col desktop
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
      - run: ./mvnw sonar:sonar  # nếu có SonarQube server
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

**Mục tiêu:** Login thật qua Samsung CIP/AD OAuth 2.0/SSO; department tự động map.

### P11-BE-01: CIPADProvider implementation

- Implement `SSOProvider` interface: `exchange(code)` → call CIP/AD token endpoint → parse user info (name, email, department, cipId)
- Cấu hình: `spring.security.oauth2.client.*` trong `application-prod.yml`
- Inject bằng Spring profile: `dev` → MockSSOProvider; `prod` → CIPADProvider

### P11-BE-02: Department mapping

- Khi SSO callback, upsert `users.department` từ CIP/AD
- Không cần bảng `departments` riêng — lưu thẳng string vào `users.department`
- Dashboard `by_department` group by `users.department` string

### P11-BE-03: Session timeout 30 phút

- Access token TTL: 30m (thay vì 15m cho dev)
- FE auto-refresh trước 30m hoặc logout

### P11-FE-01: Real login flow

- `/login` → `POST /auth/login` → redirect CIP/AD
- `/auth/callback` → nhận JWT → store → redirect `/library`

**Test:** Integration test với MockSSOProvider vẫn pass sau khi thêm CIPADProvider.

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
```

- [ ] **Step 2: Kiểm tra doc self-contained**

Xác nhận:
- Tất cả 12 phases (P0–P11) có mặt
- Mỗi phase có: mục tiêu, task list BE + FE, commit message
- Không có chữ "xem doc cũ" hay "theo phiên bản trước"
- State machine 3 statuses nhất quán xuyên suốt
- Không có MinIO reference nào

```bash
grep -n "MinIO\|minio\|CLOSED\|pre-signed" docs/2026-05-10-axon-implementation-plan.md
```

Kết quả mong đợi: không có dòng nào.

- [ ] **Step 3: Commit**

```bash
git add docs/2026-05-10-axon-implementation-plan.md
git commit -m "docs: rewrite implementation plan v2.0 — 12 phases P0-P11, Docker volume, 3 BP statuses"
```

---

## Task 6: Đồng bộ hoá và push

**Files:** tất cả docs đã sửa

- [ ] **Step 1: Cross-check nhất quán giữa 4 docs**

Chạy các lệnh sau và xác nhận kết quả:

```bash
# Kiểm tra không còn CLOSED nào trong 4 docs
grep -n "CLOSED\|status.*closed\|closed.*status" \
  docs/2026-05-10-axon-requirements.md \
  docs/2026-05-10-axon-hld.md \
  docs/2026-05-10-axon-dld.md \
  docs/2026-05-10-axon-implementation-plan.md
```
Kết quả chấp nhận: chỉ có trong `bp_reviews.action = CLOSED` (dùng để phân biệt close action vs reject action trong review history). Không có BP status CLOSED.

```bash
# Kiểm tra không còn MinIO nào
grep -rn "MinIO\|minio\|presigned\|pre-signed\|storage_key" \
  docs/2026-05-10-axon-*.md
```
Kết quả mong đợi: không có dòng nào.

- [ ] **Step 2: Push lên remote**

```bash
git push -u origin claude/prepare-writing-plans-MgAvT
```

- [ ] **Step 3: Xác nhận tất cả 4 docs đã được cập nhật**

```bash
git log --oneline -6
```

Kết quả mong đợi: thấy ít nhất 4 commits mới liên quan đến docs update.
```
