# OSLPay Merchant Platform

## 项目概述

OSLPay Merchant Platform 是一个面向加密货币支付商户的综合性 B2B 门户平台，服务于商户的业务人员和技术人员，提供从入驻申请、业务运营到技术集成的全链路支持。

### 核心功能
- **商户注册与 KYB 认证**：商户注册、邮箱验证、KYB（Know Your Business）资质认证
- **商户入驻申请**：在线提交入驻材料，草稿自动保存，追踪审核进度
- **业务数据仪表盘**：实时查看交易数据、订单状态、关键指标
- **API 文档引擎（核心亮点）**：将 OpenAPI 3.0 规范解析为 AI 编程友好的交互式文档，支持场景化 AI 提示词生成、多语言代码生成、在线试用
- **开发者工具套件**：签名验证、Webhook 配置、域名白名单、API 请求日志
- **MCP 集成**：通过 Model Context Protocol 让 AI 编程助手直接调用 OSLPay API
- **双环境支持**：生产环境和沙箱环境全局切换，数据完全隔离

### 核心优势
- **AI 驱动的开发体验**: 一键生成 AI 提示词，快速集成 API。核心亮点是 API 文档引擎，它将 OpenAPI 3.0 规范文件解析为 AI 编程友好的交互式文档，支持多语言代码（Java、Go、TS/JS、Rust、Python、cURL）生成、在线签名验证和沙箱测试。
- **双环境隔离**: 沙箱环境安全测试，生产环境稳定运行
- **角色权限管理**: 管理员、业务人员、技术人员三种角色各司其职
- **实时通知**: Webhook 推送，及时获取业务事件通知

### 技术选型
- Next.js 16 + React 19 + TypeScript + Tailwind CSS V4 + Radix UI：SSR/SSG 支持、类型安全、原子化 CSS
- Java（JDK 25）+ Spring Boot 3.5.7：企业级后端框架
- MySQL：存储商户数据、审计日志等结构化数据
- Redis：缓存 API 文档解析结果和会话信息
- Apollo：分布式配置中心，管理多环境配置（生产/沙箱端点地址、功能开关等）
- XXL-Job：分布式任务调度，处理 Webhook 重试、数据报表生成等定时任务

---

## 产品需求文档（PRD）

详细的产品功能和业务流程文档位于 `docs/prd/` 目录，开发前必须阅读对应模块的 PRD：

| 文档 | 内容 |
|------|------|
| `docs/prd/00-overview.md` | 产品概述、模块全景、目标用户 |
| `docs/prd/01-user-roles.md` | 三种角色定义、权限矩阵 |
| `docs/prd/02-registration-kyb.md` | 商户注册、登录、KYB 认证流程 |
| `docs/prd/03-merchant-onboarding.md` | 入驻申请多步表单、草稿管理 |
| `docs/prd/04-dashboard-orders.md` | 仪表盘指标、订单管理 |
| `docs/prd/05-api-doc-engine.md` | API 文档引擎（核心亮点） |
| `docs/prd/06-developer-console.md` | 开发者控制台、环境管理 |
| `docs/prd/07-signature-tools.md` | 签名生成/验证/加密工具 |
| `docs/prd/08-webhook-management.md` | Webhook 配置、推送日志、重试策略 |
| `docs/prd/09-mcp-integration.md` | MCP Server 与 AI 编程助手集成 |
| `docs/prd/10-member-permission.md` | 成员管理、角色分配 |
| `docs/prd/11-domain-whitelist.md` | 域名白名单管理 |
| `docs/prd/12-api-request-logs.md` | API 请求日志查看 |
| `docs/prd/13-menu-navigation.md` | 菜单结构与导航 |
| `docs/prd/14-business-flows.md` | 核心业务流程总览 |

---

## 业务领域术语表

开发时遇到以下术语，含义如下：

| 术语 | 说明 |
|------|------|
| **KYB** | Know Your Business，商户资质认证，合规要求，通过后方可开展支付业务 |
| **KYC** | Know Your Customer，终端用户身份认证 |
| **Onboarding** | 商户入驻，提交业务信息和合规文件的审核流程 |
| **Sandbox / 沙箱** | 测试环境，使用测试卡号和模拟数据，不产生真实交易 |
| **Production / 生产** | 正式环境，真实交易和扣款 |
| **OpenAPI Spec** | 符合 OpenAPI 3.0 标准的 YAML/JSON 格式 API 规范文件 |
| **AI Context Block** | 每个 API 端点自动生成的结构化元数据块，供 AI 编程助手解析使用 |
| **MCP** | Model Context Protocol，开放协议，允许 AI 编程助手通过 SSE 远程调用外部 API |
| **签名 (Signature)** | RSA SHA256withRSA 签名，用于 API 请求鉴权，签名字符串格式: `appId=[appId]&timestamp=[timestamp]` |
| **Webhook** | 事件驱动的 HTTP 回调通知，系统事件发生时主动推送到商户配置的 URL |
| **AppId** | 商户应用唯一标识符，用于 API 调用鉴权 |
| **Web SDK** | 前端 JavaScript SDK，商户网页端集成支付能力，受域名白名单约束 |

---

## Monorepo 目录结构

```
osl-pay-merchant-portal/
├── CLAUDE.md                   # 开发规范与约束（本文件）
├── AGENTS.md                   # AI Agent 配置
├── README.md                   # 项目 README
├── docs/                       # 项目文档
│   ├── prd/                    # 产品需求文档（PRD）
│   └── *.pdf                   # 原始设计文档
├── frontend/                   # 前端项目（Next.js）
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── public/                 # 静态资源
│   └── src/
│       ├── app/                # Next.js App Router 路由
│       ├── components/         # 可复用组件
│       │   └── ui/             # Radix UI 基础组件封装
│       ├── hooks/              # 自定义 React Hooks
│       ├── lib/                # 工具函数、常量、类型定义
│       ├── providers/          # Context Providers（语言、认证、环境）
│       ├── services/           # API 请求封装
│       └── i18n/               # 国际化
│           └── locales/        # 语言文件（en.js, zh.js）
└── backend/                    # 后端项目（Spring Boot）
    ├── pom.xml
    └── src/main/java/com/osl/pay/portal/
        ├── PortalApplication.java
        ├── config/             # 配置类（CORS、安全、Apollo、Redis）
        ├── controller/         # REST Controller
        ├── service/            # 业务逻辑层
        ├── repository/         # 数据访问层（MyBatis / JPA）
        ├── model/              # 实体类
        │   ├── entity/         # 数据库实体
        │   ├── dto/            # 数据传输对象（请求/响应）
        │   └── enums/          # 枚举定义
        ├── security/           # 认证与鉴权
        ├── mcp/                # MCP Server 实现
        ├── docengine/          # API 文档引擎（OpenAPI 解析）
        └── common/             # 通用工具、异常处理、审计日志
```

---

## 前端路由结构

路由与产品模块的映射关系，新建页面必须遵循此结构：

```
frontend/src/app/
├── (auth)/                       # 认证相关（无侧边栏布局）
│   ├── login/page.tsx            # 登录
│   ├── register/page.tsx         # 注册
│   ├── forgot-password/page.tsx  # 忘记密码
│   └── verify-email/page.tsx     # 邮箱验证
├── (portal)/                     # 主平台（含侧边栏布局）
│   ├── layout.tsx                # 侧边栏 + 顶部栏 + 内容区
│   ├── getting-started/page.tsx  # 快速开始
│   ├── dashboard/page.tsx        # 仪表盘
│   ├── kyb/page.tsx              # KYB 引导认证
│   ├── business/                 # 业务管理
│   │   ├── onboarding/page.tsx   # 入驻申请
│   │   └── members/page.tsx      # 成员与权限
│   └── developer/                # 开发者套件
│       ├── docs/page.tsx         # API 文档
│       ├── credentials/page.tsx  # API 凭证
│       ├── domains/page.tsx      # 域名白名单
│       ├── webhooks/page.tsx     # Webhook 管理
│       ├── signature/page.tsx    # 签名工具
│       ├── logs/page.tsx         # API 请求日志
│       └── mcp/page.tsx          # MCP 配置中心
└── api/                          # Next.js API Routes（BFF 层，可选）
    └── guides/                   # 结构化快速开始指南 API
```

**规则**:
- `(auth)` 和 `(portal)` 是 Route Groups，分别对应无布局和有布局的页面
- 每个 `page.tsx` 是页面入口，复杂页面的子组件放在同级 `_components/` 目录下
- 不要在 `app/` 目录下创建与路由无关的文件

---

## Frontend Rules

### Tech Stack

- **Framework:** React 19 + Next.js 16 App Router
- **Routing:** Next.js file-system routing under `frontend/src/app`
- **Styling:** Tailwind CSS V4 + PostCSS. A small amount of inline style remains only for runtime-calculated gradients, positions, and CSS-variable injection. Design tokens live in `frontend/src/lib/design-tokens.ts`.
- **UI primitives:** Radix UI wrappers live in `frontend/src/components/ui`
- **Fonts:** System font stack (already set in `globals.css`). Do not import external fonts.
- Package manager: pnpm. Do not use npm or yarn.
- Test runner: Vitest + @testing-library/react.
- Icons: Heroicons (`@heroicons/react/24/outline` for menus/buttons, `@heroicons/react/24/solid` for status indicators).
- Images: always use `next/image` with explicit `width`, `height`, and `alt`.

### Project Structure

- UI primitives live in `frontend/src/components/ui/`. Reuse them before creating new ones.
- App routes live in `frontend/src/app/`. Follow Next.js App Router conventions.
- Global CSS and design tokens are in `frontend/src/app/globals.css`.
- API 请求封装放在 `frontend/src/services/`，一个后端模块对应一个 service 文件。
- 自定义 Hooks 放在 `frontend/src/hooks/`，以 `use` 开头命名。
- 类型定义放在 `frontend/src/lib/types.ts` 或对应模块的 `types.ts`。
- Prefer composition over creating many tiny wrappers.
- Keep files under 250 lines unless justified.
- Do not introduce new state management libraries.
- Match existing folder naming, import order, and lint conventions.

### Code Organization (per component file)

```
1. Imports (React, hooks, types, components)
2. Type / interface definitions
3. Constants
4. Component (exported default)
   4.1 State
   4.2 Side effects
   4.3 Event handlers
   4.4 Return JSX
5. Sub-components (private to file)
```

### Naming Conventions

- Components: `PascalCase` — `MetricCard`, `OrderTable`.
- Functions / handlers: `camelCase` — `handleClick`, `loadData`.
- Constants: `UPPER_SNAKE_CASE` — `STATUS_COLORS`, `API_ENDPOINT`.
- Service files: `camelCase` — `orderService.ts`, `webhookService.ts`.
- Hook files: `camelCase` with `use` prefix — `useAuth.ts`, `useEnvironment.ts`.

### Design Tokens (CSS Variables)

All colors MUST come from CSS variables defined in `globals.css`. Never hardcode hex values inline.

| Token | Value | Usage |
|---|---|---|
| `--primary-black` | `#000000` | Primary buttons, top bar, active menu |
| `--neon-green` | `#c4ff0d` | Logo, icons on dark backgrounds, active menu icon |
| `--bg-light` | `#f8f9fa` | Main content area background |
| `--white` | `#ffffff` | Cards, sidebar |
| `--gray-900` | `#1f2937` | Primary headings |
| `--gray-700` | `#374151` | Subtitles, secondary button text |
| `--gray-600` | `#4b5563` | Body text |
| `--gray-500` | `#6b7280` | Helper text, descriptions |
| `--gray-400` | `#9ca3af` | Disabled text, placeholders |
| `--gray-200` | `#e5e7eb` | Primary borders |
| `--gray-100` | `#f3f4f6` | Secondary borders, table row dividers |
| `--gray-50` | `#f9fafb` | Hover backgrounds |
| `--success` | `#15803d` | Success states |
| `--error` | `#b42318` | Error states |
| `--warning` | `#b45309` | Warning states |
| `--info` | `#1d4ed8` | Info states |

Functional color soft variants (`--success-soft`, `--error-soft`, etc.) are available for light backgrounds.

### Typography

- Font stack: system fonts (already set in `globals.css`). Do not import external fonts.
- Font sizes use Tailwind classes only:

| Purpose | Tailwind | Line-height |
|---|---|---|
| Hero heading | `text-3xl` (30px) | 1.2 |
| Page heading | `text-2xl` (24px) | 1.25 |
| Section heading | `text-xl` (20px) | 1.3 |
| Subtitle | `text-lg` (18px) | 1.4 |
| Body | `text-base` (16px) | 1.5 |
| Small | `text-sm` (14px) | 1.5 |
| Caption | `text-xs` (12px) | 1.5 |

- Font weights: `font-bold` (logo), `font-semibold` (headings, table headers), `font-medium` (buttons), `font-normal` (body).

### Spacing System

Based on a 4px base / 8-point grid:

| Name | Tailwind | Usage |
|---|---|---|
| xs | `1` (4px) | Tight spacing |
| sm | `2` (8px) | Small gaps |
| md | `3` (12px) | Medium gaps |
| base | `4` (16px) | Base spacing |
| lg | `5` (20px) | Large gaps |
| xl | `6` (24px) | Card padding, section gaps |
| 2xl | `8` (32px) | Module gaps, page `space-y` |
| 3xl | `12` (48px) | Block spacing |

Key patterns:
- Card padding: `p-6`
- Button padding: `px-5 py-2.5`
- Table cell padding: `px-6 py-4`
- Page content padding: `p-6`
- Page-level vertical spacing: `space-y-8`
- Component-level vertical spacing: `space-y-6`
- Element-level vertical spacing: `space-y-4`

### Border Radius

| Name | Tailwind | Usage |
|---|---|---|
| Small | `rounded-md` (6px) | Input fields |
| Medium | `rounded-lg` (8px) | Buttons, cards |
| Large | `rounded-xl` (12px) | Large cards |
| Full | `rounded-full` | Badges, avatars |

### Layout

- Overall: sidebar (fixed 240px `w-60`) + main content (flex-1), full viewport height.
- Top bar: black background (`--primary-black`), 64px height, contains env switcher + user info.
- Sidebar: logo area (black, 64px) + white nav area with `px-4 py-6 space-y-2`.
- Content area: `flex-1 overflow-y-auto p-6`.
- Page title block: `<h1 className="text-2xl font-semibold text-gray-900">` + `<p className="text-sm text-gray-500">` with `mb-8`.

### Responsive Design

| Breakpoint | Min-width | Tailwind | Device |
|---|---|---|---|
| sm | 640px | `sm:` | Mobile landscape |
| md | 768px | `md:` | Tablet |
| lg | 1024px | `lg:` | Desktop |
| xl | 1280px | `xl:` | Large screen |
| 2xl | 1536px | `2xl:` | Extra-large |

Rules:
- Grid cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`.
- Sidebar: visible on `lg:`, hidden with hamburger on smaller screens.
- Tables: full table on `md:+`, card layout on mobile (`md:hidden` / `hidden md:block`).
- Touch targets: minimum 44x44px on mobile.
- Minimum font size on mobile: 14px (`text-sm`).

### Component Patterns

**Buttons:**
- Primary: black bg, white text, `rounded-lg`, hover `#1a1a1a`.
- Secondary: white bg, gray-700 text, border gray-200, hover bg gray-50.
- Disabled: `opacity-50 cursor-not-allowed`.

**Inputs:**
- Border `gray-300`, `rounded-lg`, `px-4 py-2.5`.
- Focus: `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`.

**Cards:**
- `bg-white rounded-lg shadow-sm p-6` with `border: 1px solid var(--gray-200)`.
- Metric cards add `hover:shadow-md transition-all`.

**Tables:**
- Wrapped in a white card with border.
- Header row: `border-b border-gray-100`, `text-sm font-semibold text-gray-900`.
- Body rows: `border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors`.
- Cell padding: `py-4 px-6`.

**Badges (status labels):**
- `rounded-full`, `text-sm font-medium`, `px-3 py-1`.
- Success: `bg-green-50 text-green-700 border-green-200`.
- Warning: `bg-yellow-50 text-yellow-700 border-yellow-200`.
- Error: `bg-red-50 text-red-700 border-red-200`.
- Info: `bg-blue-50 text-blue-700 border-blue-200`.

**Modals:**
- Overlay: `fixed inset-0 bg-black/40 z-50`.
- Content: `bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto`.
- Use `role="dialog" aria-modal="true" aria-labelledby`.
- Close on backdrop click and Escape key.

**Alerts:**
- Info: `bg-blue-50 border-blue-200`.
- Warning: `bg-amber-50 border-amber-200`.
- With icon + title + description layout using `flex gap-3`.

**Menu items:**
- Inactive: `bg-[#f8f9fa] text-gray-900 border border-gray-200`, icon color `gray-500`.
- Active: `bg-black text-white`, icon color `neon-green (#c4ff0d)`.

### Animation & Transitions

- All interactive elements: `transition-all` or specific property transitions.
- Duration: 150ms (hover/color), 200ms (general), 300ms (modals/drawers).
- Tailwind: prefer `transition-all`, `transition-colors`, `transition-shadow`.

### Interactive States

Every interactive component MUST implement all applicable states:
- **Default** — normal appearance.
- **Hover** — visual feedback (bg change, shadow lift, underline).
- **Focus** — `focus:ring-2 focus:ring-blue-500` (never remove outline without replacement).
- **Active/Pressed** — if applicable.
- **Disabled** — `opacity-50 cursor-not-allowed`.
- **Loading** — spinner (`animate-spin`) or skeleton (`animate-pulse bg-gray-200 rounded`).
- **Empty** — descriptive placeholder with guidance text.
- **Error** — red border/text with error message.

### Accessibility (WCAG 2.1 AA)

- Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- Correct heading hierarchy: `h1` > `h2` > `h3`, no skipping.
- All icon-only buttons need `aria-label`.
- Form inputs need associated labels or `aria-label`.
- Tables: proper `<thead>`, `<tbody>`, `<th>` usage.
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Keyboard: all interactive elements reachable via Tab; Enter/Space to activate; Escape to close overlays.
- Color contrast: 4.5:1 for normal text, 3:1 for large text and icons.

### Performance

- Use `next/image` with `priority` for above-fold images.
- Lazy-load heavy components with `dynamic(() => import(...), { loading })`.
- Images below fold: `loading="lazy"`.
- Remove `console.log` in production (configured in `next.config`).

### Browser Support

- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

### Acceptance Criteria (all frontend changes)

- Output must look like part of the existing product — match design tokens, spacing, typography.
- No unnecessary abstractions or wrapper components.
- Responsive at mobile (< 640px), tablet (768px), desktop (1024px+).
- Includes loading / empty / error states for all data-dependent views.
- Pass `pnpm build` (type check) and `pnpm test`.
- Explain why each new component exists if adding one.

---

## i18n Rules (MANDATORY)

**Every user-visible string must use `t()` — no hardcoded English or Chinese text in TSX.**

- Import: `import { useI18n } from "@/providers/language-provider"` or the relative `providers/language-provider` path
- Usage: `const { t } = useI18n();` then `t("namespace.key")`
- When adding any new UI text, always add the key to **all locale files**: `frontend/src/i18n/locales/en.js`, `zh.js`
- Variable interpolation: `t("key", { count: n })` → `"{count} items"` in locale file
- Fallback to English is automatic, but all locale files must have the key
- Page-level components need `useI18n` too — don't skip them

### i18n Namespace 约定

按模块组织翻译 key，namespace 与路由结构对应：

| Namespace | 对应模块 | 示例 Key |
|-----------|----------|----------|
| `common` | 通用文本（按钮、状态、确认框等） | `common.save`, `common.cancel`, `common.confirm` |
| `auth` | 登录、注册、忘记密码 | `auth.login.title`, `auth.register.email` |
| `kyb` | KYB 认证 | `kyb.step1.companyName` |
| `dashboard` | 仪表盘 | `dashboard.metrics.totalAmount`, `dashboard.orders.status` |
| `onboarding` | 入驻申请 | `onboarding.step1.companyName`, `onboarding.status.draft` |
| `members` | 成员管理 | `members.invite.title`, `members.role.admin` |
| `docs` | API 文档 | `docs.category.order`, `docs.aiPrompt.generateCode` |
| `credentials` | API 凭证 | `credentials.appId`, `credentials.copySuccess` |
| `signature` | 签名工具 | `signature.generate.title`, `signature.verify.result` |
| `webhooks` | Webhook 管理 | `webhooks.create.title`, `webhooks.status.success` |
| `domains` | 域名白名单 | `domains.add.placeholder`, `domains.error.invalid` |
| `logs` | API 请求日志 | `logs.detail.request`, `logs.method.get` |
| `mcp` | MCP 配置中心 | `mcp.config.copy`, `mcp.tools.getQuote` |
| `env` | 环境切换 | `env.production`, `env.sandbox` |
| `nav` | 导航菜单 | `nav.gettingStarted`, `nav.developer.docs` |

---

## Backend Rules

### Tech Stack

- **Framework:** Java 25 + Spring Boot 3.5.7 + Spring Security
- **Build tool:** Maven (pom.xml)
- **ORM:** MyBatis-Plus（优先）
- **Cache:** Spring Data Redis
- **Config:** Apollo Client
- **Scheduler:** XXL-Job
- **API Doc:** SpringDoc OpenAPI (Swagger UI)
- **Test:** JUnit 5 + Mockito + Spring Boot Test

### Package Structure

基础包名: `com.osl.pay.portal`

```
com.osl.pay.portal
├── config/             # @Configuration 类
├── controller/         # @RestController，按模块分子包
│   ├── auth/           # AuthController（登录、注册、密码重置）
│   ├── merchant/       # MerchantController（入驻、KYB）
│   ├── dashboard/      # DashboardController（仪表盘、订单）
│   ├── docs/           # DocsController（API 文档引擎）
│   ├── developer/      # DeveloperController（凭证、白名单、日志）
│   ├── webhook/        # WebhookController（配置、测试、日志）
│   └── sign/           # SignController（签名、验证、加密）
├── service/            # 业务逻辑接口 + impl/ 实现
├── repository/         # 数据访问层
├── model/
│   ├── entity/         # 数据库实体（@TableName / @Entity）
│   ├── dto/            # DTO（XxxRequest, XxxResponse）
│   └── enums/          # 枚举（OrderStatus, UserRole 等）
├── security/           # JWT 鉴权、角色拦截器
├── mcp/                # MCP Server（SSE 通信、工具实现）
├── docengine/          # OpenAPI 解析、AI Context Block 生成
└── common/
    ├── exception/      # 全局异常处理（@RestControllerAdvice）
    ├── result/         # 统一响应包装（Result<T>）
    ├── audit/          # 审计日志切面
    └── util/           # 工具类
```

### Naming Conventions

- Class: `PascalCase` — `OrderService`, `MerchantController`
- Method: `camelCase` — `createOrder`, `getQuote`
- Constants: `UPPER_SNAKE_CASE` — `MAX_RETRY_COUNT`
- Database table: `snake_case` with `t_` prefix — `t_merchant`, `t_order`, `t_audit_log`
- Database column: `snake_case` — `merchant_id`, `created_at`
- DTO: 请求用 `XxxRequest`，响应用 `XxxResponse` — `OnboardingRequest`, `OrderResponse`
- Enum: `PascalCase` class, `UPPER_SNAKE_CASE` values — `OrderStatus.PROCESSING`

### REST API Design

**路径规范**:
- 基础前缀: `/api/v1/`
- 资源名用复数名词: `/api/v1/orders`, `/api/v1/merchants`
- 层级关系用嵌套: `/api/v1/webhooks/{id}/logs`
- 操作用 HTTP 方法表达，不要在路径中用动词（特殊操作除外如 `/api/v1/sign/generate`）

**路径与模块映射**:

| 路径前缀 | 模块 | 说明 |
|----------|------|------|
| `/api/v1/auth/**` | 认证 | 登录、注册、令牌刷新 |
| `/api/v1/merchants/**` | 商户 | KYB、入驻申请 |
| `/api/v1/dashboard/**` | 仪表盘 | 指标、图表数据 |
| `/api/v1/orders/**` | 订单 | 订单列表、详情、导出 |
| `/api/v1/members/**` | 成员 | 邀请、移除、角色变更 |
| `/api/v1/docs/**` | 文档引擎 | 端点列表、AI Context、Schema |
| `/api/v1/codegen/**` | 代码生成 | 多语言代码示例 |
| `/api/v1/sign/**` | 签名 | 生成、验证、加密 |
| `/api/v1/webhooks/**` | Webhook | CRUD、测试、日志 |
| `/api/v1/domains/**` | 域名白名单 | 增删查 |
| `/api/v1/logs/**` | 请求日志 | 列表、详情 |
| `/api/v1/guides/**` | 快速指南 | 结构化 JSON 指南 |

### 统一响应格式

所有 API 响应使用统一包装:

```json
// 成功
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

// 分页
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}

// 错误
{
  "code": 40001,
  "message": "Invalid signature",
  "data": null
}
```

**错误码规范**:
- `0`: 成功
- `400xx`: 请求参数错误
- `401xx`: 认证/鉴权错误
- `403xx`: 权限不足
- `404xx`: 资源不存在
- `500xx`: 服务器内部错误

### 认证与鉴权

- 认证方式: JWT（JSON Web Token）
- Token 位置: `Authorization: Bearer {token}` 请求头
- Token 刷新: 提供 refresh token 机制
- 角色注解: 使用自定义注解 `@RequireRole(UserRole.ADMIN)` 标注 Controller 方法
- 环境标识: 通过请求头 `X-Environment: production | sandbox` 传递当前环境

### 环境配置

| 变量/配置 | 说明 |
|-----------|------|
| `spring.profiles.active` | 运行环境（dev / staging / prod） |
| `oslpay.api.production-url` | 生产 API: `https://openapi.osl-pay.com` |
| `oslpay.api.sandbox-url` | 沙箱 API: `https://openapitest.osl-pay.com` |
| `oslpay.mcp.production-url` | 生产 MCP: `https://mcp.osl-pay.com/sse` |
| `oslpay.mcp.sandbox-url` | 沙箱 MCP: `https://mcptest.osl-pay.com/sse` |

Apollo 配置中心管理环境特定配置，代码中通过 `@Value` 或 `@ApolloConfig` 注入。

### Backend Acceptance Criteria

- 所有 Controller 方法必须有 `@RequireRole` 注解（公开接口用 `@Public`）
- 所有修改操作记录审计日志
- 所有用户输入参数使用 `@Valid` + Jakarta Validation 注解校验
- Service 层方法必须有单元测试
- 不在 Controller 中写业务逻辑，Controller 只做参数校验和调用 Service
- 敏感信息（密钥、密码、Token）不得出现在日志或响应中
- 数据库查询必须使用参数化查询，禁止拼接 SQL

---

## 前后端协作约定

### API 调用流程

```
Frontend                            Backend
   │                                   │
   ├─ Authorization: Bearer {jwt} ────→│
   ├─ X-Environment: sandbox ─────────→│  请求头
   ├─ Content-Type: application/json ─→│
   │                                   │
   │←── { code, message, data } ──────┤  统一响应
```

### 前端 Service 封装约定

每个后端模块对应一个 service 文件:

```typescript
// frontend/src/services/orderService.ts
import { api } from '@/lib/api';  // 封装了 JWT 和环境头的 fetch wrapper

export const orderService = {
  list: (params: OrderListParams) => api.get('/api/v1/orders', { params }),
  detail: (id: string) => api.get(`/api/v1/orders/${id}`),
  export: (params: OrderListParams) => api.get('/api/v1/orders/export', { params, responseType: 'blob' }),
};
```

### 环境切换联动

环境切换是前端行为，后端通过请求头感知:
1. 前端: `EnvironmentProvider` Context 存储当前环境
2. 前端: `api` 工具自动在请求头附加 `X-Environment`
3. 后端: 拦截器读取 `X-Environment`，切换对应的数据源和外部 API 端点

---

## Git Workflow

### 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能 | `feat/<module>/<description>` | `feat/onboarding/draft-save` |
| 修复 | `fix/<module>/<description>` | `fix/dashboard/order-filter` |
| 重构 | `refactor/<module>/<description>` | `refactor/auth/jwt-refresh` |
| 文档 | `docs/<description>` | `docs/prd-webhook` |

`<module>` 对应: `auth`, `kyb`, `onboarding`, `dashboard`, `docs`, `developer`, `signature`, `webhooks`, `domains`, `logs`, `mcp`, `members`, `common`

### Commit Message

格式: `<type>(<scope>): <description>`

```
feat(onboarding): add draft auto-save on step navigation
fix(signature): correct PKCS#8 key format validation
docs(prd): add webhook management PRD
refactor(api): extract unified response wrapper
```

Type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`
Scope: 与分支 module 一致

### PR 规范

- 标题简洁，不超过 70 字符
- 描述中必须关联对应的 PRD 文档（如: `See docs/prd/08-webhook-management.md`）
- 前后端独立 PR，不要混合提交

---

## Development Workflow (MANDATORY)

**本章节是硬性约束，每次会话必须遵守。不允许跳过任何步骤。**

### 迭代原则

- **小步快跑**: 以「一个可独立验收的用户故事」为迭代单位，不以"模块"为单位
- **前后端闭环**: 每个迭代必须前后端同步实现，产出可运行、可验收的完整功能
- **人工确认门禁**: 计划评审和功能验收是必须的人工确认点，未获确认不得进入下一阶段
- **上下文可恢复**: 通过任务文件记录执行状态，确保会话中断后可快速恢复

### 迭代流程

```
┌─────────────────────────────────────────────────────────────────┐
│  ① PLAN — 创建任务文件                                          │
│  梳理需求范围、开发计划、测试用例                                  │
│  输出: docs/tasks/current.md                                    │
│                                                                 │
│  ② REVIEW — 人工评审计划         ⛔ 等待用户确认                  │
│  用户审阅任务文件，确认范围和计划无误                               │
│                                                                 │
│  ③ CODE — 编码实现                                              │
│  前后端同步开发，每完成一个 checklist 项记录执行日志                 │
│                                                                 │
│  ④ TEST — 运行测试                                              │
│  执行测试用例，记录结果到执行日志                                   │
│                                                                 │
│  ⑤ VERIFY — 人工验收             ⛔ 等待用户确认                  │
│  用户验收功能，确认符合预期                                        │
│                                                                 │
│  ⑥ COMMIT — 提交代码                                            │
│  提交代码，任务文件移入 archive，更新 next step                    │
│                                                                 │
│  → 回到 ①                                                       │
└─────────────────────────────────────────────────────────────────┘
```

**⛔ 标记的步骤是人工门禁，必须等待用户明确确认后才能继续。**

### 任务文件管理

```
docs/tasks/
├── current.md              # 当前任务（有且只有一个）
├── backlog.md              # 迭代排序（全局待办，按优先级排列）
└── archive/                # 已验收任务存档
    ├── 001-project-init.md
    ├── 002-auth-register.md
    └── ...
```

**规则**:
- `current.md` 是每次会话的第一入口，中断恢复时首先读取此文件
- 同一时间只能有一个 current task，完成后才能开始下一个
- 验收通过后将 `current.md` 重命名移入 `archive/`，编号递增
- `backlog.md` 记录全局迭代排序，每次迭代完成后更新

### 任务文件模板

每个任务文件必须包含以下结构：

```markdown
# Task-{NNN}: {任务标题}

## Status: Planning | In Progress | Testing | Verifying | Done

## PRD Reference
docs/prd/xx-xxx.md — 第 N 节「xxx」

## Scope
- 前端: {涉及的页面/组件}
- 后端: {涉及的接口/服务}
- 数据库: {涉及的表}

## Development Plan
- [ ] {具体的开发步骤 1}
- [ ] {具体的开发步骤 2}
- [ ] ...

## Test Cases
1. {正常场景}: {操作} → {预期结果}
2. {异常场景}: {操作} → {预期结果}
3. ...

## Execution Log (倒序，最新的在上面)

### {YYYY-MM-DD HH:MM}
- {做了什么}
- {遇到的问题和解决方案}
- {完成了哪些 checklist 项}

## Next Step
{当前任务完成后，下一个要做的任务是什么}
{或者如果任务中断，恢复后应该从哪里继续}
```

### 会话启动规则

每次新会话开始时，必须按以下顺序操作：

1. **读取 `docs/tasks/current.md`** — 如果存在，恢复上次中断的任务
2. **读取 `docs/tasks/backlog.md`** — 确认下一个待做任务
3. **向用户确认** — "上次进行到 {xxx}，是否继续？" 或 "下一个任务是 {xxx}，是否开始？"
4. **不得自行决定做什么** — 必须基于任务文件和用户指令行动

### 编码阶段规则

- 每完成一个 Development Plan 中的 checklist 项，立即勾选并写执行日志
- 遇到计划外的问题或范围变更，先更新任务文件再继续
- 不得实现计划范围之外的功能
- 前后端代码在同一个迭代中完成，不允许只做前端或只做后端

### 验收后操作

1. 将 `current.md` 移动到 `docs/tasks/archive/{NNN}-{slug}.md`
2. 更新 `backlog.md`（标记已完成，确认下一个任务）
3. 在 archive 文件的 **Next Step** 中写明下一个任务的内容
4. 清空 `current.md`（或删除，下次创建新的）
