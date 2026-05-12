# AXon Remaining Docs Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Gap-fix 4 docs đã update (requirements, HLD, DLD, implementation-plan) bằng cách bổ sung 4 auth NFRs mở rộng — document only, deferred implementation to P11; (2) Update 2 docs còn lại (design.md + uiux.md) theo spec v2 — mỗi doc là tài liệu hoàn chỉnh, standalone.

**Architecture:** Pure Markdown edit. Spec gốc tại `docs/superpowers/specs/2026-05-12-axon-remaining-docs-design.md`. Mọi task có bước verify trước-sau và commit riêng.

**Tech Stack:** Markdown, Git

---

## File Map

| File | Action | Lý do |
|------|--------|-------|
| `docs/2026-05-10-axon-requirements.md` | Edit §6.2 + bump version | Bổ sung 4 auth NFRs (mark P11 deferred) |
| `docs/2026-05-10-axon-hld.md` | Edit §5, §10 + bump version | Bổ sung Security NFR detail, P11 scope items |
| `docs/2026-05-10-axon-dld.md` | Edit §1.2 + bump version | Thêm `audit_logs` table (V11, P11-deferred note) |
| `docs/2026-05-10-axon-implementation-plan.md` | Edit P11 + bump version | Thêm 4 BE tasks + 1 NFR task vào P11 |
| `docs/2026-05-10-axon-design.md` | Viết lại hoàn toàn | Stale: MinIO/CLOSED/6 lookups/department FK — không khớp v2 |
| `docs/2026-05-10-axon-uiux.md` | Edit nhiều section | Status 3-not-4, filter UX, Dashboard rewrite, new mockups |

---

## Phase A — Gap-fix 4 docs đã update

### Task 1: requirements.md — Bổ sung Auth NFRs vào §6.2

**Files:**
- Modify: `docs/2026-05-10-axon-requirements.md` (header version + §6.2)

- [ ] **Step 1: Bump version trong header**

Find:
```markdown
# AXon — Requirements v2.0

**Version:** 2.0
**Date:** 2026-05-12
**Status:** Approved
```

Replace with:
```markdown
# AXon — Requirements v2.1

**Version:** 2.1
**Date:** 2026-05-12
**Status:** Approved
```

- [ ] **Step 2: Thay thế toàn bộ §6.2 Security với nội dung mở rộng**

Find:
```markdown
### 6.2 Security
- **Authentication:** Samsung CIP/AD OAuth 2.0/SSO (triển khai P11); dev dùng mock user
- **Authorization:** RBAC — mỗi role chỉ truy cập resource được phân quyền
- **OWASP Top 10 cơ bản:** parameterized queries (SQL injection), sanitize input (XSS), CSRF token
- **Session timeout:** 30 phút
```

Replace with:
```markdown
### 6.2 Security

> **Phạm vi:** Documentation đầy đủ. Implementation chỉ ở P11 — tách biệt khỏi nghiệp vụ để ưu tiên P0–P10. P0–P10 dùng mock auth, không xử lý PII thật.

**Authentication & SSO:**
- Samsung CIP/AD OAuth 2.0/SSO (triển khai P11); dev dùng MockSSOProvider với 4 hardcoded users
- Session timeout: 30 phút (access token TTL 30m ở P11)
- **MFA bắt buộc cho ADMIN role** (delegate cho CIP/AD MFA flow; backend reject ADMIN session không có MFA claim)

**Authorization:**
- RBAC — mỗi role chỉ truy cập resource được phân quyền
- 4 roles: USER, AX_CREATOR, AX_SUPPORTER, ADMIN

**Data Protection (P11):**
- **Encryption at rest:** AES-256 cho PII binary data (email, CIP ID, department mã hoá ở DB layer qua JPA entity converters)
- **Encryption in transit:** TLS 1.2+ cho mọi HTTPS connection (enforce ở ingress/reverse proxy)

**OWASP Top 10 (cơ bản, áp dụng từ P0):**
- SQL Injection: parameterized queries qua JPA / Spring Data
- XSS: input sanitization + React JSX auto-escape
- CSRF: CSRF token cho state-changing requests

**Audit & Logging (P11):**
- **PII audit log:** ghi log mọi thao tác trên PII (view/edit/delete user data); retention 1 tháng; scheduled job xoá row > 30d
- **PII masking:** ẩn PII trong application logs và error messages (email partial `n***@samsung.com`, không log full name hoặc CIP ID raw)
```

- [ ] **Step 3: Verify section §6.2 đầy đủ**

Run: `grep -A 30 "### 6.2 Security" docs/2026-05-10-axon-requirements.md | head -35`
Expected: section có đủ 5 subsections (Authentication & SSO, Authorization, Data Protection, OWASP Top 10, Audit & Logging) và note "Implementation chỉ ở P11"

- [ ] **Step 4: Commit**

```bash
git add docs/2026-05-10-axon-requirements.md
git commit -m "docs(requirements): expand §6.2 auth NFRs — AES-256, MFA admin, PII audit log, masking (P11 deferred)"
```

---

### Task 2: hld.md — Bổ sung §5 Security NFRs và §10 P11 scope

**Files:**
- Modify: `docs/2026-05-10-axon-hld.md` (header version + §5 + §10)

- [ ] **Step 1: Bump version trong header**

Find:
```markdown
# AXon — High-Level Design (HLD)

**Version:** 2.0  
**Date:** 2026-05-11  
**Status:** Draft
```

Replace with:
```markdown
# AXon — High-Level Design (HLD)

**Version:** 2.1  
**Date:** 2026-05-12  
**Status:** Draft
```

- [ ] **Step 2: Thêm subsection §5.1 vào sau §5 Security Architecture diagram**

Find (cuối §5, trước "## 6. Deployment Architecture"):
```markdown
**Token flow:**
```
CIP/AD Login:
  Browser → /auth/login → redirect to CIP/AD
  CIP/AD  → /auth/callback (with code)
  Backend → exchange code → get user info → upsert user → issue JWT pair
  JWT: { access_token (15m), refresh_token (7d) }

Token refresh:
  Browser → /auth/refresh (with refresh_token)
  Backend → validate refresh_token in Redis → issue new access_token
```

---

## 6. Deployment Architecture
```

Replace with:
```markdown
**Token flow:**
```
CIP/AD Login:
  Browser → /auth/login → redirect to CIP/AD
  CIP/AD  → /auth/callback (with code)
  Backend → exchange code → get user info → upsert user → issue JWT pair
  JWT: { access_token (15m), refresh_token (7d) }

Token refresh:
  Browser → /auth/refresh (with refresh_token)
  Backend → validate refresh_token in Redis → issue new access_token
```

### 5.1 Security NFRs (P11 deferred)

> P0–P10: chỉ enforce RBAC + OWASP Top 10 cơ bản (SQL injection, XSS, CSRF). Mock auth, dev data không phải PII thật. Mọi items dưới đây implement ở P11.

| Concern | Approach |
|---------|----------|
| MFA cho ADMIN | Delegate cho CIP/AD MFA flow; backend verify `amr` claim chứa `mfa` cho ADMIN session |
| Encryption at rest | AES-256 cho PII fields (email, cip_id, department) qua JPA `@Convert(converter = AesGcmStringConverter.class)`; key từ env var `PII_ENCRYPTION_KEY` |
| Encryption in transit | TLS 1.2+ enforce ở ingress (Nginx hoặc K8s Ingress); app nhận traffic plain HTTP nội bộ |
| PII audit log | `audit_logs` table + AOP aspect quanh user-PII access methods; retention 1 tháng (scheduled cleanup job) |
| PII masking in logs | Logback `MaskingPatternLayout` filter cho email/cipId; `GlobalExceptionHandler` redact PII trước khi serialize error response |
| Session timeout 30m | Access token TTL = 30 phút; FE auto-refresh trước khi hết hạn |

---

## 6. Deployment Architecture
```

- [ ] **Step 3: Thay thế §10 Auth Strategy cuối cùng để mở rộng P11 scope**

Find:
```markdown
**Production (P11):** Samsung CIP/AD OAuth 2.0/SSO:
- Browser redirect → CIP/AD login page
- Callback → backend exchange code → get user info (name, email, department/SRV Group)
- Backend upsert user → issue JWT pair (access 30m, refresh 7d)
- Department string tự động lấy từ CIP/AD profile

```
SSOProvider (interface)
  ├── MockSSOProvider  (dev — hardcoded users, inject via Spring profile "dev")
  └── CIPADProvider    (prod — Samsung CIP/AD OAuth 2.0)
```

Security scope: delegated to Samsung CIP/AD infrastructure. App enforces RBAC only.
```

Replace with:
```markdown
**Production (P11):** Samsung CIP/AD OAuth 2.0/SSO + full Security NFR rollout:
- Browser redirect → CIP/AD login page
- Callback → backend exchange code → get user info (name, email, department/SRV Group)
- Backend upsert user → issue JWT pair (access 30m, refresh 7d)
- Department string tự động lấy từ CIP/AD profile
- **MFA enforcement cho ADMIN role** (qua CIP/AD `amr` claim)
- **PII encryption at rest** cho email/cipId/department (AES-256 via JPA converters)
- **PII audit logging service** ghi `audit_logs` row cho mọi thao tác PII; retention 1 tháng
- **Log + error PII masking** (Logback filter + GlobalExceptionHandler sanitization)
- **TLS 1.2+** enforce ở ingress layer (ngoài app)

```
SSOProvider (interface)
  ├── MockSSOProvider  (dev — hardcoded users, inject via Spring profile "dev")
  └── CIPADProvider    (prod — Samsung CIP/AD OAuth 2.0)
```

Security scope: P0–P10 chỉ RBAC + OWASP Top 10 cơ bản. P11 thêm SSO/MFA/encryption/audit/masking (xem §5.1).
```

- [ ] **Step 4: Verify §5.1 và §10 đầy đủ**

Run: `grep -c "Security NFRs" docs/2026-05-10-axon-hld.md`
Expected: ≥ 1 match

Run: `grep -c "MFA" docs/2026-05-10-axon-hld.md`
Expected: ≥ 3 match (§5.1 row + §10 bullet + ...)

- [ ] **Step 5: Commit**

```bash
git add docs/2026-05-10-axon-hld.md
git commit -m "docs(hld): add §5.1 Security NFRs and expand §10 Auth Strategy P11 scope"
```

---

### Task 3: dld.md — Thêm `audit_logs` table (V11, deferred note)

**Files:**
- Modify: `docs/2026-05-10-axon-dld.md` (header version + §1.2 DDL Scripts)

- [ ] **Step 1: Bump version trong header**

Find:
```markdown
# AXon — Detail-Level Design (DLD)

**Version:** 2.0  
**Date:** 2026-05-11  
**Status:** Draft
```

Replace with:
```markdown
# AXon — Detail-Level Design (DLD)

**Version:** 2.1  
**Date:** 2026-05-12  
**Status:** Draft
```

- [ ] **Step 2: Thêm V11 audit_logs sau V10 seed data trong §1.2**

Find (cuối block SQL §1.2):
```sql
INSERT INTO ai_capabilities (name, is_default) VALUES
    ('Q&A', TRUE),
    ('Workflow Assistant', TRUE),
    ('Autonomous AI Agent', TRUE),
    ('AI-based Tools & Applications', TRUE),
    ('AI Orchestration', TRUE);
```
```

Replace with:
```sql
INSERT INTO ai_capabilities (name, is_default) VALUES
    ('Q&A', TRUE),
    ('Workflow Assistant', TRUE),
    ('Autonomous AI Agent', TRUE),
    ('AI-based Tools & Applications', TRUE),
    ('AI Orchestration', TRUE);

-- V11: Audit Logs (Implementation deferred to P11 — schema ready để migration không phải làm muộn)

CREATE TYPE audit_action AS ENUM ('VIEW_PII', 'EDIT_PII', 'DELETE_PII', 'EXPORT_PII');

CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     UUID NOT NULL REFERENCES users(id),
    action       audit_action NOT NULL,
    target_type  VARCHAR(50) NOT NULL,  -- 'USER', 'BEST_PRACTICE', 'FEEDBACK', etc.
    target_id    UUID NOT NULL,
    ip_address   VARCHAR(45),           -- IPv4/IPv6
    user_agent   VARCHAR(500),
    occurred_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_time ON audit_logs(actor_id, occurred_at DESC);
CREATE INDEX idx_audit_target     ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_occurred   ON audit_logs(occurred_at DESC);

-- Retention: scheduled job xoá row > 30 ngày (Spring @Scheduled, daily)
-- DDL chỉ ghi schema; AOP aspect + retention job nằm trong P11 task.
```
```

- [ ] **Step 3: Verify V11 block đã thêm vào**

Run: `grep -c "audit_logs" docs/2026-05-10-axon-dld.md`
Expected: ≥ 3 (CREATE TABLE + 2 indexes)

Run: `grep -c "Implementation deferred to P11" docs/2026-05-10-axon-dld.md`
Expected: 1

- [ ] **Step 4: Commit**

```bash
git add docs/2026-05-10-axon-dld.md
git commit -m "docs(dld): add audit_logs table V11 (PII audit, P11-deferred schema)"
```

---

### Task 4: implementation-plan.md — Mở rộng P11 với 4 BE auth NFR tasks

**Files:**
- Modify: `docs/2026-05-10-axon-implementation-plan.md` (header version + P11)

- [ ] **Step 1: Bump version trong header**

Find:
```markdown
# AXon — Implementation Plan v2.0

**Version:** 2.0
**Date:** 2026-05-12
**Dựa trên:** requirements v2.0, HLD v2.0, DLD v2.0
```

Replace with:
```markdown
# AXon — Implementation Plan v2.1

**Version:** 2.1
**Date:** 2026-05-12
**Dựa trên:** requirements v2.1, HLD v2.1, DLD v2.1
```

- [ ] **Step 2: Thay thế toàn bộ §P11 với phiên bản mở rộng**

Find:
```markdown
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
```

Replace with:
```markdown
## P11 — Auth thật + Security NFRs (Samsung CIP/AD SSO + Encryption + Audit + Masking)

**Mục tiêu:** Login thật qua Samsung CIP/AD OAuth 2.0/SSO + bật toàn bộ Security NFRs (MFA admin, PII encryption, audit log, PII masking, TLS enforce). Phase này tách biệt khỏi P0–P10 (nghiệp vụ) theo D3 trong spec.

### P11-BE-01: CIPADProvider implementation

- Implement `SSOProvider` interface:
  - `exchange(code)` → call CIP/AD token endpoint → parse user info (name, email, department, cipId, amr claim)
- Cấu hình: `spring.security.oauth2.client.*` trong `application-prod.yml`
- Inject bằng Spring profile: `dev` → MockSSOProvider; `prod` → CIPADProvider

### P11-BE-02: Department mapping

- Khi SSO callback, upsert `users.department` từ CIP/AD SRV Group
- Không cần bảng `departments` riêng — lưu thẳng string vào `users.department`
- Dashboard `by_department` group by `users.department` string (hoạt động tự nhiên vì P7 đã dùng users.department)

### P11-BE-03: Session timeout 30 phút

- Access token TTL: 30m (thay vì 15m cho dev)
- FE auto-refresh trước khi hết hạn hoặc logout

### P11-BE-04: MFA enforcement cho ADMIN

- Trong `AuthService` callback: nếu user role là `ADMIN`, kiểm tra `amr` claim từ CIP/AD chứa `mfa` (hoặc `mfa-otp`, `hwk`)
- Nếu không có → reject session, trả về 403 `MFA_REQUIRED`
- USER/AX_CREATOR/AX_SUPPORTER không yêu cầu MFA

### P11-BE-05: PII encryption at rest

- Implement `AesGcmStringConverter` (JPA `@Converter`) dùng AES-256-GCM
- Key đọc từ env var `PII_ENCRYPTION_KEY` (32 bytes base64; production từ vault)
- Apply `@Convert(converter = AesGcmStringConverter.class)` lên các field PII:
  - `User.email`
  - `User.cipId`
  - `User.department`
- Migration: re-encrypt existing rows nếu có (P11 dev DB rỗng → no-op)

### P11-BE-06: PII audit log

- Tạo `AuditLog` entity tương ứng schema V11 (đã có trong DLD §1.2)
- AOP `@Aspect` interceptor: log VIEW_PII/EDIT_PII/DELETE_PII cho các method trong:
  - `UserService.findById`, `findByEmail` → VIEW_PII
  - `AdminUserController.updateRole` → EDIT_PII
  - bất kỳ method trả về `User` hoặc `UserResponse`
- Async ghi vào `audit_logs` (qua `@Async` để không block request)
- Scheduled job `AuditCleanupJob` (Spring `@Scheduled(cron = "0 0 2 * * *")`) — xoá row có `occurred_at < NOW() - 30d`

### P11-BE-07: PII masking trong logs & error responses

- **Logback config:** thêm `MaskingPatternLayout` áp dụng regex masking trên log messages:
  - Email: `(\w)\w*@(\w+\.\w+)` → `$1***@$2`
  - CIP ID: full string → `***`
  - JWT tokens: pattern `Bearer eyJ\S+` → `Bearer ***`
- **GlobalExceptionHandler:** sanitize PII trong error response (không trả full email, không trả raw CIP ID)
- Test bằng unit test: log statement có email → assert masked output không chứa full email

### P11-NFR-01: TLS 1.2+ enforce ở ingress

- Cấu hình Nginx Ingress hoặc K8s Ingress với `ssl_protocols TLSv1.2 TLSv1.3`
- Disable TLS 1.0/1.1
- Backend container nhận traffic HTTP nội bộ (TLS terminated ở ingress)
- Document trong `infra/ingress.yaml`

### P11-FE-01: Real login flow

- `/login` → `POST /auth/login` → backend redirect CIP/AD
- `/auth/callback` → nhận JWT → store in authStore → redirect `/library`
- Handle 403 `MFA_REQUIRED` error cho ADMIN role: hiển thị "MFA required, please complete in CIP/AD"

**Tests:**
- Integration test với MockSSOProvider vẫn pass sau khi thêm CIPADProvider (profile separation)
- Unit test `AesGcmStringConverter`: encrypt/decrypt round-trip
- Integration test: ADMIN login không có `amr=mfa` → 403; có → 200
- Unit test logback masking: log "user@samsung.com" → log file chứa "u***@samsung.com"
- Integration test audit log: GET /admin/users/:id → audit_logs có row VIEW_PII

**Commit:** `feat(p11): SSO CIP/AD + MFA admin + PII encryption + audit log + PII masking + TLS enforce`
```

- [ ] **Step 3: Verify P11 expanded**

Run: `grep -c "P11-BE-" docs/2026-05-10-axon-implementation-plan.md`
Expected: 7 (BE-01 through BE-07)

Run: `grep -c "P11-NFR-" docs/2026-05-10-axon-implementation-plan.md`
Expected: 1

- [ ] **Step 4: Commit**

```bash
git add docs/2026-05-10-axon-implementation-plan.md
git commit -m "docs(plan): expand P11 with MFA, PII encryption, audit log, masking, TLS (7 BE tasks + 1 NFR)"
```

---

## Phase B — Rewrite design.md

### Task 5: design.md — Viết lại hoàn toàn (Context → §13, một lần ghi)

**Files:**
- Modify: `docs/2026-05-10-axon-design.md` (overwrite toàn bộ file với nội dung v2.1)

- [ ] **Step 1: Verify current state (sanity check)**

Run: `grep -n "^## " docs/2026-05-10-axon-design.md`
Expected: hiện ra ≥ 13 section headings (file cũ — sẽ bị overwrite)

- [ ] **Step 2: Overwrite toàn bộ file với nội dung v2.1 (đầy đủ §Context → §13)**

Dùng Write tool để ghi đè `docs/2026-05-10-axon-design.md` với nội dung sau (toàn bộ markdown block dưới đây là content cuối cùng của file):

```markdown
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
```

- [ ] **Step 3: Verify toàn bộ file đầy đủ**

Run: `wc -l docs/2026-05-10-axon-design.md`
Expected: ≥ 280 (≤ 350)

Run: `grep -c "^## " docs/2026-05-10-axon-design.md`
Expected: 14 (Context + §1 through §13)

Run: `grep -c "MinIO\|CLOSED\b\|department_id\|storage_key" docs/2026-05-10-axon-design.md`
Expected: 0 (none of stale terms still present)

Run: `grep -c "Docker Volume\|Docker volume\|3 trạng thái\|audit_logs" docs/2026-05-10-axon-design.md`
Expected: ≥ 3

- [ ] **Step 4: Commit**

```bash
git add docs/2026-05-10-axon-design.md
git commit -m "docs(design): full rewrite v2.1 — 3 statuses, Docker volume, 4 lookups, 12 phases, AI insight"
```

---

## Phase C — Edit uiux.md

### Task 6: uiux.md — §2 Status Badge Colors (drop CLOSED) + §5.2 StatusBadge component

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Bump version trong header**

Find:
```markdown
# AXon — UI/UX Design Document

**Version:** 2.0  
**Date:** 2026-05-11  
**Status:** Draft
```

Replace with:
```markdown
# AXon — UI/UX Design Document

**Version:** 2.1  
**Date:** 2026-05-12  
**Status:** Draft
```

- [ ] **Step 2: Update §2 Status Badge Colors — drop CLOSED**

Find:
```markdown
### Status Badge Colors

```
REQUESTED   → bg-amber-100   text-amber-700   (● Requested)
REJECTED    → bg-red-100     text-red-700     (✗ Rejected)
PUBLISHED   → bg-green-100   text-green-700   (✓ Published)
CLOSED      → bg-gray-100    text-gray-600    (○ Closed)
```
```

Replace with:
```markdown
### Status Badge Colors

```
REQUESTED   → bg-amber-100   text-amber-700   (● Requested)
REJECTED    → bg-red-100     text-red-700     (✗ Rejected)
PUBLISHED   → bg-green-100   text-green-700   (✓ Published)
```

> **Note:** Chỉ có 3 trạng thái BP. Action "close" (Supporter đóng BP đang published) chuyển status `PUBLISHED → REJECTED` và populate `close_reason`. Phân biệt close vs reject qua tooltip "Closed by supporter: <reason>" trên StatusBadge khi `close_reason != null`.
```

- [ ] **Step 3: Update §5.2 StatusBadge — drop CLOSED**

Find:
```markdown
### 5.2 StatusBadge

```
Props: status: BPStatus
Renders: pill badge với dot indicator + label

REQUESTED → ● Requested   (amber)
REJECTED  → ✗ Rejected    (red)
PUBLISHED → ✓ Published   (green)
CLOSED    → ○ Closed      (gray)
```
```

Replace with:
```markdown
### 5.2 StatusBadge

```
Props: status: BPStatus, closeReason?: string
Renders: pill badge với dot indicator + label

REQUESTED → ● Requested   (amber)
REJECTED  → ✗ Rejected    (red) — nếu closeReason có giá trị, tooltip "Closed by supporter: <reason>"
PUBLISHED → ✓ Published   (green)
```
```

- [ ] **Step 4: Verify**

Run: `grep -c "CLOSED" docs/2026-05-10-axon-uiux.md`
Expected: ≤ 4 (chỉ còn xuất hiện trong ReviewHistory như bp_reviews.action enum, hoặc trong các section sẽ sửa ở Task tiếp theo — không nên là badge nữa)

- [ ] **Step 5: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §2 + §5.2 — drop CLOSED status badge, 3-status only"
```

---

### Task 7: uiux.md — §4.1 Library Filter Panel + §5.5 FilterPanel component

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Update §4.1 Library Filter Panel block**

Find:
```markdown
│  ┌─── Filter Panel ────────────────────────────────────────┐ │
│  │ Job:         [All ▼]   AI Capability: [All ▼]           │ │
│  │ Work Cat.:   [All ▼]   Work:          [All ▼]           │ │
│  │ Department:  [All ▼]   BP Type:       [All ▼]           │ │
│  │ AI Tool:     [All ▼]                                    │ │
│  │                                                         │ │
│  │ Active filters: [Code Implementation ×] [Q&A ×]        │ │
│  └─────────────────────────────────────────────────────────┘ │
```

Replace with:
```markdown
│  ┌─── Filter Panel ────────────────────────────────────────┐ │
│  │ Job:         [All ▼]   AI Capability: [All ▼]           │ │
│  │ Work Cat.:   [All ▼]   Work:          [All ▼]           │ │
│  │ BP Type:     [All ▼]   Department:    [All ▼ ⓘ*]        │ │
│  │ AI Tools:    [🔍 search text...                     ]    │ │
│  │                                                         │ │
│  │ Active filters: [Code Implementation ×] [Q&A ×]        │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ⓘ* Department dropdown: distinct values từ users.department    │
│     (SRV Group từ CIP/AD). AI Tools: full-text search match    │
│     trên ai_tools_description (BP free text).                  │
```

- [ ] **Step 2: Update §5.5 FilterPanel component spec**

Find:
```markdown
### 5.5 FilterPanel

```
Props: filters: FilterState, onChange: (filters) => void
Renders: dropdowns cho 7 dimensions:
  - job (multi-select từ /api/v1/jobs)
  - ai_capability (multi-select)
  - work_category (single-select, clears work khi đổi)
  - work (single-select, filtered by work_category)
  - department (multi-select)
  - type: WEB | TOOL | EXTENSION (single-select)
  - ai_tool (multi-select)
Active filter chips bên dưới, clickable để xoá từng filter.
```
```

Replace with:
```markdown
### 5.5 FilterPanel

```
Props: filters: FilterState, onChange: (filters) => void
Renders: 6 filter dimensions:
  - job (multi-select từ /api/v1/jobs)
  - ai_capability (multi-select từ /api/v1/ai-capabilities)
  - work_category (single-select, clears work khi đổi)
  - work (single-select, filtered by work_category)
  - type: WEB | TOOL | EXTENSION (single-select)
  - department (multi-select; options = SELECT DISTINCT users.department FROM users)
  - ai_tools_search (textbox; backend match `ai_tools_description ILIKE %query%`)

Active filter chips bên dưới, clickable để xoá từng filter.

Note: Department không còn là lookup table — options kéo từ distinct
users.department string. AI Tools đổi từ multi-select dropdown sang
textbox search vì AI tools giờ là free text trong ai_tools_description.
```
```

- [ ] **Step 3: Verify**

Run: `grep -A 2 "AI Tools:" docs/2026-05-10-axon-uiux.md | head -5`
Expected: shows textbox/search wording

Run: `grep -c "ai_tools_description" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 2

- [ ] **Step 4: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §4.1 + §5.5 — filter panel uses department-distinct + ai_tools text search"
```

---

### Task 8: uiux.md — §4.2 Detail Page sidebar (AI Tool & Department fields)

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Update §4.2 Detail Page main content block**

Find:
```markdown
│  │ Job: [Code Impl.] [Research]        │  │              │  │
│  │ AI Capability: [Q&A]                │  │ Published:   │  │
│  │ AI Tool: [Claude]                   │  │ May 8, 2026  │  │
│  │ Work: Backend Development           │  │              │  │
│  │ Department: SRV, Platform           │  │ 👁 120 views  │  │
```

Replace with:
```markdown
│  │ Job: [Code Impl.] [Research]        │  │              │  │
│  │ AI Capability: [Q&A]                │  │ Published:   │  │
│  │ Work: Backend Development           │  │ May 8, 2026  │  │
│  │                                     │  │              │  │
│  │ AI Tools (free text):               │  │ 👁 120 views  │  │
│  │ "Claude, Cursor, GitHub Copilot"    │  │ ⬇ 45 downloads│  │
│  │                                     │  │ ❤ 32 likes   │  │
```

- [ ] **Step 2: Update "Web Content" header → add note "from creators" cho department**

Find:
```markdown
│  │ 🌐 Web Content  (WEB only)          │                    │
│  │ [text content or link — 256 chars]  │                    │
│  │                                     │                    │
│  │ 🔑 Key  (hidden from User)          │                    │
│  │ [key value — only AX Creator/Sup/Admin see this]         │
```

Replace with:
```markdown
│  │ 🌐 Web Content  (WEB only)          │                    │
│  │ [text content or link — 256 chars]  │                    │
│  │                                     │                    │
│  │ 🔑 Key  (hidden from User)          │                    │
│  │ [key value — only AX Creator owner/Supporter/Admin see]  │
│  │                                     │                    │
│  │ 🏢 Departments (from creators)      │                    │
│  │ SRV, Platform Engineering           │                    │
│  │ (auto-derived from creator profiles)│                    │
```

- [ ] **Step 3: Verify**

Run: `grep -c "AI Tools (free text)" docs/2026-05-10-axon-uiux.md`
Expected: 1

Run: `grep -c "from creators" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 1

- [ ] **Step 4: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §4.2 — detail sidebar AI Tools as free text, departments derived from creators"
```

---

### Task 9: uiux.md — §4.3 Register Form (drop Job/AI Tool/Department pickers)

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Update Step 1 form block**

Find:
```markdown
│  Work *  [Search and select work...]                 │
│  └─ Work Category auto-fills from selection          │
│                                                      │
│  Job (multiple)                                      │
│  [Search jobs...]                                    │
│  [Code Implementation ×]  [Research ×]               │
│                                                      │
│  AI Capability (multiple)                            │
│  [Search AI capabilities...]                         │
│  [Q&A ×]  [Workflow Assistant ×]                     │
│                                                      │
│  AI Tool (multiple)                                  │
│  [Search AI tools...]                                │
│  [Claude ×]  [Cursor ×]                              │
│                                                      │
│  Department (multiple — BPs này dành cho dept nào)   │
│  [Search departments...]                             │
│  [SRV ×]  [Platform ×]                               │
│                                                      │
│  Creator(s) *  (search CIP)                          │
```

Replace with:
```markdown
│  Work *  [Search and select work...]                 │
│  └─ Work Category và Job auto-fill từ selection      │
│     (1 Work xác định 1 Work Category và 1 Job)       │
│                                                      │
│  AI Capability * (single or multiple)                │
│  [Search AI capabilities...]                         │
│  [Q&A ×]  [Workflow Assistant ×]                     │
│                                                      │
│  AI Tools (free text, optional)                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Mô tả các AI tools sử dụng, ví dụ:            │  │
│  │ "Claude, Cursor, GitHub Copilot, ChatGPT"     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Creator(s) *  (search CIP)                          │
```

- [ ] **Step 2: Verify Step 1 changes**

Run: `grep -c "Job (multiple)" docs/2026-05-10-axon-uiux.md`
Expected: 0

Run: `grep -c "Department (multiple" docs/2026-05-10-axon-uiux.md`
Expected: 0

Run: `grep -c "AI Tools (free text" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 1

- [ ] **Step 3: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §4.3 — drop Job/AI Tool/Department pickers; AI Tools becomes free-text textarea"
```

---

### Task 10: uiux.md — §4.4 My BPs + §4.5 Management page (drop CLOSED status filter)

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Update §4.4 My BPs filter chips**

Find:
```markdown
│  Filter: [All Status ▼]  [REQUESTED] [REJECTED] [PUBLISHED] [CLOSED]│
```

Replace with:
```markdown
│  Filter: [All Status ▼]  [REQUESTED] [REJECTED] [PUBLISHED]  │
```

- [ ] **Step 2: Update §4.4 example rows — convert CLOSED example to REJECTED-from-close**

Find:
```markdown
│  ├──────────────────────────────────────────────────────┤   │
│  │ [🔧] Auto Review Tool           [○ CLOSED]   Apr 30  │   │
│  │      Lý do: "Tool đã được thay thế bởi v2"          │   │
│  │                                    [View]            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  (* Edit: chỉ hiện với REQUESTED và REJECTED;               │
│     PUBLISHED hiện Edit nhưng cần confirm vì BP sẽ ẩn)      │
```

Replace with:
```markdown
│  ├──────────────────────────────────────────────────────┤   │
│  │ [🔧] Auto Review Tool           [✗ REJECTED]  Apr 30 │   │
│  │      ⓘ Closed by supporter:                         │   │
│  │      "Tool đã được thay thế bởi v2"                 │   │
│  │                          [View] [Edit] [Resubmit]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  (Edit có sẵn cho mọi status; UX prompt khác nhau theo:     │
│    REQUESTED → edit tự do, status không đổi                  │
│    REJECTED  → edit + resubmit → REQUESTED                   │
│    PUBLISHED → confirm modal: "Sửa link/file sẽ ẩn BP"      │
│                không sửa link/file → status giữ PUBLISHED)   │
```

- [ ] **Step 3: Update §4.5 Management filter chips**

Find:
```markdown
│  Status: [All ▼]  [REQUESTED] [REJECTED] [PUBLISHED] [CLOSED]│
```

Replace with:
```markdown
│  Status: [All ▼]  [REQUESTED] [REJECTED] [PUBLISHED]  │
```

- [ ] **Step 4: Verify**

Run: `grep -c "CLOSED" docs/2026-05-10-axon-uiux.md`
Expected: ≤ 2 (chỉ còn trong ReviewHistory action enum sẽ sửa ở Task 15)

- [ ] **Step 5: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §4.4 + §4.5 — drop CLOSED status filter; close = REJECTED with tooltip"
```

---

### Task 11: uiux.md — §4.7 Dashboard rewrite (new metrics)

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Replace entire §4.7 Dashboard Page block**

Find:
```markdown
### 4.7 Dashboard Page (/dashboard) — AX Supporter

```
┌──────────────────────────────────────────────────────────────┐
│                         HEADER                                │
├──────────────────────────────────────────────────────────────┤
│  Dashboard                                                   │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ 👥 Submitters│ │ 📚 Total BPs │ │ ✓ Published  │         │
│  │     35       │ │     120      │ │     95       │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ ● Requested  │ │ ✗ Rejected   │ │ ○ Closed     │         │
│  │      8       │ │     12       │ │      5       │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ 💼 Jobs      │ │ 🤖 AI Cap.   │ │ 🏢 Depts     │         │
│  │      4       │ │      4       │ │     12       │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ┌──── Top 5 Creators ────────────────────────────────────┐  │
│  │ 1. Nguyen Van A     (15 published BPs)                 │  │
│  │ 2. Tran Thi B       (12 published BPs)                 │  │
│  │ 3. Le Van C         (9 published BPs)                  │  │
│  │ 4. Pham Thi D       (7 published BPs)                  │  │
│  │ 5. Hoang Van E      (5 published BPs)                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──── Top 5 Works ───────────────────────────────────────┐  │
│  │ 1. Backend Development   (23 BPs)                      │  │
│  │ 2. Code Review           (18 BPs)                      │  │
│  │ 3. Documentation         (14 BPs)                      │  │
│  │ 4. Testing               (11 BPs)                      │  │
│  │ 5. CI/CD                 (8 BPs)                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```
```

Replace with:
```markdown
### 4.7 Dashboard Page (/dashboard) — All Roles

```
┌──────────────────────────────────────────────────────────────┐
│                         HEADER                                │
├──────────────────────────────────────────────────────────────┤
│  Dashboard                          Date range: [📅 Last 6mo▼]│
│                                                              │
│  ── Overview ────────────────────────────────────────────    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ 👥 Submitters│ │ ✓ Published  │ │ ⬇ Total Use │         │
│  │     35       │ │      95      │ │    1,250    │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ 👤 Active    │ │ 💼 Jobs      │ │ 🤖 AI Cap.   │         │
│  │  Users: 87   │ │      4       │ │      5       │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ── By Job ──────────────────────────────────────────────    │
│  [Bar chart]                                                 │
│   Code Impl.  ████████████████ 40                            │
│   Research    ████████ 22                                    │
│   Operation   █████ 18                                       │
│   Report      ███ 15                                         │
│                                                              │
│  ── By AI Capability ────────────────────────────────────    │
│  [Pie chart]                                                 │
│   Q&A 30%  •  Workflow Assistant 25%  •  Auto Agent 20%      │
│   AI Tools & Apps 15%  •  AI Orchestration 10%               │
│                                                              │
│  ── By Department ───────────────────────────────────────    │
│  [Horizontal bar]                                            │
│   SRV          ████████████ 18                               │
│   Platform     ████████ 12                                   │
│   AI Lab       █████ 8                                       │
│   ...                                                        │
│                                                              │
│  ── Top 5 BPs by Work ───────────────────────────────────    │
│  [View more →] / row clickable → Library filtered            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. Backend Development   23 BPs    [Open in Library]   │  │
│  │ 2. Code Review           18 BPs    [Open in Library]   │  │
│  │ 3. Documentation         14 BPs    [Open in Library]   │  │
│  │ 4. Testing               11 BPs    [Open in Library]   │  │
│  │ 5. CI/CD                  8 BPs    [Open in Library]   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ── Usage Trend (6 tháng) ──────────────────────────────     │
│  [Line chart]                                                │
│  Dec │  ▆▆▆▆ 180                                             │
│  Jan │  ▆▆▆▆▆▆ 210                                           │
│  Feb │  ▆▆▆▆▆▆▆ 245                                          │
│  Mar │  ▆▆▆▆▆▆▆▆ 270                                         │
│  Apr │  ▆▆▆▆▆▆ 220                                           │
│  May │  ▆▆▆▆▆▆▆▆▆ 305                                        │
│                                                              │
│  ── Top 5 BPs by Usage (downloads) ──────────────────────    │
│  [View more →]                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. Claude Skills v2      320 downloads                 │  │
│  │ 2. VS Code AI Helper     280 downloads                 │  │
│  │ 3. Code Review Auto      245 downloads                 │  │
│  │ 4. Confluence Tool       190 downloads                 │  │
│  │ 5. PR Bot Skill          150 downloads                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Interactions:
  - "View more" trên Top 5 → Library với sort áp dụng (downloads desc)
  - Click 1 row trong Top 5 BP by Work → Library filtered theo work đó
  - Date range filter: áp dụng cho usage/active_users/trend; published count = all-time
  - Charts dùng Recharts hoặc Chart.js
  - Redis cache 15 phút per (startDate, endDate) key
```
```

- [ ] **Step 2: Verify**

Run: `grep -c "Top 5 BPs by Work\|Top 5 BPs by Usage\|Usage Trend\|Active Users\|Active.*Users" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 4

Run: `grep -c "Top 5 Creators" docs/2026-05-10-axon-uiux.md`
Expected: 0

Run: `grep -c "○ Closed" docs/2026-05-10-axon-uiux.md`
Expected: 0

- [ ] **Step 3: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §4.7 dashboard rewrite — add Top 5 by Work/Usage, Active Users, Usage Trend 6m, drop Top 5 Creators"
```

---

### Task 12: uiux.md — §4.8 Admin Master Data (6 → 4 categories)

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Update tab list**

Find:
```markdown
**Tab: Master Data**

```
┌──────────────────────────────────────────────────────────────┐
│  Admin › Master Data                                         │
│                                                              │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Job         │ │ AI Capability│ │ AI Tool      │          │
│  │ Work Cat.   │ │ Work         │ │ Department   │          │
│  └─────────────┘ └──────────────┘ └──────────────┘          │
│  (side nav hoặc accordion — chọn danh mục để quản lý)       │
```

Replace with:
```markdown
**Tab: Master Data** (4 categories)

```
┌──────────────────────────────────────────────────────────────┐
│  Admin › Master Data                                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [📋 Jobs] [🤖 AI Capabilities] [📁 Work Categories]    │  │
│  │ [🛠️  Works]                                              │  │
│  └────────────────────────────────────────────────────────┘  │
│  (tab navigation — chỉ 4 categories; Department và AI Tool   │
│   không còn là lookup vì lưu trực tiếp trong dữ liệu)         │
```

- [ ] **Step 2: Update "Job" example block — replace drag handle với upload button**

Find:
```markdown
│  Job                                    [+ Add Job]          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ⠿ Code Implementation    order: 1    [Edit] [Delete] │   │
│  │ ⠿ Research               order: 2    [Edit] [Delete] │   │
│  │ ⠿ Operation              order: 3    [Edit] [Delete] │   │
│  │ ⠿ Report                 order: 4    [Edit] [Delete*]│   │
│  └──────────────────────────────────────────────────────┘   │
│  ⠿ = drag handle để reorder                                 │
│  * Delete disabled (tooltip: "Đang được dùng bởi 5 BP")     │
```

Replace with:
```markdown
│  Job                          [+ Add Job]  [📤 Upload CSV]   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Code Implementation                    [Edit] [Delete]│   │
│  │ Research                               [Edit] [Delete]│   │
│  │ Operation                              [Edit] [Delete]│   │
│  │ Report                                 [Edit] [Delete*]│   │
│  └──────────────────────────────────────────────────────┘   │
│  * Delete disabled (tooltip: "Đang được dùng bởi 5 BP")     │
│  Upload CSV: bulk import từ template Excel/CSV               │
```

- [ ] **Step 3: Update "Work" example — keep work_category reference**

Find:
```markdown
│  Work                                   [+ Add Work]         │
│  Filter by Work Category: [All ▼]                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Backend Development   [Dev & Engineering]  [Edit][Del]│   │
│  │ Code Review           [Dev & Engineering]  [Edit][Del]│   │
│  │ Documentation         [Content]            [Edit][Del]│   │
│  └──────────────────────────────────────────────────────┘   │
```

Replace with:
```markdown
│  Work                       [+ Add Work]  [📤 Upload CSV]    │
│  Filter by Job: [All ▼]   Filter by Work Category: [All ▼]  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Backend Dev     code: BE  [Code Impl > Eng]  [E][D]  │   │
│  │ Code Review     code: CR  [Code Impl > Eng]  [E][D]  │   │
│  │ Documentation   code: DOC [Code Impl > Cont] [E][D]  │   │
│  └──────────────────────────────────────────────────────┘   │
│  Mỗi Work có `code` unique (≤ 50 chars), name (≤ 256 chars). │
```

- [ ] **Step 4: Update "Add Work" inline form**

Find:
```markdown
┌───── Add Work ─────────────────────────┐
│  Name *                                │
│  [Backend Development               ]  │
│                                        │
│  Work Category *                       │
│  [Dev & Engineering              ▼  ]  │
│                                        │
│               [Cancel]  [Save]         │
└────────────────────────────────────────┘
```

Replace with:
```markdown
┌───── Add Work ─────────────────────────┐
│  Name *                                │
│  [Backend Development               ]  │
│  0/256 chars                           │
│                                        │
│  Code * (unique)                       │
│  [BE                                ]  │
│  0/50 chars                            │
│                                        │
│  Job *                                 │
│  [Code Implementation            ▼  ]  │
│                                        │
│  Work Category * (filtered by Job)     │
│  [Engineering                    ▼  ]  │
│  (đổi Job → reset Work Category)       │
│                                        │
│  Description (max 4096 chars)          │
│  [                                  ]  │
│                                        │
│               [Cancel]  [Save]         │
└────────────────────────────────────────┘
```

- [ ] **Step 5: Verify**

Run: `grep -c "AI Tool" docs/2026-05-10-axon-uiux.md`
Expected: chỉ còn AI Tools free text references (1-3 matches), không phải lookup category

Run: `grep -c "drag handle" docs/2026-05-10-axon-uiux.md`
Expected: 0

- [ ] **Step 6: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §4.8 master data — 4 categories, drop drag-reorder, add Upload CSV, Work code field"
```

---

### Task 13: uiux.md — Add §4.10 AI Insight Page mockup

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Append §4.10 sau §4.9 Analytics view**

Find (end of §4.9):
```markdown
│  [Avatar] Le T C    • 5d ago                                │
│  "Cần thêm ví dụ cụ thể hơn cho từng use case"             │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Component Specifications
```

Replace with:
```markdown
│  [Avatar] Le T C    • 5d ago                                │
│  "Cần thêm ví dụ cụ thể hơn cho từng use case"             │
└──────────────────────────────────────────────────────────────┘
```

### 4.10 AI Insight Page (/ai-insight) — All Roles

Static content giới thiệu 5 AI capability classifications. Backend trả về hardcoded data từ `GET /api/v1/ai-insight` (không query DB).

```
┌──────────────────────────────────────────────────────────────┐
│                         HEADER                                │
├──────────────────────────────────────────────────────────────┤
│  AI Code Insight — Capability Classifications                │
│                                                              │
│  AXon phân loại Best Practices theo 5 loại AI capability,    │
│  mỗi loại có embodiments và scope khác nhau.                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Q&A                                              │    │
│  │ ─────────────────────────────────────────────────── │    │
│  │ BPs to use AI as a search engine, looking for       │    │
│  │ answers of simple repetitive questions.             │    │
│  │                                                     │    │
│  │ Embodiments: Prompting templates, Chatbots          │    │
│  │ Scope: Individual / small specific team             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 2. Workflow Assistant                               │    │
│  │ ─────────────────────────────────────────────────── │    │
│  │ BPs to use AI as a collaborator to solve or execute │    │
│  │ some steps of a job (with/without step-by-step      │    │
│  │ approval by human).                                 │    │
│  │                                                     │    │
│  │ Embodiments:                                        │    │
│  │  • Cline rules/skills/workflows                     │    │
│  │  • MCP implementations/configurations               │    │
│  │  • Custom workflows                                 │    │
│  │ Scope: Across Dept/group with same job              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 3. Autonomous AI Agent                              │    │
│  │ ─────────────────────────────────────────────────── │    │
│  │ BPs to build AI agents that automatically decide    │    │
│  │ and implement tasks using determined tools.         │    │
│  │                                                     │    │
│  │ Embodiments:                                        │    │
│  │  • Standalone AI agents (tools + execute actions)   │    │
│  │  • Multi-agent systems                              │    │
│  │ Scope: Company-wide with general purposes           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 4. AI-based Tools and Applications                  │    │
│  │ ─────────────────────────────────────────────────── │    │
│  │ BPs that build up and deploy specific purpose       │    │
│  │ AI-based tools.                                     │    │
│  │                                                     │    │
│  │ Embodiments:                                        │    │
│  │  • Fine-tuned models/tools for specific purpose     │    │
│  │ Scope: Specific technical domain, design solutions  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 5. AI Orchestration                                 │    │
│  │ ─────────────────────────────────────────────────── │    │
│  │ BPs to create AI agents that analyze, select, and   │    │
│  │ organize other agents to solve complex problems.    │    │
│  │                                                     │    │
│  │ Embodiments: AI-driven products                     │    │
│  │ Scope: AI-driven UX, AI-driven logic and workflows  │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

Layout: 5 cards stacked vertical desktop, single column mobile.
Card: number + name (H2), description (body), embodiments (bulleted list), scope (footer).
```

---

## 5. Component Specifications
```

- [ ] **Step 2: Verify**

Run: `grep -c "AI Code Insight" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 1

Run: `grep -c "AI Orchestration" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 1

- [ ] **Step 3: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): add §4.10 AI Insight page mockup (5 capability cards)"
```

---

### Task 14: uiux.md — Add §4.11 Admin User Management mockup detail

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Replace existing "Tab: Users" thin block với mockup chi tiết và append §4.11**

Find:
```markdown
**Tab: Users**

```
│  🔍 [Search by name, email, CIP ID...]   Filter: [All ▼]    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Nguyen Van A  nvana@s.com  CIP:001  [AX_CREATOR ▼]  │   │
│  │ Tran Thi B    tthib@s.com  CIP:002  [AX_SUPPORTER▼] │   │
│  │ Le Van C      lvc@s.com    CIP:003  [USER         ▼] │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```
```

Replace with:
```markdown
**Tab: Users**

```
│  🔍 [Search by name, email, CIP ID, department...]          │
│  Filter: Role [All ▼]   Department [All ▼]                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Name         Email          CIP ID  Dept    Role        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Nguyen V.A   nvana@s.com    001     SRV     [AX_CR ▼]* │ │
│  │ Tran T.B     tthib@s.com    002     PE      [AX_SUP▼]  │ │
│  │ Le V.C       lvc@s.com      003     SRV     [USER  ▼]  │ │
│  │ Pham T.D     ptd@s.com      004     AI Lab  [ADMIN ▼]  │ │
│  └────────────────────────────────────────────────────────┘ │
│  Pagination: 20/page                                         │
│                                                              │
│  Role dropdown options:                                      │
│   • USER                                                     │
│   • AX_SUPPORTER (admin assigns)                             │
│   • ADMIN (admin assigns)                                    │
│  ─ AX_CREATOR (*): không assign thủ công — auto khi user    │
│    submit BP đầu tiên. Hiện trong dropdown như read-only,    │
│    không thể chuyển user thành/từ AX_CREATOR thủ công.       │
│                                                              │
│  Confirm dialog khi đổi role:                                │
│  ┌─── Confirm Role Change ──────────────────────────────┐    │
│  │ Đổi role của "Nguyen V.A" từ AX_CREATOR → ADMIN?    │    │
│  │ User sẽ nhận đầy đủ quyền Admin (manage user,        │    │
│  │ CRUD master data, etc.).                             │    │
│  │                                                       │    │
│  │                          [Cancel]  [Confirm]          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Note: BP của user vẫn giữ nguyên creators khi role đổi.    │
└──────────────────────────────────────────────────────────────┘
```
```

- [ ] **Step 2: Verify**

Run: `grep -c "Confirm Role Change\|auto khi user.*submit BP\|không assign thủ công" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 2

- [ ] **Step 3: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §4.8 user management — expand with role dropdown logic, confirm dialog"
```

---

### Task 15: uiux.md — §5.7 ReviewPanel + §5.8 ReviewHistory (drop CLOSED state)

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Update §5.7 ReviewPanel**

Find:
```markdown
### 5.7 ReviewPanel (AX Supporter)

```
Props: bp, onApprove, onReject, onClose
Renders tuỳ theo status hiện tại của BP:
  - REQUESTED: [Reject button (cần comment)] + [Approve button]
               ⚠ Nếu supporter là creator: cả 2 button disabled + warning message
  - PUBLISHED: [Close button (cần reason)]
  - REJECTED / CLOSED: read-only history

Comment textarea bắt buộc khi Reject; reason textarea bắt buộc khi Close.
```
```

Replace with:
```markdown
### 5.7 ReviewPanel (AX Supporter)

```
Props: bp, onApprove, onReject, onClose
Renders tuỳ theo status hiện tại của BP:
  - REQUESTED: [Reject button (cần comment)] + [Approve button]
               ⚠ Nếu supporter là creator: cả 2 button disabled + warning message
  - PUBLISHED: [Close button (cần reason)]
               Click Close → popup nhập reason → confirm → status=REJECTED, close_reason populated
  - REJECTED:  read-only review history (timeline)
               Display close_reason nếu có (BP bị close từ PUBLISHED)
               Display latest reject comment nếu có (BP bị reject từ REQUESTED)

Comment textarea bắt buộc khi Reject; reason textarea bắt buộc khi Close.
Reject và Close mở popup riêng biệt để phân biệt 2 luồng.
```
```

- [ ] **Step 2: Update §5.8 ReviewHistory**

Find:
```markdown
### 5.8 ReviewHistory

```
Props: reviews: BpReview[]
Renders: vertical timeline

  ● Submitted        (2026-05-08 09:00, by Nguyen Van A)
  ├─ ✗ Rejected      (2026-05-09 10:30, by Admin Huy)
  │     "Thiếu installation guide"
  ├─ ● Resubmitted   (2026-05-09 14:00, by Nguyen Van A)
  └─ ✓ Approved      (2026-05-10 09:00, by Admin Huy)
```
```

Replace with:
```markdown
### 5.8 ReviewHistory

```
Props: reviews: BpReview[]   (mỗi entry có action: APPROVED | REJECTED | CLOSED)
Renders: vertical timeline; CLOSED action label "Closed" nhưng status sau action là REJECTED

  ● Submitted        (2026-05-08 09:00, by Nguyen Van A)
  ├─ ✗ Rejected      (2026-05-09 10:30, by Admin Huy)
  │     "Thiếu installation guide"
  ├─ ✓ Approved      (2026-05-10 09:00, by Admin Huy)
  ├─ ⊗ Closed        (2026-05-15 11:00, by Admin Huy)
  │     "Tool đã được thay thế bởi v2"   ← close_reason
  └─ (BP đang ở status REJECTED, creator có thể edit + resubmit)

Note: bp_reviews.action có 3 enum: APPROVED, REJECTED, CLOSED.
Status của BP chỉ có 3 enum: REQUESTED, REJECTED, PUBLISHED.
Action CLOSED và REJECTED đều dẫn đến status=REJECTED — timeline
phân biệt 2 trường hợp này qua icon (⊗ Closed vs ✗ Rejected) và content
(close_reason vs review comment).

Resubmit không có riêng row trong bp_reviews (suy ra từ status transition;
hiển thị implicit qua updated_at của BP).
```
```

- [ ] **Step 3: Verify**

Run: `grep -c "CLOSED\b" docs/2026-05-10-axon-uiux.md`
Expected: ≤ 4 (chỉ còn xuất hiện trong context bp_reviews.action enum description)

- [ ] **Step 4: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §5.7 + §5.8 — review components reflect 3-status model with CLOSED as action only"
```

---

### Task 16: uiux.md — §6.7 Close BP flow + §7 edge case for edit-published

**Files:**
- Modify: `docs/2026-05-10-axon-uiux.md`

- [ ] **Step 1: Update §6.7 Close BP flow**

Find:
```markdown
### 6.7 Close BP (AX Supporter)

```
Management → thấy BP PUBLISHED → click [Close]
→ Modal: "Nhập lý do đóng BP" → [Close BP]
→ Status → CLOSED, BP ẩn khỏi library
→ email to AX Creator: "Your BP was closed: [reason]"
```
```

Replace with:
```markdown
### 6.7 Close BP (AX Supporter)

```
Management → thấy BP PUBLISHED → click [Close]
→ Modal: "Nhập lý do đóng BP" (close_reason textarea, bắt buộc) → [Close BP]
→ Backend: bp.status = REJECTED; bp.close_reason = reason
→ Backend: insert bp_reviews row (action=CLOSED, comment=reason)
→ Status badge hiển thị "✗ REJECTED" với tooltip "Closed by supporter: [reason]"
→ BP ẩn khỏi library (vì status != PUBLISHED)
→ Email to AX Creator: "Your BP was closed: [reason]. You may edit and resubmit."
→ Creator có thể vào My BPs → Edit → resubmit (status → REQUESTED)
```
```

- [ ] **Step 2: Add §6.8 Edit Published BP — no file/link change (edge case from spec)**

Find (end of §6 User Flows, before §7):
```markdown
### 6.7 Close BP (AX Supporter)
```

(After updating §6.7, append §6.8 sau khối 6.7)

Find:
```markdown
→ Email to AX Creator: "Your BP was closed: [reason]. You may edit and resubmit."
→ Creator có thể vào My BPs → Edit → resubmit (status → REQUESTED)
```

---

## 7. Empty States & Edge Cases
```

Replace with:
```markdown
→ Email to AX Creator: "Your BP was closed: [reason]. You may edit and resubmit."
→ Creator có thể vào My BPs → Edit → resubmit (status → REQUESTED)
```

### 6.8 Edit Published BP — Không sửa file/link

```
My BPs → BP PUBLISHED → click [Edit]
→ Form opens với data hiện tại
→ Creator chỉ sửa metadata (name, description, installation_guide, AI capability...)
→ KHÔNG sửa web_content (WEB type) hoặc file upload (TOOL/EXTENSION)
→ Click [Save]
→ Modal info: "Chỉ thay đổi metadata, BP vẫn published."
→ Status giữ PUBLISHED, BP vẫn hiển thị trên library, không cần review lại
```

So sánh với flow §6.5 (Edit Published with file/link change → REQUESTED + ẩn):
Backend tự detect "có thay đổi web_content/files" để quyết định status mới.

---

## 7. Empty States & Edge Cases
```

- [ ] **Step 3: Add edge case to §7 table**

Find:
```markdown
| Feedback trên BP không phải PUBLISHED | Form ẩn, hiển thị "Chỉ có thể feedback BP đã published" |
```

Replace with:
```markdown
| Feedback trên BP không phải PUBLISHED | Form ẩn, hiển thị "Chỉ có thể feedback BP đã published" |
| Edit Published BP — không sửa file/link | Save thành công, status giữ PUBLISHED, hiển thị info "BP vẫn published" |
| Edit Published BP — có sửa file/link | Modal confirm trước, status → REQUESTED + BP ẩn, hiển thị warning "BP sẽ chờ review lại" |
```

- [ ] **Step 4: Verify**

Run: `grep -c "Status → CLOSED" docs/2026-05-10-axon-uiux.md`
Expected: 0

Run: `grep -c "không sửa file/link\|status giữ PUBLISHED" docs/2026-05-10-axon-uiux.md`
Expected: ≥ 2

- [ ] **Step 5: Commit**

```bash
git add docs/2026-05-10-axon-uiux.md
git commit -m "docs(uiux): §6.7 + §6.8 + §7 — close = REJECTED with tooltip, edit-published-no-change preserves status"
```

---

## Phase D — Final verification

### Task 17: Full doc consistency check + summary commit

**Files:** all 6 docs

- [ ] **Step 1: Cross-doc consistency check**

Run sequence (verify all docs đồng bộ):

```bash
# CLOSED enum không còn là BP status
grep -l "REQUESTED.*REJECTED.*PUBLISHED.*CLOSED\|CLOSED.*REQUESTED.*REJECTED.*PUBLISHED" docs/2026-05-10-axon-*.md
# Expected: empty (no file has 4-status list)

# MinIO không còn trong docs nào
grep -l "MinIO\|minio_bucket\|minio_key\|storage_key" docs/2026-05-10-axon-*.md
# Expected: empty

# departments lookup table không còn
grep -l "department_id.*UUID.*FK\|bp_departments\|bp_ai_tools" docs/2026-05-10-axon-*.md
# Expected: empty

# version 2.1 hiện diện
grep -l "Version:\*\* 2\.1\|v2\.1" docs/2026-05-10-axon-*.md
# Expected: ≥ 6 (requirements, hld, dld, implementation-plan, design, uiux)

# Auth NFR additions có trong requirements
grep -c "AES-256\|MFA\|PII audit\|PII masking" docs/2026-05-10-axon-requirements.md
# Expected: ≥ 4

# audit_logs table có trong DLD
grep -c "audit_logs\b" docs/2026-05-10-axon-dld.md
# Expected: ≥ 3

# P11 mở rộng
grep -c "P11-BE-0[4567]" docs/2026-05-10-axon-implementation-plan.md
# Expected: 4

# design.md có 12 phases
grep -c "P[0-9]\+ " docs/2026-05-10-axon-design.md
# Expected: ≥ 12

# uiux.md có AI Insight + User Management
grep -c "AI Code Insight\|Confirm Role Change" docs/2026-05-10-axon-uiux.md
# Expected: ≥ 2

# uiux.md không còn CLOSED badge/status
grep -c "○ CLOSED\|○ Closed\|status=CLOSED" docs/2026-05-10-axon-uiux.md
# Expected: 0
```

- [ ] **Step 2: Smoke-read all 6 docs**

Verify mỗi doc:
- Có version 2.1 (hoặc cao hơn) trong header
- TOC/section list không broken
- Không còn placeholder TBD/TODO/FIXME
- Style/format consistent với batch trước

```bash
# Quick check: no placeholders
grep -ln "TBD\|TODO:\|FIXME\|XXX\b" docs/2026-05-10-axon-*.md
# Expected: empty hoặc match chỉ là phần code example documented intentionally
```

- [ ] **Step 3: Tạo review notes file (optional, recommended)**

Tạo `docs/2026-05-13-axon-remaining-update-review.md` ghi lại:
- Changes summary của Phase A/B/C
- Open questions còn lại (D11+ nếu có)
- Pre-execution checklist cho người thực thi code

```markdown
# AXon — Remaining Docs Update Review Notes

**Ngày tạo:** 2026-05-13
**Phạm vi:** đóng spec [[2026-05-12-axon-remaining-docs-design]] và 6 docs

## 1. Đã sửa trong batch này

| # | File | Phase | Sửa |
|---|------|-------|-----|
| 1 | requirements.md | A | §6.2 mở rộng auth NFRs (AES, MFA, audit, masking — P11 deferred) |
| 2 | hld.md | A | Thêm §5.1 Security NFRs, expand §10 P11 scope |
| 3 | dld.md | A | Thêm V11 audit_logs schema (P11-deferred note) |
| 4 | implementation-plan.md | A | Mở rộng P11 với 4 BE tasks + 1 NFR task |
| 5 | design.md | B | Viết lại hoàn toàn — 3 statuses, Docker volume, 4 lookups, 12 phases |
| 6 | uiux.md | C | Edit §2/§4/§5/§6/§7; add §4.10 AI Insight, expand User Management |

## 2. Decisions đã apply (từ spec D1-D10)

(copy từ spec)

## 3. Còn mở

- O1-O6 (xem spec)

## 4. Pre-execution checklist

Trước khi bắt đầu code theo plan (chuyển sang execute implementation-plan.md):
- [ ] Đọc lại requirements v2.1 §6.2 đầy đủ — confirm scope P11 deferred
- [ ] Confirm decision O6: audit_logs schema có included trong V11 migration baseline (P0)
- [ ] Confirm decision O4: Department filter UX (dropdown DISTINCT vs textbox)
- [ ] Confirm decision O5: AI Tools search (free-text ILIKE vs autocomplete)
- [ ] Re-run uiux.md visual check trên Figma/Excalidraw nếu cần (out of scope cho text spec)
```

- [ ] **Step 4: Commit review notes (nếu Step 3 đã tạo)**

```bash
git add docs/2026-05-13-axon-remaining-update-review.md
git commit -m "docs: add review notes for remaining docs update (Phase A/B/C summary)"
```

- [ ] **Step 5: Final cross-check**

```bash
git log --oneline -20
# Expected: ≥ 17 commits từ task 1 đến task 18 (mỗi task 1 commit; task 5+6 + task 18 step 4 có thêm)
```

---

## Definition of Done

- [ ] Tất cả 17 tasks completed
- [ ] Tất cả 6 docs có version 2.1
- [ ] Cross-doc consistency check trong Task 17 Step 1 đều pass (commands return expected results)
- [ ] Không còn references đến MinIO/S3, CLOSED-as-status, 6-lookups, department_id FK trong bất kỳ doc nào
- [ ] design.md không còn references "4 phases" cũ — đồng bộ 12-phase P0–P11
- [ ] uiux.md không còn references "○ Closed" badge hoặc filter chip CLOSED
- [ ] Tất cả commits có message rõ ràng (đã prefix `docs(xxx):`)
- [ ] Review notes file đã tạo (Task 17 Step 3) — recommended
