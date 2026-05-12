# AXon Remaining Docs Update — Design Spec

**Ngày:** 2026-05-12
**Phạm vi:** (1) Gap-fix 4 docs đã update (requirements, HLD, DLD, implementation-plan) cho auth NFR mở rộng; (2) Update 2 docs còn lại (design.md, uiux.md) theo spec v2
**Spec gốc tham chiếu:** [[2026-05-12-axon-doc-update-design]] (đã đóng — driver cho batch trước)
**Output:** mỗi doc là tài liệu hoàn chỉnh, standalone, ai đọc vào cũng hiểu hệ thống mà không cần cross-reference

---

## 1. Quyết định đã xác nhận

| # | Quyết định | Giá trị |
|---|------------|---------|
| D1 | BP Status | 3 trạng thái: `REQUESTED / REJECTED / PUBLISHED` (giữ từ spec gốc) |
| D2 | File storage | Docker volume (giữ từ spec gốc) |
| D3 | Auth document | Document đầy đủ 7 auth NFRs nhưng implementation chỉ trong P11 (tách biệt khỏi nghiệp vụ) |
| D4 | Auth NFRs mở rộng | Bổ sung AES-256 at rest, TLS 1.2+ in transit, MFA for ADMIN, PII audit log retention 1 tháng, PII masking in logs/errors |
| D5 | design.md treatment | Viết lại hoàn toàn (output: doc hoàn chỉnh) |
| D6 | uiux.md treatment | Chỉnh sửa in-place (output: doc hoàn chỉnh) — giữ nhiều phần wireframe vẫn đúng |
| D7 | Department trong dashboard filter UI | Filter theo `creators.department` (string) thay vì lookup dropdown |
| D8 | AI Tool trong filter UI | Free-text search trong `ai_tools_description` thay vì multi-select |
| D9 | Register form Job picker | Bỏ Job multi-select — Job suy ra từ Work selection (1 Work xác định 1 Work Category và 1 Job) |
| D10 | Register form Department picker | Bỏ — department lấy từ creators (qua `users.department` từ CIP/AD) |

---

## 2. Gap-fix cho 4 docs đã update (Phase A)

### 2.A.1 `requirements.md` §6.2 Security — Mở rộng

**Hiện tại có:**
- Authentication: Samsung CIP/AD OAuth 2.0/SSO (P11)
- Authorization: RBAC
- OWASP Top 10 cơ bản (SQL inj, XSS, CSRF)
- Session timeout: 30 phút

**Bổ sung (mark "implementation P11 — tách biệt khỏi nghiệp vụ"):**
1. **Data encryption:** AES-256 at rest cho PII binary data; TLS 1.2+ in transit
2. **MFA:** bắt buộc cho ADMIN role (qua CIP/AD)
3. **PII audit log:** ghi log mọi thao tác trên PII (view/edit/delete user data); retention 1 tháng
4. **PII masking:** ẩn PII trong application logs và error messages (email partial, no full name, no CIP ID raw)

### 2.A.2 `hld.md` §5 Security Architecture — Bổ sung

Thêm subsection "5.X Security NFRs (P11)":
- Reference các bullet trên
- Note: P0–P10 không implement; mock auth giả lập role; data tại dev không nhạy cảm

### 2.A.3 `hld.md` §10 Auth Strategy — Bổ sung scope P11

Cập nhật danh sách items trong P11 production scope:
- OAuth 2.0/SSO integration với CIP/AD
- Department mapping từ SRV Group
- Session token TTL 30m
- **MFA enforcement cho ADMIN role**
- **Encryption at rest (AES-256) cho PII fields trong DB**
- **PII audit logging service**
- **Log/error sanitization (PII masking middleware)**

### 2.A.4 `implementation-plan.md` P11 — Mở rộng task list

Hiện P11 có 4 tasks: CIPADProvider, Department mapping, Session timeout 30m, FE login flow.

Bổ sung:
- **P11-BE-04:** MFA enforcement (delegate cho CIP/AD; backend reject ADMIN session không có MFA claim)
- **P11-BE-05:** PII encryption (entity converters cho email, CIP ID, etc. — AES-256 với key từ KMS/env)
- **P11-BE-06:** PII audit log (interceptor + `audit_logs` table; retention job 30d)
- **P11-BE-07:** Log/error PII masking (Logback filter + GlobalExceptionHandler sanitization)
- **P11-NFR:** TLS 1.2+ enforced ở ingress/reverse proxy (ngoài app)

### 2.A.5 `dld.md` — Tùy chọn bổ sung `audit_logs` table

Nếu muốn schema chuẩn bị sẵn cho P11, thêm:

```sql
-- V11 (optional, mark deferred to P11): Audit Logs
CREATE TYPE audit_action AS ENUM ('VIEW_PII', 'EDIT_PII', 'DELETE_PII', 'EXPORT_PII');

CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     UUID NOT NULL REFERENCES users(id),
    action       audit_action NOT NULL,
    target_type  VARCHAR(50) NOT NULL,
    target_id    UUID NOT NULL,
    ip_address   VARCHAR(45),
    user_agent   VARCHAR(500),
    occurred_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_time ON audit_logs(actor_id, occurred_at DESC);
CREATE INDEX idx_audit_target     ON audit_logs(target_type, target_id);
-- Retention: scheduled job xoá row > 30 ngày
```

**Quyết định:** Thêm vào DLD §1.2 với note "Implementation deferred to P11" — schema chuẩn bị sẵn để migration không phải làm muộn.

---

## 3. Update `design.md` — Viết lại hoàn toàn (Phase B)

### 3.B.1 Mục lục mới (đề xuất)

```
1. Context (giữ, refresh ngôn ngữ)
2. Kiến trúc tổng thể (sửa diagram: Docker Volume)
3. Actors & Roles (giữ — 4 roles)
4. BP Types (giữ)
5. Taxonomy (4 categories: Job, AI Capability, Work Category, Work)
6. Data Model (3 statuses; bp_files.file_path; users.department VARCHAR; ai_tools_description text)
7. BP Status Flow (3 statuses; close → REJECTED)
8. Luồng nghiệp vụ chính (cập nhật close = → REJECTED)
9. Backend API (master data, dashboard, AI insight, feedback bổ sung)
10. Frontend (routes cập nhật: thêm /master-data, /ai-insight, /admin/users)
11. Phân quyền (sửa permission matrix)
12. Tech Stack (Docker volume thay MinIO)
13. Phases (đồng bộ 12-phase P0–P11 từ implementation-plan)
```

### 3.B.2 Diff list chính

| Section cũ | Thay đổi |
|------------|----------|
| §1 ASCII diagram MinIO/S3 | → Docker Volume |
| §4 Taxonomy table 6 categories | → 4 (drop Department + AI Tool as lookup) |
| §5 Lookup tables 6 | → 4 (drop `departments`, `ai_tools`) |
| §5 `users.department_id UUID FK` | → `department VARCHAR(256)` từ CIP/AD |
| §5 best_practices status enum bao gồm CLOSED | → 3 statuses |
| §5 best_practices thêm `ai_tools_description TEXT` | Add |
| §5 bp_files `storage_key VARCHAR` | → `file_path VARCHAR(500)` |
| §5 Junction tables `bp_ai_tools`, `bp_departments` | Xóa |
| §6 BP Status Flow shows CLOSED | → 3 statuses, close = `PUBLISHED → REJECTED` |
| §7.4 Close BP `status=CLOSED` | → `status=REJECTED`, distinguish via `bp_reviews.action=CLOSED` |
| §8 Lookup APIs `/departments`, `/ai-tools` | Xóa |
| §8 Admin lookup CRUD 6 → 4 | Drop departments + ai-tools paths |
| §8 thêm Master Data CRUD endpoints | Add: jobs, work-categories, works, ai-capabilities |
| §8 thêm Dashboard endpoint | Add: `GET /api/v1/dashboard` |
| §8 thêm AI Insight endpoint | Add: `GET /api/v1/ai-insight` |
| §8 thêm Feedback endpoints | Add: POST/GET feedback |
| §9 Routes thêm /admin/master-data, /ai-insight, /admin/users | Add |
| §10 Permission table row "Xem detail (ẩn key)" AX Supporter "—" | → ✅ (supporter can see key) |
| §11 Tech Stack MinIO/S3 | → Docker Volume |
| §13 Phase 1–4 plan | → 12 phases P0–P11 (high-level summary table) |
| (Mới) §X Edit 3-case logic | Add: status transition rules cho PUT /bp/:id |
| (Mới) §Y AI Insight | Add: short subsection mô tả static content |
| (Mới) §Z Feedback Epic | Add: short subsection mô tả feedback flow |

---

## 4. Update `uiux.md` — Chỉnh sửa (Phase C)

### 4.C.1 Diff list chính

| Section | Thay đổi |
|---------|----------|
| §2 Status Badge Colors — 4 entries (CLOSED gray) | → 3 entries (drop CLOSED) |
| §4.1 Library Filter Panel — Department dropdown, AI Tool dropdown | Department: lọc theo creator's department (string match); AI Tool: textbox search trong `ai_tools_description` |
| §4.2 Detail Page sidebar — "AI Tool: [Claude]", "Department: SRV, Platform" | AI Tool: render `ai_tools_description` free text; Department: list từ creators (mỗi creator một string) |
| §4.3 Register Form Step 1 — "Job (multiple)" picker | Bỏ — Job auto-fill từ Work selection (1 Work → 1 Work Category → 1 Job) |
| §4.3 Register Form Step 1 — "AI Tool (multiple)" multi-select | → textarea "AI Tools (describe tools used)" |
| §4.3 Register Form Step 1 — "Department (multiple)" picker | Bỏ — không có department picker |
| §4.4 My BPs filter chips bao gồm CLOSED | → 3 statuses (REQUESTED, REJECTED, PUBLISHED) |
| §4.4 My BPs row example "○ CLOSED" với "Lý do" | → "✗ REJECTED" với tooltip "Closed by supporter: <reason>" |
| §4.5 Management filter chips bao gồm CLOSED | → 3 statuses |
| §4.6 Review Page Review Panel — REQUESTED case OK | Giữ nguyên; bỏ CLOSED case ở §5.7 |
| §4.7 Dashboard mockup — Top 5 Creators, no Top 5 BP by work, no usage trend, no active users | Drop Top 5 Creators; thêm Top 5 BP by work, Active Users, Usage Trend (6-month line chart), Top 5 Usage; thêm date range filter |
| §4.7 Dashboard counters — Submitters, Total BPs, Published, Requested, Rejected, Closed, Jobs, AI Cap, Depts | Drop "Closed" counter; thêm "Total Usage" counter |
| §4.8 Admin Master Data tabs — 6 categories (Job, AI Cap, AI Tool, Work Cat, Work, Department) | → 4 (Job, AI Capability, Work Category, Work) |
| §4.8 Admin Master Data — drag handle reorder | Giữ nếu muốn; nhưng spec không yêu cầu — quyết định: bỏ (giảm scope) |
| §5.2 StatusBadge — 4 statuses | → 3 |
| §5.5 FilterPanel — 7 dimensions | → 6 (job, ai_capability, work_category, work, type, department-string-search) + free-text ai_tools_description search |
| §5.7 ReviewPanel — REQUESTED, PUBLISHED, REJECTED/CLOSED cases | REQUESTED, PUBLISHED, REJECTED (drop CLOSED); ReviewPanel cho REJECTED hiện history |
| §5.8 ReviewHistory timeline | Cập nhật: action=CLOSED vẫn render với label "Closed" nhưng status=REJECTED |
| §6.7 Close BP flow "Status → CLOSED" | → "Status → REJECTED, BP ẩn khỏi library" |
| §7 Edge cases (giữ) | OK; thêm trường hợp "Edit Published không sửa link/file → vẫn PUBLISHED" |
| (Mới) §4.X AI Insight Page mockup | Thêm: 5 cards với name, description, embodiments list, scope |
| (Mới) §4.Y Admin User Management mockup detail | Thêm: full search, role dropdown logic (chỉ AX_SUPPORTER/ADMIN assignable; AX_CREATOR auto-promoted) |

### 4.C.2 Phần GIỮ NGUYÊN trong uiux.md

- §1 Design Principles
- §2 Color palette, Typography, Type Badge colors (chỉ Status Badge cần sửa)
- §3 Layout System, Responsive Breakpoints, Global Layout, Header
- §4.1 Library Page bố cục chung (chỉ filter panel cần sửa)
- §4.2 Detail Page bố cục chung (chỉ sidebar fields cần sửa)
- §4.4–4.6 page bố cục (chỉ status filter chips cần sửa)
- §4.9 Analytics view
- §5.1, 5.3, 5.4, 5.6 component specs
- §6.1–6.6 user flows (chỉ §6.7 cần sửa)
- §8 Responsive Behavior
- §9 Accessibility

---

## 5. Giả định giữ nguyên

- Color palette không đổi (CLOSED gray vẫn xóa khỏi badge list nhưng palette tổng thể giữ)
- Inter font, Tailwind tokens không đổi
- Breakpoints không đổi
- 4 roles không đổi
- 3 BP types không đổi
- Bp_reviews vẫn track `action=CLOSED` (database enum) dù status enum không có CLOSED — để phân biệt close vs reject trong history timeline

---

## 6. Các điểm còn mở

| # | Điểm | Default trong design |
|---|------|---------------------|
| O1 | Có thêm thumbnail upload riêng hay vẫn URL string? | URL string (giữ) |
| O2 | Có drag-and-drop reorder cho master data list không? | Bỏ (giảm scope; sort theo tên hoặc created_at) |
| O3 | Dashboard có cần "Top 5 Creators" không? | Bỏ (spec không liệt kê) |
| O4 | Filter "Department" UX: dropdown (kéo từ distinct users.department) hay textbox? | Dropdown với options = SELECT DISTINCT department FROM users WHERE department IS NOT NULL |
| O5 | Filter "AI Tool" UX: textbox autocomplete hay free-text? | Free-text search (matches `ai_tools_description LIKE %query%`) |
| O6 | `audit_logs` table có thêm vào DLD hay để P11 tự tạo migration? | Thêm vào DLD §1.2 với note "deferred to P11" (D4) |

---

## 7. Output cuối cùng

Sau khi thực hiện, repo có:

1. **4 docs đã update + gap-fix:**
   - `requirements.md` v2.1 — bổ sung §6.2 auth NFRs
   - `hld.md` v2.1 — bổ sung §5 Security NFRs, §10 P11 scope
   - `dld.md` v2.1 — bổ sung `audit_logs` table (deferred note)
   - `implementation-plan.md` v2.1 — P11 mở rộng với 7 auth NFRs

2. **2 docs còn lại đã update:**
   - `design.md` v2.0 — viết lại hoàn toàn theo decisions D1-D10
   - `uiux.md` v2.1 — chỉnh sửa theo diff list §4.C.1

3. **(Optional) review-notes update** ghi lại các thay đổi mới — không bắt buộc nếu plan đã trace đủ.
