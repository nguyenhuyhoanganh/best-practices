# AXon Best Practice Platform

Internal Samsung platform for sharing and discovering AI best practices.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.5, Java 21, Spring Security 6, Spring Data JPA |
| Database | PostgreSQL 16 (Flyway migrations V1–V10) |
| Cache | Redis 7 (dashboard stats, 15-min TTL) |
| Auth | Samsung SSO (OAuth2 mock in dev), JWT access token (in-memory), refresh token (HttpOnly cookie) |
| File storage | Docker volume — `/app/uploads/{bpId}/{uuid}_{filename}` |
| Frontend | React 19, TypeScript, Vite 8, TailwindCSS 3, Zustand, TanStack Query 5 |
| API docs | Swagger UI via springdoc-openapi 2.8 |

---

## Prerequisites

- **Docker** ≥ 24 and **Docker Compose** ≥ 2.20
- (Dev only) Java 21, Maven 3.9, Node 20

---

## Quick Start — Docker (recommended)

```bash
# Clone repo
git clone <repo-url>
cd best-practices

# Build and start all services
docker compose up --build
```

Services started:

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| API docs JSON | http://localhost:8080/api-docs |
| PostgreSQL | localhost:5432 (db: `axon`, user: `axon`, pw: `axon_dev`) |
| Redis | localhost:6379 |

### Login (dev mode)

Click **"Login with Samsung Account"** → the dev mock bypasses Samsung CIP and auto-creates/logs in a test user. The first user to submit a best practice is automatically promoted to `AX_CREATOR`.

To manually promote a user to `ADMIN` or `AX_SUPPORTER`, use the database directly (see below) or the Admin → User Management page once an ADMIN exists.

---

## Docker Environment Variables

Override any variable via `docker-compose.yml` or a `.env` file in the project root.

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `postgres` | PostgreSQL hostname |
| `DB_USER` | `axon` | DB username |
| `DB_PASSWORD` | `axon_dev` | DB password |
| `REDIS_HOST` | `redis` | Redis hostname |
| `STORAGE_BASE_PATH` | `/app/uploads` | File upload root |
| `JWT_SECRET` | *(dev key)* | Min 256-bit secret — **change in production** |
| `SPRING_PROFILES_ACTIVE` | `dev` | Spring profile |

---

## Development — Run Without Docker

### Backend

**Requirements:** Java 21, Maven 3.9, PostgreSQL 16, Redis 7 running locally.

```bash
cd axon-backend

# Start PostgreSQL and Redis first (or use Docker for just infra)
docker compose up -d postgres redis

# Run
./mvnw spring-boot:run
# or
mvn spring-boot:run
```

Backend starts at `http://localhost:8080`.

Flyway runs migrations automatically on startup. Seed data (V10) populates Jobs, Work Categories, Works, and AI Capabilities.

### Frontend

**Requirements:** Node 20+.

```bash
cd axon-frontend

npm install
npm run dev
```

Frontend starts at `http://localhost:5173`. Vite proxies `/api/*` and `/auth/*` to `http://localhost:8080`.

---

## Build — Production Artifacts

### Backend JAR

```bash
cd axon-backend
mvn package -DskipTests
# Output: target/axon-backend-*.jar
java -jar target/axon-backend-*.jar
```

### Frontend Static Build

```bash
cd axon-frontend
npm run build
# Output: dist/ — serve with any static web server or nginx
```

---

## Project Structure

```
best-practices/
├── axon-backend/
│   ├── src/main/java/com/axon/
│   │   ├── auth/           # JWT auth, Samsung SSO callback
│   │   ├── bestpractice/   # BP CRUD, state machine, file upload
│   │   ├── management/     # Review queue (approve/reject/close)
│   │   ├── dashboard/      # Platform stats (Redis cached)
│   │   ├── analytics/      # Per-BP analytics
│   │   ├── interaction/    # Likes, feedback, downloads
│   │   ├── aiinsight/      # AI classification taxonomy
│   │   ├── lookup/         # Public reference data
│   │   ├── masterdata/     # Admin CRUD for reference data
│   │   ├── user/           # User management
│   │   ├── file/           # File storage service
│   │   └── config/         # Security, cache, async, OpenAPI
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/   # Flyway V1–V10
├── axon-frontend/
│   ├── src/
│   │   ├── api/            # Axios client + API modules
│   │   ├── components/     # Layout (sidebar + header)
│   │   ├── pages/          # All page components
│   │   ├── store/          # Zustand auth store
│   │   └── types/          # TypeScript types
│   ├── nginx.conf          # Production nginx config
│   └── Dockerfile          # Multi-stage: node build → nginx serve
├── docker-compose.yml
└── README.md
```

---

## User Roles

| Role | Access |
|---|---|
| `USER` | Browse library, view/like/download published BPs, leave feedback |
| `AX_CREATOR` | All USER + create/edit own BPs, see `key_value` field. Auto-assigned on first BP submission |
| `AX_SUPPORTER` | All AX_CREATOR + management queue, dashboard |
| `ADMIN` | Full access including master data and user role management |

> **AX_CREATOR cannot be manually assigned** — it is granted automatically when a user submits their first best practice.

---

## API Overview

Full interactive docs available at `/swagger-ui.html`.

| Group | Base path |
|---|---|
| Authentication | `/auth/**` |
| Best Practices (public) | `GET /api/v1/best-practices` |
| Best Practices (auth) | `/api/v1/best-practices/**` |
| My BPs | `/api/v1/my-best-practices` |
| Management | `/api/v1/management/**` |
| Dashboard | `/api/v1/dashboard` |
| AI Insight | `/api/v1/ai-insight` |
| Lookup (public) | `/api/v1/jobs`, `/api/v1/works`, ... |
| Admin — Master Data | `/api/v1/admin/master-data/**` |
| Admin — Users | `/api/v1/admin/users` |

### Authentication Flow

```
1. GET  /auth/login          → redirect to Samsung SSO (dev: mock redirect)
2. GET  /auth/callback?code= → returns { access_token, user }
                               sets HttpOnly cookie: refresh_token (7 days)
3. POST /auth/refresh        → returns { access_token } (uses cookie, no body needed)
4. POST /auth/logout         → clears refresh_token cookie
```

Use `Authorization: Bearer <access_token>` on all authenticated endpoints.

---

## Database Admin (quick)

```bash
# Connect to running Postgres container
docker compose exec postgres psql -U axon -d axon

# Promote a user to ADMIN
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';

# View all users and roles
SELECT name, email, role FROM users ORDER BY created_at;
```

---

## Useful Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f axon-backend
docker compose logs -f axon-frontend

# Rebuild a single service after code change
docker compose up -d --build axon-backend
docker compose up -d --build axon-frontend

# Stop and remove containers (keeps volumes/data)
docker compose down

# Full reset — remove volumes and data
docker compose down -v
```

---

## Known Limitations

- Samsung CIP/AD SSO integration is mocked in dev profile. Production requires real OAuth2 client credentials (P11).
- File storage uses a local Docker volume — not suitable for multi-node deployment without shared storage.
- Email notifications are wired but require an SMTP server (`SMTP_HOST`, `SMTP_PORT` env vars).
