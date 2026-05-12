# AXon Docs Update — Design Spec

**Ngày:** 2026-05-12
**Phạm vi:** Viết lại hoàn toàn 4 docs theo spec v2 của người dùng
**Approach:** Full rewrite — mỗi doc là tài liệu standalone, đầy đủ, tự đứng được; không dùng kiểu "patch/diff"

---

## 1. Quyết định đã xác nhận

| # | Quyết định | Giá trị |
|---|------------|---------|
| D1 | BP Status | 3 trạng thái: `REQUESTED / REJECTED / PUBLISHED` (bỏ `CLOSED`) |
| D2 | Close BP action | `PUBLISHED → REJECTED` (không còn CLOSED) |
| D3 | File storage | Docker volume (local filesystem); bỏ MinIO/S3 |
| D4 | Auth | Tích hợp Samsung CIP/AD (OAuth 2.0/SSO); app chỉ enforce RBAC |
| D5 | Auth implementation | Tách biệt — P11 cuối cùng sau khi nghiệp vụ hoàn chỉnh |
| D6 | Security scope | Delegated to Samsung CIP/AD; app giữ: RBAC, OWASP cơ bản, session timeout 30m |
| D7 | AI Capability | 5 loại cố định (seed data, admin có thể CRUD thêm) |
| D8 | BP Type | `WEB` (text URL ≤256 char) / `TOOL` / `EXTENSION` (upload file ≤50MB) |

---

## 2. Thay đổi theo từng doc

### 2.1 `requirements.md` — Viết lại hoàn toàn

**Roles (giữ nguyên 4):**
- `USER` — xem library, install BP, like, feedback
- `AX_CREATOR` — đăng ký/edit/delete BP của mình, xem analytics
- `AX_SUPPORTER` — review/approve/reject/close BP, quản lý master data, monitor
- `ADMIN` — quản lý user & permission, toàn bộ quyền Supporter

**FR mới — 18 function requirements:**

| ID | Epic | Function | Role |
|----|------|----------|------|
| FR-LIB-01 | Library | View list BP (card): name, description, thumbnail, job, work, creator | User/Supporter/Admin |
| FR-LIB-02 | Library | Register BP: name, description, installation guide, work, AI capability, AI tools, BP type, key, creator | User (→ auto AX_CREATOR) |
| FR-LIB-03 | Library | View detail BP (key ẩn), track view/like/download | User/Supporter/Admin |
| FR-LIB-04 | Library | Like BP từ detail | User/Supporter/Admin |
| FR-LIB-05 | Library | Sort & filter: job, AI capability, work category, work, department, BP type, AI tool | User/Supporter/Admin |
| FR-MY-01 | My Practice | View list BP của mình: thumbnail, name, type, status, job, AI capability, submitter, submitted date, comment | AX_CREATOR |
| FR-MY-02 | My Practice | Edit BP theo trạng thái (xem logic §2.1.1) | AX_CREATOR |
| FR-MY-03 | My Practice | Delete BP (popup confirm) | AX_CREATOR |
| FR-MGT-01 | Manage BP | View list BP để review: thumbnail, name, type, status, job, AI capability, submitter, date, comment, action | Supporter/Admin |
| FR-MGT-02 | Manage BP | Review BP (REQUESTED → PUBLISHED hoặc REJECTED + comment); không self-approve | Supporter/Admin |
| FR-MGT-03 | Manage BP | Close BP (PUBLISHED → REJECTED + close reason comment); popup riêng với review comment | Supporter/Admin |
| FR-MDATA-01 | Master Data | Manage Job: CRUD, name 256 unique, desc 4096, upload default list | Admin |
| FR-MDATA-02 | Master Data | Manage Work Category: CRUD, linked to Job, name unique per job, upload default | Admin |
| FR-MDATA-03 | Master Data | Manage Work: CRUD, linked Job+WorkCategory, code 50 unique, name 256, upload default | Admin |
| FR-MDATA-04 | Master Data | Manage AI Capability: CRUD, name 256 unique; 5 seed defaults | Admin |
| FR-USER-01 | User Management | Assign role Admin hoặc AX_Supporter cho user | Admin |
| FR-DASH-01 | Dashboard | Monitoring: submitters count, total published BP, count by job/AI capability/department, top 5 BP by work, total use, active users, usage trend 6 tháng, top 5 usage, filter by date | All roles |
| FR-INSIGHT-01 | AI Code Insight | Hiển thị phân loại 5 AI capability types với mô tả embodiments & scope | All roles |

**FR-MY-02 Edit Logic (§2.1.1):**
- Status = `REQUESTED`: edit tự do, status không đổi
- Status = `PUBLISHED`:
  - Nếu sửa file/link cài đặt → status → `REQUESTED`, BP ẩn khỏi library chờ review
  - Nếu không sửa file/link → status giữ `PUBLISHED`, BP vẫn hiển thị
- Status = `REJECTED`: edit → status → `REQUESTED` (submit lại)

**NFR:**
- Performance: p95 < 3s cho thao tác cơ bản (đo JMeter/k6), >200 concurrent users
- Security: RBAC, OWASP Top 10 cơ bản (SQL injection, XSS, CSRF), session timeout 30m; auth delegated to Samsung CIP/AD
- i18n: EN + VI
- Accessibility: WCAG 2.1 AA
- Responsive: multi-screen
- Quality: SonarQube + JaCoCo, CI/CD kiểm tra coverage
- API: 100% Swagger docs

---

### 2.2 `HLD.md` — Viết lại hoàn toàn

Tài liệu standalone mô tả toàn bộ kiến trúc hệ thống AXon v2. Bao gồm:

- **Tech stack:** Spring Boot 3, PostgreSQL, Redis cache, React (FE), Docker Compose
- **Modules:** Library, My Practice, Manage BP, Master Data, Dashboard, AI Insight, User Management
- **Auth:** Samsung CIP/AD OAuth 2.0/SSO → JWT; app enforce RBAC; SSO implementation P11
- **File storage:** Docker volume (local filesystem); `FileSystemStorageService`; không dùng MinIO/S3
- **BP state machine:** `REQUESTED → PUBLISHED → REJECTED`; Close = `PUBLISHED → REJECTED`
- **Component diagram:** tất cả services, DB, cache, storage, external (CIP/AD)
- **NFR summary:** p95 < 3s, >200 concurrent, WCAG 2.1 AA, i18n EN/VI

---

### 2.3 `DLD.md` — Viết lại hoàn toàn

Tài liệu standalone mô tả toàn bộ thiết kế kỹ thuật chi tiết. Bao gồm:

**Database schema (đầy đủ, tất cả bảng):**
- `users`, `roles`, `user_roles`
- `jobs`, `work_categories`, `works`
- `ai_capabilities` (id, name, description, is_default)
- `best_practices` (file_path VARCHAR(500), file_url VARCHAR(256); enum: REQUESTED/REJECTED/PUBLISHED)
- `bp_creators`, `bp_ai_capabilities`
- `bp_likes`, `bp_downloads`, `bp_feedback`
- `bp_reviews` (comment, action: APPROVED/REJECTED/CLOSED)

**API endpoints (đầy đủ):**
- `/api/auth/**` — login/logout/refresh
- `/api/library/**` — view list, view detail, like, filter/sort
- `/api/my-practice/**` — CRUD BP của creator
- `/api/manage-bp/**` — review, close (Supporter/Admin)
- `/api/master-data/jobs`, `/work-categories`, `/works`, `/ai-capabilities`
- `/api/users/**` — user management
- `/api/dashboard/**` — monitoring data
- `/api/ai-insight` — classification info
- `/api/files/upload` — file upload → Docker volume

**Edit BP state logic:** FR-MY-02 3-case rules viết rõ ràng, không reference tới doc khác

---

### 2.4 `implementation-plan.md` — Viết lại hoàn toàn

**Phases:**

| Phase | Nội dung chính | Output |
|-------|---------------|--------|
| P0 | Project setup: Spring Boot scaffold, Docker Compose (PostgreSQL + app + volume), Flyway migrations V1 baseline | Runnable empty app |
| P1 | Auth mock: JWT local (hardcode user/role), Spring Security config, `@PreAuthorize` RBAC guards | Auth working, all endpoints secured by role |
| P2 | Master data CRUD: Job → WorkCategory → Work → AICapability (BE + FE) | Admin có thể quản lý lookup data |
| P3 | BP Library — CRUD + file upload: register BP, view list (card), view detail, file upload → Docker volume | BP cơ bản hoạt động |
| P4 | BP Lifecycle: submit/review/approve/reject/close (PUBLISHED→REJECTED) + edit logic per status | Toàn bộ workflow BP hoạt động |
| P5 | My Practice: view list, edit (3-case logic), delete + popup confirm | Creator quản lý BP của mình |
| P6 | Manage BP (Supporter): view list, review popup, close popup, filter | Supporter review được |
| P7 | Interactions: like, view count, download count, feedback | Engagement features |
| P8 | Dashboard & monitoring: aggregations, charts, top 5, usage trends, filter by date | Dashboard đầy đủ |
| P9 | FE hoàn thiện: i18n EN/VI, responsive, accessibility WCAG 2.1 AA, AI Insight page | FE production-ready |
| P10 | NFR: performance test (k6), SonarQube/JaCoCo, CI/CD pipeline, 100% Swagger | Non-functionals pass |
| P11 | Auth thật: Samsung CIP/AD OAuth 2.0/SSO integration, role mapping, session timeout 30m | SSO live |

**Mỗi phase gồm:** BE tasks → FE tasks → integration test → merge checklist

---

## 3. Giả định giữ nguyên từ docs cũ

- JWT TTL: access 15m, refresh 7 ngày (P1 dùng, P11 tích hợp SSO thay thế)
- Pagination mặc định: page size 20, max 50
- Redis cache TTL dashboard: 15 phút
- View count tăng mỗi GET detail (chưa dedupe)
- Auto promote USER → AX_CREATOR khi tạo BP đầu tiên

---

## 4. Các điểm còn mở (không block implementation)

| # | Điểm | Ghi chú |
|---|------|---------|
| O1 | Department data | Lấy từ CIP/AD khi SSO (P11); P1-P10 dùng hardcode |
| O2 | Usage tracking chi tiết | "token count per user/project" cần nối hệ thống khác — để hờ, không implement |
| O3 | Thumbnail upload | Hiện nhận URL string; file thumbnail để P11 sau |
| O4 | Reviewer name trong history | Cần JOIN khi list — implement trong P4 |
| O5 | Soft delete BP | Hard delete hiện tại; soft delete là Should, implement nếu còn thời gian |
