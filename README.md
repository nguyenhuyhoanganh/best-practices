# ⚡ AXon — AI Best Practice Hub

AXon là nền tảng nội bộ tập trung giúp chia sẻ, chuẩn hoá và xếp hạng các **AI Best Practices**. Hệ thống giúp đội ngũ kỹ thuật tối ưu hoá việc sử dụng AI thông qua các tri thức đã được cộng đồng kiểm duyệt.

---

## 🚀 Tính năng chính

- **Discovery:** Tìm kiếm, lọc và khám phá các Best Practice dựa trên hệ thống phân loại đa chiều.
- **Flexible Categorization:** Hỗ trợ kết hợp nhiều loại tri thức trên cùng một nội dung.
- **Trending System:** Xếp hạng tự động dựa trên mức độ tương tác (view, download, use) với thuật toán suy giảm theo thời gian (Time Decay).
- **Submission Workflow:** Quy trình đóng góp 4 bước chuyên nghiệp, hỗ trợ đính kèm tệp tin và liên kết ngoài.
- **Admin Governance:** Bảng điều khiển quản trị để kiểm duyệt nội dung và quản lý chất lượng cộng đồng.
- **Agent Builder Integration:** Tích hợp trực tiếp với các workflow AI từ hệ thống Agent Builder.

---

## 🏷️ Hệ thống phân loại (Categorization)

Hệ thống sử dụng mô hình phân loại kép để tối ưu hoá khả năng tìm kiếm:

### 1. Types (Loại tri thức)
Định nghĩa bản chất của nội dung. Một Best Practice có thể **kết hợp nhiều loại**:
- `MCP`: Model Context Protocol configs.
- `SKILL`: Các bộ skill định nghĩa cho Agent.
- `HOOKS`: Các điểm móc nối logic (Event hooks, API hooks).
- `RULE`: Bộ quy tắc ứng xử, tiêu chuẩn coding.
- `WORKFLOW`: Quy trình thực thi tự động.
- `PROMPT`: Các kỹ thuật prompt engineering mẫu.
- `TOOL`: Các công cụ hỗ trợ AI.

### 2. Tags (Phạm vi công việc)
Định nghĩa đối tượng sử dụng hoặc môi trường áp dụng (Role-based):
- `backend`, `frontend`, `devops`, `mobile`.
- `ba` (Business Analyst), `pm` (Project Manager), `qa` (Quality Assurance).
- `security`, `performance`, `data-science`.

---

## 🛠 Công nghệ sử dụng

### Backend
- **Java 21** & **Spring Boot 3.5**
- **Spring Security** (JWT & Mock SSO)
- **Spring Data JPA** & **Flyway** (Migration)
- **Redis 7** (Caching & Ranking storage)

### Frontend
- **React 18** & **TypeScript**
- **TailwindCSS** (Light Theme / Modern Aesthetic)
- **Zustand** (State Management)
- **TanStack Query** (Server State)

### Infrastructure
- **PostgreSQL 16**, **Redis 7**, **MinIO** (Object Storage)
- **Docker Compose**

---

## 🏁 Hướng dẫn cài đặt & Chạy dự án

### 1. Khởi động Hạ tầng (Docker)
```bash
docker compose up -d
```

### 2. Chạy Backend
```bash
cd axon-backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
*Chạy tại: http://localhost:8080*

### 3. Chạy Frontend
```bash
cd axon-frontend
npm install && npm run dev
```
*Chạy tại: http://localhost:5173*

---

## 🔐 Đăng nhập (Môi trường Dev)

Hệ thống dùng **Mock SSO**, nhấn **"Sign in"** để vào thẳng với quyền **Admin**:
- Account: `dev@company.com` (Dev Admin)

---
*Phát triển bởi Gemini CLI — 2026*
