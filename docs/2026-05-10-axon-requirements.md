# AXon — Requirements Document

**Version:** 1.1  
**Date:** 2026-05-10  
**Status:** Approved

---

## 1. Tổng quan hệ thống

AXon là nền tảng web nội bộ cho phép nhân viên công ty đăng ký, chia sẻ và khám phá các AI best practice trong lĩnh vực phát triển phần mềm. Hệ thống có quy trình kiểm duyệt trước khi công khai và cơ chế xếp hạng theo mức độ sử dụng.

---

## 2. Stakeholders

| Vai trò | Mô tả |
|---------|-------|
| **Contributor (User)** | Nhân viên đăng ký và chia sẻ best practice |
| **Admin** | Kiểm duyệt và phê duyệt best practice trước khi publish |
| **Consumer (User)** | Nhân viên tìm kiếm, xem và tải best practice |
| **PM** | Quản lý quy trình, thiết lập tiêu chí phê duyệt |
| **System** | Agent Builder (hệ thống bên ngoài, đã tồn tại) |

---

## 3. Functional Requirements

### FR-AUTH: Xác thực & Phân quyền

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-AUTH-01 | Người dùng đăng nhập qua SSO của công ty (OAuth2/SAML/OIDC) | Must |
| FR-AUTH-02 | Không có tài khoản local — SSO là bắt buộc | Must |
| FR-AUTH-03 | Hệ thống cấp JWT access token (TTL 15 phút) và refresh token (TTL 7 ngày) sau khi SSO thành công | Must |
| FR-AUTH-04 | Người dùng có thể đăng xuất, hệ thống huỷ session và refresh token | Must |
| FR-AUTH-05 | Role USER là mặc định khi tài khoản mới được tạo | Must |
| FR-AUTH-06 | Admin có thể nâng/hạ quyền của người dùng khác | Must |

### FR-BP: Quản lý Best Practice

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-BP-01 | Người dùng tạo best practice với trạng thái DRAFT | Must |
| FR-BP-02 | Best practice hỗ trợ kết hợp nhiều loại (Multi-types): MCP, SKILL, RULE, WORKFLOW, HOOKS, PROMPT, TOOL | Must |
| FR-BP-03 | Thông tin best practice gồm: tiêu đề, mô tả, danh sách loại, hướng dẫn sử dụng, hướng dẫn cài đặt, tags (role-based), liên kết ngoài | Must |
| FR-BP-04 | Người dùng upload nhiều file đính kèm cho một best practice | Must |
| FR-BP-05 | Người dùng submit best practice để chờ duyệt (DRAFT → PENDING_REVIEW) | Must |
| FR-BP-06 | Người dùng chỉnh sửa best practice của mình khi đang ở trạng thái DRAFT hoặc REJECTED | Must |
| FR-BP-07 | Người dùng xoá best practice của mình khi đang ở trạng thái DRAFT | Must |
| FR-BP-08 | Best practice loại WORKFLOW có trường liên kết đến workflow ID trong Agent Builder | Must |
| FR-BP-09 | Người dùng xem danh sách best practice của mình kèm trạng thái hiện tại | Must |

### FR-BROWSE: Tìm kiếm & Khám phá

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-BROWSE-01 | Chỉ best practice có trạng thái PUBLISHED mới hiển thị trên trang browse | Must |
| FR-BROWSE-02 | Người dùng lọc best practice theo loại (hỗ trợ tìm kiếm trong mảng types) | Must |
| FR-BROWSE-03 | Người dùng tìm kiếm theo từ khoá (tiêu đề, mô tả, tags) | Must |
| FR-BROWSE-04 | Người dùng sắp xếp kết quả theo: mới nhất, phổ biến nhất (usage_score) | Must |
| FR-BROWSE-05 | Trang chủ hiển thị section "Trending" — top 10 best practice theo usage_score | Must |
| FR-BROWSE-06 | Người dùng xem chi tiết best practice: mô tả đầy đủ, files, links, usage guide, install guide | Must |
| FR-BROWSE-07 | Người dùng download file đính kèm (yêu cầu đăng nhập) | Must |
| FR-BROWSE-08 | Người dùng xem và truy cập workflow trong Agent Builder (với loại WORKFLOW) | Must |

### FR-APPROVAL: Quy trình kiểm duyệt

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-APPROVAL-01 | Admin xem danh sách best practice chờ duyệt (PENDING_REVIEW, UNDER_REVIEW) | Must |
| FR-APPROVAL-02 | Admin chuyển trạng thái sang UNDER_REVIEW khi bắt đầu xem xét | Must |
| FR-APPROVAL-03 | Admin phê duyệt best practice → trạng thái chuyển sang PUBLISHED | Must |
| FR-APPROVAL-04 | Admin từ chối best practice kèm comment lý do → trạng thái chuyển sang REJECTED | Must |
| FR-APPROVAL-05 | Contributor nhận thông báo khi best practice được approve hoặc reject | Must |
| FR-APPROVAL-06 | Admin xem toàn bộ lịch sử phê duyệt của một best practice | Should |
| FR-APPROVAL-07 | Admin xem stats: tổng số BP theo trạng thái, tổng số người dùng | Should |

### FR-RANKING: Xếp hạng

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-RANKING-01 | Hệ thống ghi log mỗi lần người dùng VIEW, DOWNLOAD, hoặc WORKFLOW_USED | Must |
| FR-RANKING-02 | usage_score được tính theo công thức: `(download × 3) + (workflow_used × 5) + (view × 0.5)` với time decay theo tuần | Must |
| FR-RANKING-03 | usage_score được tính lại mỗi 1 giờ qua scheduled job | Must |
| FR-RANKING-04 | Kết quả trending được cache vào Redis, TTL 1 giờ | Must |

### FR-INTEGRATION: Agent Builder

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-INT-01 | Backend proxy các request đến Agent Builder API | Must |
| FR-INT-02 | Detail page của WORKFLOW BP hiển thị thông tin workflow từ Agent Builder | Must |
| FR-INT-03 | Khi người dùng nhấn "Use Workflow", hệ thống log WORKFLOW_USED và redirect/embed Agent Builder | Must |

---

## 4. Non-Functional Requirements

### NFR-SEC: Bảo mật

| ID | Yêu cầu |
|----|---------|
| NFR-SEC-01 | Tất cả API endpoint yêu cầu xác thực JWT (trừ `/auth/*` và public browse) |
| NFR-SEC-02 | File download dùng pre-signed URL với TTL 15 phút — không expose storage key |
| NFR-SEC-03 | CORS chỉ cho phép origin của frontend domain |
| NFR-SEC-04 | Input validation trên tất cả API: max length, allowed types, sanitize |
| NFR-SEC-05 | Rate limiting: 100 req/phút/user cho API thông thường, 10 req/phút cho upload |
| NFR-SEC-06 | JWT không chứa thông tin nhạy cảm ngoài user ID và role |

### NFR-PERF: Hiệu năng

| ID | Yêu cầu |
|----|---------|
| NFR-PERF-01 | Browse API trả về trong < 500ms ở P95 |
| NFR-PERF-02 | File upload tối đa 50MB mỗi file |
| NFR-PERF-03 | Trending API dùng Redis cache — TTL 1 giờ |
| NFR-PERF-04 | Database index trên: `best_practices.status`, `best_practices.types`, `best_practices.usage_score` |

### NFR-UX: Trải nghiệm người dùng

| ID | Yêu cầu |
|----|---------|
| NFR-UX-01 | Giao diện responsive — hỗ trợ desktop (1280px+) và tablet (768px+) |
| NFR-UX-02 | Loading state hiển thị khi fetch data |
| NFR-UX-03 | Error message rõ ràng khi thao tác thất bại |
| NFR-UX-04 | Submit form có quy trình 4 bước và định hướng tags theo role |

### NFR-OPS: Vận hành

| ID | Yêu cầu |
|----|---------|
| NFR-OPS-01 | Môi trường dev chạy hoàn toàn qua Docker Compose |
| NFR-OPS-02 | Health check endpoint: `GET /actuator/health` |
| NFR-OPS-03 | Structured logging (JSON format) để dễ tích hợp với log aggregator |
| NFR-OPS-04 | Database migration tự động qua Flyway khi startup |

---

## 5. User Stories

### Contributor

```
US-C-01: Là một developer, tôi muốn đăng ký skill set tôi dùng hàng ngày
         để đồng nghiệp có thể tìm thấy và dùng lại.

US-C-02: Là một contributor, tôi muốn đính kèm file cấu hình vào best practice
         để người dùng có thể tải về và dùng ngay.

US-C-03: Là một contributor, tôi muốn biết trạng thái review của best practice mình đã submit
         và nhận thông báo khi có kết quả.

US-C-04: Là một contributor, tôi muốn chỉnh sửa best practice bị reject
         dựa theo feedback của admin rồi submit lại.
```

### Consumer

```
US-U-01: Là một developer mới, tôi muốn tìm kiếm MCP config cho Confluence
         để tích hợp vào workflow của mình mà không cần tự nghiên cứu.

US-U-02: Là một user, tôi muốn xem những best practice phổ biến nhất
         để biết cộng đồng đang dùng gì hiệu quả.

US-U-03: Là một user, tôi muốn tải file cấu hình về máy
         để áp dụng ngay vào dự án của mình.

US-U-04: Là một user, tôi muốn truy cập workflow trong Agent Builder trực tiếp từ AXon
         để không cần chuyển qua lại giữa hai hệ thống.
```

### Admin

```
US-A-01: Là admin, tôi muốn thấy danh sách best practice đang chờ duyệt
         để xử lý theo thứ tự ưu tiên.

US-A-02: Là admin, tôi muốn xem đầy đủ nội dung (file, links, hướng dẫn) của best practice
         trước khi quyết định approve hoặc reject.

US-A-03: Là admin, tôi muốn để lại comment khi reject
         để contributor hiểu lý do và cải thiện.

US-A-04: Là admin, tôi muốn quản lý danh sách user và phân quyền
         để kiểm soát ai có thể trở thành admin.
```

---

## 6. Acceptance Criteria (chính)

### AC-01: Đăng ký Best Practice thành công
- Given: User đã đăng nhập
- When: User điền đầy đủ thông tin (title, types, description) và nhấn Submit
- Then: BP tạo với status DRAFT, user thấy trong "My Submissions"

### AC-02: Submit để review
- Given: BP đang ở status DRAFT
- When: User nhấn "Submit for Review"
- Then: Status chuyển sang PENDING_REVIEW, admin nhận thông báo

### AC-03: Admin approve
- Given: BP đang PENDING_REVIEW hoặc UNDER_REVIEW
- When: Admin nhấn Approve
- Then: Status chuyển PUBLISHED, contributor nhận email thông báo, BP xuất hiện trên browse

### AC-04: Admin reject
- Given: BP đang PENDING_REVIEW hoặc UNDER_REVIEW
- When: Admin nhấn Reject với comment
- Then: Status chuyển REJECTED, contributor nhận email với lý do

### AC-05: Download file
- Given: BP đã PUBLISHED, user đã đăng nhập
- When: User nhấn Download trên file
- Then: File download bắt đầu, hệ thống log action DOWNLOAD

### AC-06: Trending cập nhật
- Given: User download một BP 5 lần trong 1 giờ
- When: Ranking job chạy
- Then: BP đó tăng usage_score và xuất hiện trong danh sách trending

---

## 7. Constraints & Assumptions

- SSO provider chưa xác định — thiết kế dạng plugin, dev dùng mock SSO
- Agent Builder đã tồn tại và có REST API — AXon chỉ proxy, không tự build
- File storage: MinIO trong dev, có thể thay bằng S3 trên prod
- Không có tính năng comment/thảo luận trong scope này
- Không có tính năng versioning cho best practice trong scope này
- Notification trong phase đầu chỉ là email, in-app notification là nice-to-have
