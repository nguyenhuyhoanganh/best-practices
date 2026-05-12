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
