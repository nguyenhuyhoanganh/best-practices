# AXon — Requirements Document

**Version:** 2.0  
**Date:** 2026-05-11  
**Status:** Draft

---

## 1. Tổng quan hệ thống

AXon là nền tảng web nội bộ cho phép nhân viên công ty đăng ký, chia sẻ và khám phá các AI best practice trong lĩnh vực phát triển phần mềm. Hệ thống có quy trình kiểm duyệt bởi AX Supporter trước khi công khai, cơ chế thu thập feedback từ người dùng và dashboard monitoring để theo dõi mức độ adoption.

---

## 2. Stakeholders

| Vai trò | Mô tả |
|---------|-------|
| **User** | Nhân viên tìm kiếm, xem, tải và sử dụng best practice; để lại feedback |
| **AX Creator** | Nhân viên đăng ký, chỉnh sửa, quản lý best practice của mình; xem analytics và feedback |
| **AX Supporter** | Kiểm duyệt và phê duyệt best practice; quản lý trạng thái BP; xem dashboard monitoring |
| **Admin** | Quản lý người dùng và phân quyền |
| **CIP/AD** | Hệ thống xác thực nội bộ Samsung (external system) |

---

## 3. Business Process

```
[AX Creator] Đăng ký BP → Submit
  └─► [AX Supporter] Review
        ├─ Reject (kèm comment) ──► [AX Creator] Chỉnh sửa → Resubmit ──► (lặp lại)
        └─ Approve ──► PUBLISHED
              │
              ├─► [User] Xem, tải, sử dụng → Để lại feedback
              │         │
              │         └─► [AX Creator] Xem feedback + analytics để cải thiện BP
              │
              ├─► Usage data (view, download, like) ──► [AX Supporter] Monitor dashboard
              │
              └─► [AX Supporter] Close BP (kèm lý do) ──► CLOSED
              └─► [AX Creator] Edit BP ──► REQUESTED (BP ẩn, chờ review lại)
```

---

## 4. Functional Requirements

### FR-AUTH: Xác thực & Phân quyền

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-AUTH-01 | Người dùng đăng nhập qua CIP/AD của Samsung | Must |
| FR-AUTH-02 | Không có tài khoản local — CIP/AD là bắt buộc | Must |
| FR-AUTH-03 | Role mặc định là USER khi tài khoản mới được tạo | Must |
| FR-AUTH-04 | Admin có thể nâng/hạ quyền người dùng (USER → AX_CREATOR → AX_SUPPORTER → ADMIN) | Must |
| FR-AUTH-05 | Người dùng có thể đăng xuất | Must |

---

### FR-LIBRARY: Thư viện Best Practice

#### Epic: Library — View List BP (Card)

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-01 | Hiển thị danh sách BP đã PUBLISHED dạng card gồm: name, description, thumbnail, job, work, creator (tên người đầu tiên + "+N others" nếu có nhiều) | Must |
| FR-LIB-02 | Tất cả role (User, AX Supporter, Admin) đều có thể xem danh sách | Must |

#### Epic: Library — Register BP

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-03 | AX Creator đăng ký BP với các trường: name, description, installation guide, work (search/select từ danh sách), AI capability (search/select từ danh sách), AI tool (search/select từ danh sách), best practice type (WEB / TOOL / EXTENSION), key, creator(s) (search CIP theo danh sách) | Must |
| FR-LIB-04 | BP type WEB: nhập nội dung text tối đa 256 ký tự (URL hoặc cấu hình dạng text) | Must |
| FR-LIB-05 | BP type TOOL hoặc EXTENSION: cho phép upload file tối đa 50MB | Must |
| FR-LIB-06 | Một BP có thể có nhiều creator — tìm kiếm và chọn theo CIP | Must |
| FR-LIB-07 | Submit BP → status chuyển sang REQUESTED | Must |
| FR-LIB-08 | AX Creator xem danh sách BP của mình (My BPs) với đầy đủ trạng thái | Must |

#### Epic: Library — View Detail

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-09 | Xem chi tiết BP: hiển thị đầy đủ thông tin, trường "key" bị ẩn với User thông thường | Must |
| FR-LIB-10 | Chi tiết BP hiển thị: view count, like count, download count | Must |
| FR-LIB-11 | User, AX Supporter, Admin đều xem được detail | Must |
| FR-LIB-12 | Trường "key" hiển thị với AX Creator (là owner của BP), AX Supporter và Admin | Must |

#### Epic: Library — Like

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-13 | User có thể like BP từ trang detail (toggle like/unlike) | Must |
| FR-LIB-14 | Mỗi user chỉ like được 1 lần mỗi BP; like count cập nhật realtime | Must |

#### Epic: Library — Sort & Filter

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-15 | Filter theo: job, AI capability, work category, work, department, best practice type, AI tool | Must |
| FR-LIB-16 | Sort theo: job, work category, work | Must |
| FR-LIB-17 | Tìm kiếm full-text theo name và description | Must |
| FR-LIB-18 | Tất cả role đều có thể sử dụng filter, sort và search | Must |

#### Epic: Library — Edit BP (AX Creator)

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-19 | AX Creator chỉnh sửa BP khi status là REQUESTED hoặc REJECTED | Must |
| FR-LIB-20 | AX Creator chỉnh sửa BP đang PUBLISHED: nút Edit ẩn đi khi chưa thao tác; khi submit lại → BP chuyển sang REQUESTED và bị ẩn khỏi library, chờ review lại | Must |
| FR-LIB-21 | BP ở trạng thái CLOSED không thể chỉnh sửa | Must |

#### Epic: Library — Delete BP (AX Creator)

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-22 | AX Creator xoá BP khi status là REQUESTED hoặc REJECTED | Must |
| FR-LIB-23 | BP ở trạng thái PUBLISHED hoặc CLOSED không thể xoá | Must |

#### Epic: Library — My BPs Management (AX Creator)

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LIB-24 | AX Creator xem danh sách BP của mình với: search theo name, xem detail, edit, delete theo từng trạng thái | Must |
| FR-LIB-25 | AX Creator xem analytics BP của mình: view count, download count, like count, feedback | Should |

---

### FR-MANAGEMENT: Quản lý Best Practice (AX Supporter)

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-MGT-01 | AX Supporter xem danh sách toàn bộ BP (management list) với filter theo status | Must |
| FR-MGT-02 | AX Supporter review BP: xem đầy đủ chi tiết bao gồm trường "key" | Must |
| FR-MGT-03 | AX Supporter approve BP → status chuyển PUBLISHED, AX Creator nhận thông báo | Must |
| FR-MGT-04 | AX Supporter reject BP kèm comment bắt buộc → status chuyển REJECTED, AX Creator nhận thông báo | Must |
| FR-MGT-05 | AX Supporter không thể tự approve BP mà mình là creator | Must |
| FR-MGT-06 | AX Supporter close BP đang PUBLISHED: nhập lý do bắt buộc → status chuyển CLOSED, BP ẩn khỏi library | Must |
| FR-MGT-07 | AX Supporter xem lịch sử review của một BP | Should |

---

### FR-FEEDBACK: Feedback

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-FB-01 | User để lại feedback (text) trên BP đã PUBLISHED | Must |
| FR-FB-02 | AX Creator xem danh sách feedback của BP mình | Must |
| FR-FB-03 | AX Supporter xem feedback của tất cả BP | Should |

---

### FR-DASHBOARD: Dashboard Monitoring

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-DASH-01 | Dashboard hiển thị tổng số người đã submit BP | Must |
| FR-DASH-02 | Dashboard hiển thị tổng số BP theo từng trạng thái (REQUESTED, PUBLISHED, REJECTED, CLOSED) | Must |
| FR-DASH-03 | Dashboard hiển thị số lượng job, số lượng AI capability, số lượng department trong hệ thống | Must |
| FR-DASH-04 | Dashboard hiển thị Top 5 Creator (theo số BP đã published) | Must |
| FR-DASH-05 | Dashboard hiển thị Top 5 Work (theo số BP liên quan) | Must |
| FR-DASH-06 | AX Supporter xem full dashboard | Must |

---

### FR-LOOKUP: Quản lý danh mục (Admin)

Các danh mục lookup gồm: **Job**, **AI Capability**, **Work Category**, **Work**, **Department**, **AI Tool**.

| ID | Yêu cầu | Độ ưu tiên |
|----|---------|-----------|
| FR-LOOKUP-01 | Admin xem danh sách các mục trong từng danh mục | Must |
| FR-LOOKUP-02 | Admin thêm mục mới vào từng danh mục | Must |
| FR-LOOKUP-03 | Admin sửa tên/thông tin của mục trong danh mục | Must |
| FR-LOOKUP-04 | Admin xoá mục trong danh mục; hệ thống chặn xoá nếu còn BP đang tham chiếu | Must |
| FR-LOOKUP-05 | Admin điều chỉnh thứ tự hiển thị (display_order) của các mục trong danh mục | Should |
| FR-LOOKUP-06 | Work phải thuộc một Work Category; khi tạo Work phải chọn Work Category | Must |

---

## 5. BP Status Flow

```
[AX Creator submit] ──────────────────────────► REQUESTED
                                                    │
                          ┌─────────────────────────┤
                          │                         │
                     [AX Supporter]            [AX Supporter]
                       Reject                    Approve
                          │                         │
                          ▼                         ▼
                       REJECTED                  PUBLISHED
                          │                    │         │
              [AX Creator edit              [AX Creator  [AX Supporter
               + resubmit]                   edit]        close]
                          │                    │               │
                          └───► REQUESTED ◄────┘          CLOSED
                                (BP ẩn khỏi library)
```

**Quy tắc chỉnh sửa theo trạng thái:**

| Status | AX Creator có thể | AX Supporter có thể |
|--------|------------------|---------------------|
| REQUESTED | Edit, Delete | Approve, Reject |
| REJECTED | Edit, Delete, Resubmit | — |
| PUBLISHED | Edit (→ REQUESTED, BP ẩn) | Close |
| CLOSED | — | — |

---

## 6. Non-Functional Requirements

### NFR-SEC: Bảo mật

| ID | Yêu cầu |
|----|---------|
| NFR-SEC-01 | Tất cả API endpoint yêu cầu xác thực (trừ public browse) |
| NFR-SEC-02 | Trường "key" trong BP chỉ hiển thị với owner (AX Creator), AX Supporter và Admin |
| NFR-SEC-03 | File download dùng pre-signed URL với TTL 15 phút — không expose storage key |
| NFR-SEC-04 | Input validation trên tất cả API: max length, allowed types, sanitize |
| NFR-SEC-05 | Rate limiting: 100 req/phút/user cho API thông thường, 10 req/phút cho upload |

### NFR-PERF: Hiệu năng

| ID | Yêu cầu |
|----|---------|
| NFR-PERF-01 | Browse API trả về trong < 500ms ở P95 |
| NFR-PERF-02 | File upload tối đa 50MB/file (type TOOL và EXTENSION) |
| NFR-PERF-03 | Text content tối đa 256 ký tự (type WEB) |
| NFR-PERF-04 | Database index trên: status, type, work_id, like_count, view_count, download_count |

### NFR-UX: Trải nghiệm người dùng

| ID | Yêu cầu |
|----|---------|
| NFR-UX-01 | Giao diện responsive — desktop (1280px+) và tablet (768px+) |
| NFR-UX-02 | Loading state hiển thị khi fetch data |
| NFR-UX-03 | Error message rõ ràng khi thao tác thất bại |
| NFR-UX-04 | Form đăng ký có auto-save draft để tránh mất dữ liệu |

### NFR-OPS: Vận hành

| ID | Yêu cầu |
|----|---------|
| NFR-OPS-01 | Môi trường dev chạy hoàn toàn qua Docker Compose |
| NFR-OPS-02 | Health check endpoint: `GET /actuator/health` |
| NFR-OPS-03 | Structured logging (JSON format) để tích hợp với log aggregator |
| NFR-OPS-04 | Database migration tự động qua Flyway khi startup |

---

## 7. User Stories

### User (Consumer)

```
US-U-01: Là developer, tôi muốn tìm kiếm và filter BP theo job và AI capability
         để tìm nhanh tool phù hợp với công việc của mình.

US-U-02: Là user, tôi muốn xem chi tiết BP bao gồm installation guide
         để cài đặt và sử dụng ngay mà không cần tự nghiên cứu.

US-U-03: Là user, tôi muốn like các BP tôi thấy hữu ích
         để đóng góp vào chất lượng xếp hạng cộng đồng.

US-U-04: Là user, tôi muốn để lại feedback cho BP
         để giúp creator cải thiện nội dung.
```

### AX Creator

```
US-C-01: Là AX Creator, tôi muốn đăng ký best practice kèm file hoặc link
         để chia sẻ kiến thức với đồng nghiệp.

US-C-02: Là AX Creator, tôi muốn biết trạng thái review và nhận thông báo
         khi BP được approve hoặc reject.

US-C-03: Là AX Creator, tôi muốn chỉnh sửa BP bị reject dựa trên comment của AX Supporter
         rồi submit lại.

US-C-04: Là AX Creator, tôi muốn xem analytics (view, download, like, feedback) của BP mình
         để hiểu mức độ hữu ích và cải thiện chất lượng.
```

### AX Supporter

```
US-S-01: Là AX Supporter, tôi muốn xem danh sách BP đang chờ review
         để xử lý theo thứ tự ưu tiên.

US-S-02: Là AX Supporter, tôi muốn review đầy đủ nội dung BP (kể cả key)
         trước khi quyết định approve hoặc reject.

US-S-03: Là AX Supporter, tôi muốn close BP với lý do cụ thể
         khi BP không còn phù hợp để dùng nữa.

US-S-04: Là AX Supporter, tôi muốn xem dashboard monitoring
         để nắm bắt tình trạng hệ thống và mức độ adoption của team.
```

### Admin

```
US-A-01: Là Admin, tôi muốn quản lý danh sách user và phân quyền
         để kiểm soát ai có thể tạo, review hay quản lý hệ thống.
```

---

## 8. Acceptance Criteria

### AC-01: Đăng ký BP thành công
- Given: User đã đăng nhập với role AX Creator
- When: Điền đầy đủ thông tin bắt buộc và nhấn Submit
- Then: BP tạo với status REQUESTED, xuất hiện trong "My BPs", AX Supporter nhận thông báo

### AC-02: AX Supporter approve
- Given: BP đang REQUESTED
- When: AX Supporter nhấn Approve
- Then: Status chuyển PUBLISHED, AX Creator nhận thông báo, BP xuất hiện trên library

### AC-03: AX Supporter reject
- Given: BP đang REQUESTED
- When: AX Supporter nhấn Reject kèm comment
- Then: Status chuyển REJECTED, AX Creator nhận thông báo với lý do; creator có thể edit và resubmit

### AC-04: AX Creator edit Published BP
- Given: BP đang PUBLISHED
- When: AX Creator chỉnh sửa và submit lại
- Then: Status chuyển REQUESTED, BP bị ẩn khỏi library, chờ AX Supporter review lại

### AC-05: Like BP
- Given: User đang xem detail BP đã PUBLISHED
- When: User nhấn Like
- Then: Like count tăng 1, button chuyển trạng thái "liked"; nhấn lại thì unlike

### AC-06: Close BP
- Given: BP đang PUBLISHED
- When: AX Supporter nhấn Close và nhập lý do
- Then: Status chuyển CLOSED, BP bị ẩn khỏi library, lý do được lưu

### AC-07: Self-approve restriction
- Given: AX Supporter là creator của một BP đang REQUESTED
- When: AX Supporter cố gắng approve BP đó
- Then: Hệ thống hiển thị lỗi "Bạn không thể tự approve BP của mình"

---

## 9. Constraints & Assumptions

- Login qua CIP/AD của Samsung — dev dùng mock CIP
- BP type WEB: không có file upload, chỉ text tối đa 256 ký tự (URL hoặc config text)
- BP type TOOL và EXTENSION: upload file tối đa 50MB
- Trường "key" là thông tin nhạy cảm, ẩn với User thông thường
- Một BP có thể có nhiều creator (tìm kiếm theo CIP)
- Không có versioning cho BP — edit published BP = tạo version mới qua review
- Notification trong phase đầu chỉ là email
- Các danh sách lookup (job, AI capability, work, work category, department, AI tool) do Admin quản lý
