# ⚡ AXon — AI Best Practice Hub

AXon là nền tảng nội bộ tập trung giúp chia sẻ, chuẩn hoá và xếp hạng các **AI Best Practices** (Skills, MCP configs, Rule sets, Agent workflows). Hệ thống giúp đội ngũ kỹ thuật tối ưu hoá việc sử dụng AI thông qua các tri thức đã được cộng đồng kiểm duyệt.

---

## 🚀 Tính năng chính

- **Discovery:** Tìm kiếm, lọc và khám phá các Best Practice theo loại và thẻ (tags).
- **Trending System:** Hệ thống xếp hạng tự động dựa trên mức độ tương tác (view, download, use) với thuật toán suy giảm theo thời gian (Time Decay).
- **Submission Workflow:** Quy trình đóng góp 4 bước chuyên nghiệp, hỗ trợ đính kèm nhiều định dạng tệp.
- **Admin Governance:** Bảng điều khiển dành cho Admin để tiếp duyệt hoặc từ chối các bài đăng kèm phản hồi.
- **Agent Builder Integration:** Tích hợp trực tiếp với các workflow AI từ hệ thống Agent Builder.
- **Secure Storage:** Lưu trữ tệp tin an toàn qua MinIO với cơ chế Pre-signed URL.

---

## 🛠 Công nghệ sử dụng

### Backend
- **Java 21** & **Spring Boot 3.5**
- **Spring Security** với **JWT** & **Mock SSO**
- **Spring Data JPA** & **Flyway** (Migration)
- **Redis** (Caching trending data)

### Frontend
- **React 18** & **TypeScript**
- **Vite** (Build tool)
- **TailwindCSS** (Light Theme UI)
- **Zustand** (State Management)
- **TanStack Query** (Server State)

### Infrastructure
- **PostgreSQL 16** (Database)
- **Redis 7** (Cache)
- **MinIO** (Object Storage)
- **Docker Compose** (Dev environment)

---

## 🏁 Hướng dẫn cài đặt & Chạy dự án

### 1. Yêu cầu hệ thống
- Đã cài đặt **Docker** & **Docker Compose**.
- Đã cài đặt **Java 21** (để chạy Backend local).
- Đã cài đặt **Node.js 18+** (để chạy Frontend local).

### 2. Khởi động Cơ sở hạ tầng
Chạy lệnh sau tại thư mục gốc để khởi động DB, Redis và MinIO:
```bash
docker compose up -d
```

### 3. Chạy Backend
Mở một terminal mới, di chuyển vào thư mục `axon-backend` và chạy:
```bash
cd axon-backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
*Backend sẽ chạy tại: http://localhost:8080*

### 4. Chạy Frontend
Mở một terminal khác, di chuyển vào thư mục `axon-frontend` và chạy:
```bash
cd axon-frontend
npm install
npm run dev
```
*Frontend sẽ chạy tại: http://localhost:5173*

---

## 🔐 Thông tin đăng nhập (Môi trường Dev)

Hệ thống sử dụng **Mock SSO**, bạn không cần nhập mật khẩu:
1. Truy cập [http://localhost:5173](http://localhost:5173).
2. Nhấn nút **"Sign in"** ở góc trên bên phải.
3. Tài khoản mặc định: **Dev Admin** (`dev@company.com`).
4. Bạn sẽ có toàn quyền **Admin** để truy cập Admin Dashboard.

---

## 📁 Cấu trúc thư mục
- `axon-backend/`: Mã nguồn Spring Boot.
- `axon-frontend/`: Mã nguồn React SPA.
- `docker-compose.yml`: Cấu hình các dịch vụ hạ tầng.
- `docs/`: Tài liệu thiết kế chi tiết (HLD, DLD, UI/UX).

---
*Phát triển bởi Gemini CLI — 2026*
