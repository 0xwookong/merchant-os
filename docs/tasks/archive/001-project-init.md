# Task-001: 项目脚手架搭建

## Status: Done

## PRD Reference
docs/prd/00-overview.md — 技术架构概要
CLAUDE.md — Monorepo 目录结构、Frontend Rules、Backend Rules

## Scope
- 前端: Next.js 16 项目初始化（TypeScript + Tailwind CSS V4 + Radix UI + Heroicons + Vitest）
- 后端: Spring Boot 3.5.7 项目初始化（JDK 25 + Maven + MyBatis-Plus + Redis + SpringDoc）
- 工程: .gitignore、EditorConfig

## Development Plan

### 前端 (frontend/)
- [x] `pnpm create next-app` 初始化 Next.js 16 + TypeScript 项目
- [x] 安装核心依赖: Tailwind CSS V4、Radix UI、Heroicons
- [x] 安装开发依赖: Vitest、@testing-library/react、ESLint
- [x] 创建目录结构: `src/app`、`src/components/ui`、`src/hooks`、`src/lib`、`src/providers`、`src/services`、`src/i18n/locales`
- [x] 配置 `globals.css`: 写入 CLAUDE.md 中定义的 CSS Variables（Design Tokens）
- [x] 配置 Tailwind: 使用 V4 `@theme inline` 扩展主题颜色
- [x] 创建 `src/app/layout.tsx`: 根布局（系统字体、html lang）
- [x] 创建 `src/app/page.tsx`: 临时首页（显示 "OSLPay Merchant Portal"）
- [x] 配置 Vitest: `vitest.config.ts` + smoke test
- [x] 创建 i18n 占位文件: `en.js`、`zh.js`
- [x] 确认 `pnpm build` 可构建、`pnpm test` 可通过

### 后端 (backend/)
- [x] 手动创建 Spring Boot 3.5.7 项目骨架（JDK 25、Maven + Maven Wrapper）
- [x] 添加核心依赖: Spring Web、Spring Data Redis、MyBatis-Plus、MySQL Connector、SpringDoc、Lombok、Jakarta Validation
- [x] 创建包结构: config、controller、service、repository、model/{entity,dto,enums}、security、mcp、docengine、common/{exception,result,audit,util}
- [x] 实现统一响应包装: `Result<T>` + `PageResult<T>`
- [x] 实现全局异常处理: `GlobalExceptionHandler` + `BizException`
- [x] 创建健康检查端点: `GET /api/v1/health`
- [x] 配置 `application.yml`: 端口 8080、DB/Redis 占位、DataSource/Redis 自动配置排除
- [x] 配置 CORS: 允许 `localhost:3000` 跨域
- [x] 编写 HealthController 单元测试
- [x] 确认 `./mvnw clean package` 可构建、`./mvnw test` 可通过

### 工程配置
- [x] 根目录 `.gitignore`（Node + Java + IDE + OS）
- [x] 根目录 `.editorconfig`（统一缩进、换行符）
- [x] 确认 CORS preflight 和实际请求均正确返回 Access-Control 头

## Test Cases
1. ✅ 前端构建: `pnpm build` → 无报错退出
2. ✅ 前端测试: `pnpm test` → 1 test passed（Home page renders title）
3. ✅ 后端启动: `java -jar target/portal-0.1.0-SNAPSHOT.jar` → 端口 8080，1.3 秒启动
4. ✅ 后端健康检查: `curl localhost:8080/api/v1/health` → `{"code":0,"message":"success","data":"OSLPay Merchant Portal Backend is running"}`
5. ✅ 后端构建: `./mvnw clean package` → BUILD SUCCESS
6. ✅ 后端测试: `./mvnw test` → 1 test passed（HealthControllerTest）
7. ✅ CORS preflight: OPTIONS 请求返回 `Access-Control-Allow-Origin: http://localhost:3000`
8. ⏳ 前端启动 + 浏览器访问: 需要人工验证 `pnpm dev` → localhost:3000

## Execution Log

### 2026-03-23 22:15
- 创建 .gitignore（覆盖原有，增加 Java/Backend 规则）
- 创建 .editorconfig

### 2026-03-23 22:16
- `pnpm create next-app` 初始化前端项目（Next.js 16.2.1 + React 19.2.4）
- 安装 Radix UI（dialog/dropdown-menu/select/tabs/tooltip）+ Heroicons
- 安装 Vitest + @testing-library/react + jsdom

### 2026-03-23 22:18
- 创建目录结构: components/ui、hooks、lib、providers、services、i18n/locales
- 重写 globals.css: 写入全部 Design Tokens（CSS Variables）+ Tailwind V4 @theme inline
- 重写 layout.tsx: 移除 Google Fonts（Geist），使用系统字体栈
- 重写 page.tsx: 简洁首页，使用 CSS Variables 验证 Design Tokens
- 创建 vitest.config.ts + test-setup.ts + page.test.tsx
- 创建 i18n 占位文件 en.js/zh.js
- `pnpm test` → 1 passed ✅
- `pnpm build` → SUCCESS ✅

### 2026-03-23 22:22
- 创建 backend/pom.xml（Spring Boot 3.5.7, JDK 25）
- 创建 Java 包结构（14 个子包）
- 实现 PortalApplication.java（@SpringBootApplication）
- 实现 Result.java / PageResult.java（统一响应包装）
- 实现 BizException.java / GlobalExceptionHandler.java（全局异常处理）
- 实现 HealthController.java（GET /api/v1/health）
- 实现 CorsConfig.java（允许 localhost:3000 跨域）
- 配置 application.yml（端口 8080，DB/Redis 占位，排除 DataSource 自动配置）
- 修复: Lombok annotation processor 未配置导致编译失败 → 在 pom.xml 添加 maven-compiler-plugin annotationProcessorPaths
- 修复: HealthController 使用 Result.ok("ok", data) 导致 message 不一致 → 改为 Result.ok(data)
- 安装 Maven Wrapper（./mvnw）
- `./mvnw clean compile` → BUILD SUCCESS ✅
- `./mvnw test` → 1 test passed ✅
- `./mvnw clean package` → BUILD SUCCESS ✅

### 2026-03-23 22:30
- 启动后端 `java -jar target/portal-0.1.0-SNAPSHOT.jar` → 1.3 秒启动成功
- Health check: `{"code":0,"message":"success","data":"OSLPay Merchant Portal Backend is running"}` ✅
- CORS preflight: Access-Control-Allow-Origin: http://localhost:3000 ✅
- CORS GET: Access-Control-Allow-Origin + Allow-Credentials 正确 ✅
- 注意: 本机有 Privoxy 代理，curl 需要 `--noproxy '*'` 绕过

### 2026-03-23 22:43 (Review feedback)
- 添加 spring-boot-starter-security + spring-security-test 依赖到 pom.xml
- 创建 SecurityConfig.java: CSRF 禁用、无状态 Session、当前 permitAll（Task-002 细化）
- 删除 frontend/CLAUDE.md（create-next-app 自动生成，避免与根目录混淆）
- 保留 frontend/AGENTS.md（Next.js 16 breaking changes 提醒，有价值）
- 创建 README.md: 项目介绍、技术栈、启动方式、API 约定、文档索引
- `./mvnw clean test` → BUILD SUCCESS, 1 test passed ✅

## Next Step
Task-002: 商户注册（前端注册页 + 后端注册 API + 邮箱验证）
