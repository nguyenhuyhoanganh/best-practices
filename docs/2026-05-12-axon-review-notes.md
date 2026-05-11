# AXon — Review Notes (chuẩn bị review hôm sau)

**Ngày tạo:** 2026-05-12
**Author:** review docs + viết lại implementation plan v2.0
**Phạm vi:** đối chiếu spec do người dùng cung cấp với các docs `2026-05-10-axon-*.md`

---

## 1. Đã sửa trong batch này

| # | File | Lỗi | Sửa |
|---|------|-----|-----|
| 1 | `2026-05-10-axon-requirements.md` | FR-LIB-11 thiếu role AX Creator khi liệt kê quyền xem detail | Thêm `AX Creator` vào danh sách |
| 2 | `2026-05-10-axon-hld.md` §3.3 | "Lookup tables (5)" nhưng liệt kê 6 bảng | Sửa thành `(6)` |
| 3 | `2026-05-10-axon-dld.md` §3.3 | Comment leftover `"wait, status stays DRAFT until submit"` mâu thuẫn với FR-LIB-07 (submit-on-create) | Bỏ comment thừa, làm rõ submit-on-create |
| 4 | `2026-05-10-axon-implementation-plan.md` | File chỉ còn dòng DEPRECATED trỏ tới file không tồn tại | Viết lại thành plan v2.0 chi tiết (28 task, 10 phase, ~5600 dòng) |

---

## 2. Câu hỏi mở — CẦN QUYẾT ĐỊNH trước khi execute plan

### 2.1. Ai quản lý lookup taxonomy?

- **Spec người dùng nói:** "AX supportor để publish, **suspend, config** quản lý các BP"
- **Docs hiện tại gán:** Admin (FR-LOOKUP-01..06)
- **Câu hỏi:** "config" trong spec là `config BP` hay `config taxonomy/lookup`? Nếu là lookup → có muốn chuyển từ Admin sang AX Supporter không?
- **Default trong plan:** Admin (giữ theo docs)
- **Tác động nếu đổi:** sửa `@PreAuthorize("hasRole('ADMIN')")` → `hasAnyRole('AX_SUPPORTER','ADMIN')` trong Task 6 (BE) và Task 27 (FE nav)

### 2.2. Suspend ≠ Close hay là một?

- **Spec người dùng nói:** "publish, suspend, config"
- **Docs hiện tại:** chỉ có `CLOSED` (không reopen được), không có suspend
- **Câu hỏi:** suspend = tạm dừng (có thể bật lại) hay đồng nghĩa với close?
- **Default trong plan:** suspend = close (1 trạng thái CLOSED, không reopen)
- **Tác động nếu cần thêm SUSPENDED riêng:**
  - Thêm enum value `SUSPENDED` vào `bp_status`
  - State machine: `PUBLISHED ↔ SUSPENDED` (Supporter toggle) + giữ `→ CLOSED` riêng
  - Migration mới + sửa FR-MGT, state machine, controller, FE badges
  - **Đây là thay đổi không nhỏ** — cần quyết sớm

### 2.3. Event tracking — counter + interaction tables có đủ không?

- **Spec người dùng nói:** "có event tracking best practice"
- **Docs hiện tại:** track qua `view_count` / `like_count` / `download_count` + bảng `bp_likes` / `bp_downloads` / `bp_feedback` (per-row interaction logs)
- **Câu hỏi:** có cần thêm unified `events` table cho audit trail tổng quát (kèm action type, payload, IP, etc.) hay vậy là đủ?
- **Default trong plan:** counters + 3 interaction tables là đủ
- **Tác động nếu cần unified event log:**
  - Thêm migration `V11__create_events.sql`
  - Refactor `InteractionService` ghi cả `events` thay vì 3 bảng riêng
  - Hoặc giữ cả 3 bảng + thêm `events` cho generic audit

### 2.4. AX Creator analytics — Must hay Should?

- **Spec người dùng nói:** "AX creator tổng hợp feedback, monitor để improve" → nghe quan trọng
- **Docs hiện tại:** FR-LIB-25 đang ở priority `Should`
- **Câu hỏi:** nâng lên `Must` không?
- **Default trong plan:** đã implement đầy đủ (Task 16 + Task 24) → coi như Must
- **Tác động:** không cần đổi plan; chỉ cập nhật priority trong requirements doc nếu muốn nhất quán

### 2.5. Status list trong spec người dùng chỉ có 3 (requested/published/closed) — bỏ REJECTED?

- **Docs hiện tại:** 4 trạng thái `REQUESTED / REJECTED / PUBLISHED / CLOSED`
- **Spec người dùng:** liệt kê 3, nhưng business flow có "reject → sửa → resubmit" — nên REJECTED là cần thiết
- **Default trong plan:** giữ 4 trạng thái
- **Kết luận:** docs đúng, spec chỗ này chỉ là enumeration không đầy đủ

### 2.6. "workflow" trong spec FR-1 — typo của "work"?

- **Spec FR-1:** "name, description, thumbnail, job, **workflow**, creator"
- **Spec FR-5:** dùng "work" và "work category"
- **Kết luận:** assume typo, dùng `work` xuyên suốt
- **Action:** không cần làm gì, chỉ confirm khi review

---

## 3. Phần chưa được review

### 3.1. `docs/2026-05-10-axon-uiux.md` (51KB, ~835 dòng)

- **Trạng thái:** chưa đọc trong session này
- **Cần làm:** đọc + đối chiếu với requirements/DLD để bắt mismatch (route names, component props, flow assumptions...)
- **Ưu tiên:** Medium — không block plan execution nhưng nên rà trước khi build FE

### 3.2. `docs/2026-05-10-axon-design.md`

- **Trạng thái:** đã đọc, không phát hiện lỗi rõ ràng
- **Note:** trùng nội dung lớn với HLD/DLD/requirements — cân nhắc có nên hợp nhất hay giữ 4 docs?

---

## 4. Assumption/Default trong plan mới — cần xác nhận khi review

| # | Quyết định | Lý do | Phản đối thế nào sẽ ảnh hưởng |
|---|------------|-------|-------------------------------|
| A1 | JWT secret `dev-secret-key-…` hardcoded trong `application.yml` dev profile | dev convenience | Prod phải override qua env var (đã ghi rõ trong yml) |
| A2 | Refresh token TTL = 7 ngày, access = 15 phút | sane defaults | Có thể đổi qua config |
| A3 | File upload tối đa 50MB enforce ở `FileService` (không phải tại Spring multipart config) | đảm bảo error message rõ | Spring multipart default có thể reject sớm hơn — cần test |
| A4 | MinIO bucket cố định tên `axon-files`, key pattern `{bpId}/{fileId}/{filename}` | đơn giản | Sản xuất có thể cần versioning hoặc retention policy |
| A5 | Email notification dùng `JavaMailSender` + `@Async`, MailHog cho dev | đơn giản | Prod cần SMTP thật của Samsung — chỉ đổi env vars |
| A6 | Dashboard cache Redis TTL 15 phút | NFR docs nói 15m | Có thể đổi qua `@Cacheable` config |
| A7 | Browse `published_at DESC` mặc định khi không có sort param | newest first | Có thể đổi mặc định theo UX |
| A8 | Page size mặc định 20, max 50 | DLD §3.2 | Có thể tăng nếu UX cần |
| A9 | View count tăng atomic mỗi request GET /:id (chưa dedupe theo user) | đơn giản | Có thể dedup theo session/user nếu spam là issue |
| A10 | Auto upgrade USER → AX_CREATOR khi user lần đầu POST BP | giảm friction (USER vẫn được phép register theo FR-LIB-03) | Nếu Admin muốn kiểm soát role gắt — bỏ logic này, yêu cầu Admin promote thủ công |
| A11 | "Edit Published BP → REQUESTED + ẩn" thực thi ngầm ngay khi gọi `PUT /:id` (không cần submit lại) | Theo FR-LIB-20 wording "khi submit lại" — hơi mơ hồ; plan chọn fail-safe đổi status ngay | Nếu spec muốn "save thay đổi nhưng vẫn public cho tới khi creator nhấn submit" — cần thêm trạng thái draft hoặc "pending edit" |
| A12 | Self-approve check dựa trên `bp.creators` (multi-creator). Nếu reviewer là 1 trong nhiều creator → vẫn bị chặn | bảo toàn nguyên tắc | Có thể nới: "chỉ chặn nếu reviewer là creator duy nhất" — không khuyến nghị |
| A13 | Validation `creatorIds` phải chứa current user khi tạo mới | tránh tạo BP mà không có người chịu trách nhiệm | Nếu cho phép Admin tạo hộ user khác — nới rule |

---

## 5. Hạng mục có thể bổ sung sau (Should/Nice-to-have)

- [ ] **Soft delete cho BP** — hiện DELETE là hard delete; có thể cần soft delete để giữ audit
- [ ] **Versioning BP** — docs nói "Không có versioning cho BP" nhưng có thể cần cho enterprise
- [ ] **Notification trong app** (toast/bell) thay vì chỉ email
- [ ] **Bulk role assignment** cho Admin (hiện chỉ từng user một)
- [ ] **Export dashboard data** (CSV) cho báo cáo
- [ ] **i18n** — hiện hardcode tiếng Anh + tiếng Việt mixed; quyết định ngôn ngữ chính
- [ ] **Reviewer name** trong `ReviewItem` đang null (Task 14 DTO) — cần JOIN khi list history
- [ ] **WEB type validation** — chỉ check length 256; có thể cần URL format validation
- [ ] **Thumbnail upload** — hiện chỉ nhận URL string; có thể cần upload thumbnail riêng

---

## 6. Pre-execution Checklist

Trước khi bắt đầu code theo plan:
- [ ] Trả lời 6 câu hỏi mở ở Section 2
- [ ] Đọc + review `axon-uiux.md` (Section 3.1)
- [ ] Xác nhận 13 assumption ở Section 4
- [ ] Pick execution mode: `subagent-driven-development` (recommend) hay `executing-plans`
- [ ] Quyết định worktree isolation (có dùng `using-git-worktrees` không?)
- [ ] CI pipeline có sẵn chưa? Plan giả định GitHub Actions nhưng chưa viết workflow file

---

## 7. Action items tổng kết

1. **Người dùng review file này** + trả lời các câu hỏi ở Section 2
2. **Cập nhật docs requirements/DLD/HLD** nếu có thay đổi assumption (suspend, role lookup...)
3. **Re-run plan generation** nếu có thay đổi lớn (vd. thêm SUSPENDED status)
4. **Sau khi confirm:** bắt đầu execute Task 1 của plan
