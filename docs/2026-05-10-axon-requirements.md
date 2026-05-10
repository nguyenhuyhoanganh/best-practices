# AXon — Requirements Document

**Version:** 1.2  
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
| FR-AUTH-01 | Người dùng đăng nhập bằng tài khoản nội bộ (Username/Password) | Must |
| FR-AUTH-02 | Tài khoản admin mặc định được tạo sẵn: `admin@axon.com / 12345678` | Must |
| FR-AUTH-03 | Hệ thống cấp JWT access token (TTL 15 phút) và refresh token (TTL 7 ngày) sau khi đăng nhập thành công | Must |
| FR-AUTH-04 | Mật khẩu được mã hoá bằng BCrypt trong cơ sở dữ liệu | Must |
| FR-AUTH-05 | Role USER là mặc định khi tài khoản mới được tạo | Must |
| FR-AUTH-06 | Admin có thể nâng/hạ quyền của người dùng khác | Must |

### FR-BP: Quản lý Best Practice

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-BP-01 | Người dùng tạo best practice với trạng thái DRAFT | Must |
| FR-BP-02 | Best practice hỗ trợ kết hợp nhiều loại (Multi-types): MCP, SKILL, RULE, WORKFLOW, HOOKS, PROMPT, TOOL | Must |
| FR-BP-03 | Thông tin best practice gồm: tiêu đề, mô tả, danh sách loại, hướng dẫn sử dụng, hướng dẫn cài đặt, tags (role-based), liên kết ngoài | Must |
| FR-BP-04 | Người dùng upload nhiều file đính kèm cho một best practice | Must |
| FR-BP-05 | Đăng ký bài viết trên một trang duy nhất (Single-page submission form) | Must |
| FR-BP-06 | Người dùng submit bài viết để chờ duyệt (DRAFT → PENDING_REVIEW) | Must |
| FR-BP-07 | Người dùng chỉnh sửa bài viết của mình khi đang ở trạng thái DRAFT hoặc REJECTED | Must |
| FR-BP-08 | Người dùng xoá bài viết của mình khi đang ở trạng thái DRAFT | Must |

### FR-BROWSE: Tìm kiếm & Khám phá

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-BROWSE-01 | Chỉ bài viết có trạng thái PUBLISHED mới hiển thị trên trang browse | Must |
| FR-BROWSE-02 | Bộ lọc chính trên trang chủ dựa trên Vai trò (Role-based Tags): Backend, Frontend, DevOps, BA, PM, Mobile | Must |
| FR-BROWSE-03 | Người dùng tìm kiếm theo từ khoá (tiêu đề, mô tả, tags) | Must |
| FR-BROWSE-04 | Người dùng sắp xếp kết quả theo: mới nhất, phổ biến nhất (usage_score) | Must |
| FR-BROWSE-05 | Trang chủ hiển thị section "Trending" — top 10 bài viết theo usage_score | Must |
| FR-BROWSE-06 | Người dùng xem chi tiết bài viết: mô tả đầy đủ, các loại hình (types), files, links, usage guide, install guide | Must |
| FR-BROWSE-07 | Người dùng download file đính kèm (yêu cầu đăng nhập) | Must |

### FR-APPROVAL: Quy trình kiểm duyệt & Quản trị

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-APPROVAL-01 | Admin xem danh sách bài viết chờ duyệt (PENDING_REVIEW, UNDER_REVIEW) | Must |
| FR-APPROVAL-02 | Admin phê duyệt hoặc từ chối bài viết kèm comment lý do | Must |
| FR-APPROVAL-03 | Admin Dashboard hiển thị các chỉ số thống kê (Key Metrics): Users, Published items, Views, Downloads | Must |
| FR-APPROVAL-04 | Thống kê trực quan phân bổ bài viết theo Vai trò (Distribution by Role) và Loại hình (Distribution by Type) | Must |

### FR-RANKING: Xếp hạng

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-RANKING-01 | Hệ thống ghi log mỗi lần người dùng VIEW, DOWNLOAD, hoặc WORKFLOW_USED | Must |
| FR-RANKING-02 | usage_score được tính theo công thức: `(download × 3) + (workflow_used × 5) + (view × 0.5)` với time decay theo tuần | Must |
| FR-RANKING-03 | Kết quả trending được cache vào Redis, TTL 1 giờ | Must |

---

## 4. Non-Functional Requirements

### NFR-SEC: Bảo mật

| ID | Yêu cầu |
|----|---------|
| NFR-SEC-01 | Tất cả API endpoint yêu cầu xác thực JWT (trừ `/auth/login` và public browse) |
| NFR-SEC-02 | File download dùng pre-signed URL với TTL 15 phút |
| NFR-SEC-03 | Input validation: max length, allowed types, sanitize |

### NFR-PERF: Hiệu năng

| ID | Yêu cầu |
|----|---------|
| NFR-PERF-01 | Trending API dùng Redis cache — TTL 1 giờ |
| NFR-PERF-02 | File upload tối đa 50MB mỗi file |

### NFR-UX: Trải nghiệm người dùng

| ID | Yêu cầu |
|----|---------|
| NFR-UX-01 | Giao diện Light Theme hiện đại, sáng sủa, tinh tế |
| NFR-UX-02 | Hệ thống Badge phân biệt rõ ràng Types (Bản chất kỹ thuật) và Roles (Phạm vi công việc) |
| NFR-UX-03 | Single-page form giúp tối ưu tốc độ đăng bài |

---
