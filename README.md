# OSLPay Merchant Portal

面向加密货币支付商户的综合性 B2B 门户平台，提供商户入驻、业务运营、API 文档（AI 友好）和开发者工具套件。

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS V4 + Radix UI |
| Backend | Java 25 + Spring Boot 3.5.7 + MyBatis-Plus + Spring Security |
| Database | MySQL |
| Cache | Redis |
| Config | Apollo |
| Scheduler | XXL-Job |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **Java** 25 (OpenJDK)
- **Maven** >= 3.9 (or use included `./mvnw` wrapper)
- **MySQL** 8.x (optional for Task-001, required from Task-002)
- **Redis** (optional for Task-001, required from Task-002)

## Project Structure

```
osl-pay-merchant-portal/
├── frontend/          # Next.js frontend
├── backend/           # Spring Boot backend
├── docs/
│   ├── prd/           # Product requirements documents
│   └── tasks/         # Development task tracking
├── CLAUDE.md          # Development conventions & constraints
└── README.md          # This file
```

## Getting Started

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### Backend

```bash
cd backend

# Build (uses Maven Wrapper, no global Maven needed)
./mvnw clean package

# Run tests
./mvnw test

# Start server (http://localhost:8080)
./mvnw spring-boot:run

# Or run the JAR directly
java -jar target/portal-0.1.0-SNAPSHOT.jar
```

### Verify Both Services

```bash
# Frontend: open browser
open http://localhost:3000

# Backend: health check
curl http://localhost:8080/api/v1/health
# → {"code":0,"message":"success","data":"OSLPay Merchant Portal Backend is running"}

# Swagger UI (API docs)
open http://localhost:8080/swagger-ui.html
```

## API Conventions

- Base path: `/api/v1/`
- Unified response format:
  ```json
  { "code": 0, "message": "success", "data": { ... } }
  ```
- Error codes: `400xx` (param), `401xx` (auth), `403xx` (permission), `404xx` (not found), `500xx` (server)
- Auth: `Authorization: Bearer {jwt}` (from Task-002)
- Environment: `X-Environment: production | sandbox`

## Development Workflow

This project follows a strict iterative workflow defined in `CLAUDE.md`:

```
PLAN → REVIEW(human) → CODE → TEST → VERIFY(human) → COMMIT
```

- Task tracking: `docs/tasks/current.md` (active task), `docs/tasks/backlog.md` (queue)
- PRD documents: `docs/prd/`

See `CLAUDE.md` for full development conventions, design tokens, coding standards, and workflow rules.

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Development conventions & constraints |
| [docs/prd/00-overview.md](./docs/prd/00-overview.md) | Product overview & module map |
| [docs/prd/14-business-flows.md](./docs/prd/14-business-flows.md) | Core business flows |
| [docs/tasks/backlog.md](./docs/tasks/backlog.md) | Iteration backlog |
