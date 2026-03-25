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
- **MySQL** 8.x
- **Redis**
- **Mailpit** (optional, for local email testing)

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

### 1. Infrastructure Services

```bash
# MySQL — create database and tables
mysql -u root -p < backend/src/main/resources/db/init.sql

# Redis — start server
redis-server

# Mailpit (optional) — local SMTP for email testing
brew install mailpit
mailpit
# SMTP: localhost:1025 | Web UI: http://localhost:8025
```

### 2. Backend

```bash
cd backend

# Build
./mvnw clean package

# Run tests
./mvnw test

# Start server (http://localhost:8080)
./mvnw spring-boot:run
```

默认以 `dev` profile 启动，邮件通过日志输出（不实际发送）。

### 3. Frontend

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

### 4. Verify

```bash
# Frontend
open http://localhost:3000

# Backend health check
curl http://localhost:8080/api/v1/health
# → {"code":0,"message":"success","data":"OSLPay Merchant Portal Backend is running"}

# Swagger UI
open http://localhost:8080/swagger-ui.html

# Mailpit (if running)
open http://localhost:8025
```

## Local Email Testing

后端有两种邮件实现，通过 Spring Profile 切换：

| Profile | 实现 | 行为 |
|---------|------|------|
| `dev` (默认) | `LogEmailServiceImpl` | 邮件内容打印到控制台日志，不实际发送 |
| `prod` | `SmtpEmailServiceImpl` | 从数据库加载 HTML 模板，通过 SMTP 发送 |

### 使用 Mailpit 查看 HTML 邮件

如果你想在本地看到真实的邮件渲染效果（HTML 模板 + 品牌样式）：

```bash
# 1. 启动 Mailpit
mailpit

# 2. 以 prod profile 启动后端（SMTP 默认指向 localhost:1025）
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# 3. 触发邮件（注册、忘记密码等）后打开 Mailpit Web UI
open http://localhost:8025
```

`application.yml` 的邮件默认配置已指向 `localhost:1025`（Mailpit 默认端口），dev 环境无需额外配置。

### 使用真实 SMTP（如 Gmail）

```bash
SMTP_HOST=smtp.gmail.com \
SMTP_PORT=587 \
SMTP_USERNAME=your@gmail.com \
SMTP_PASSWORD=your-app-password \
SMTP_AUTH=true \
SMTP_STARTTLS=true \
EMAIL_FROM=your@gmail.com \
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

> Gmail 需要先生成 App Password: https://myaccount.google.com/apppasswords

### 邮件模板管理

邮件模板存储在 `t_email_template` 表中，支持按 `code + locale` 管理：

| code | 场景 |
|------|------|
| `VERIFY_EMAIL` | 注册邮箱验证 |
| `PASSWORD_RESET` | 密码重置 |
| `INVITATION` | 团队成员邀请 |

每个 code 支持多语言（`en` / `zh`），模板使用 `{varName}` 占位符。修改邮件内容直接更新数据库记录即可，无需重新部署。

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
