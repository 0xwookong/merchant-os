# Task-005: 全局环境切换联动

## Status: Done

## PRD Reference
docs/prd/06-developer-console.md — 第 3 节「全局环境切换」
CLAUDE.md — 前后端协作约定（X-Environment 请求头）、环境配置

## Scope
- 前端: api.ts 自动附加 X-Environment 请求头，读取 EnvironmentProvider 状态
- 后端: EnvironmentInterceptor 读取 X-Environment 头，注入请求上下文
- 后端: EnvironmentContext 工具类，Service 层获取当前环境
- 新增端点: 0
- 新增页面: 0

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试
1. 前端请求默认附加 X-Environment: sandbox 请求头
2. 前端切换到生产环境后，请求附加 X-Environment: production
3. 后端 EnvironmentInterceptor 解析 X-Environment 头 → 存入 ThreadLocal
4. 后端 EnvironmentContext.current() 返回当前请求的环境值
5. 后端无 X-Environment 头时 → 默认 sandbox（安全默认值）
6. 后端 X-Environment 值非法（非 production/sandbox）→ 默认 sandbox

### 安全测试
7. 环境切换不触发重新认证（纯前端状态 + 请求头传递）
8. 后端 ThreadLocal 在请求结束后清理（防止线程池泄漏）

### 安全检查清单
- [x] 认证: N/A（不新增端点）
- [x] 频率限制: N/A
- [x] 信息泄漏: N/A
- [x] 输入校验: X-Environment 值只接受 production/sandbox，其他值降级为 sandbox
- [x] 租户隔离: 环境隔离是租户隔离的补充维度
- [x] 审计日志: N/A
- [x] HTTP 状态码: N/A
- [x] PII 脱敏: N/A

## Development Plan

### 后端
- [x] 创建 `common/context/EnvironmentContext.java`: ThreadLocal 存储当前环境
- [x] 创建 `config/EnvironmentInterceptor.java`: HandlerInterceptor 解析 X-Environment 头
- [x] 创建 `config/WebMvcConfig.java`: 注册 Interceptor
- [x] 更新 HealthController: 返回当前环境信息（验证用）
- [x] 后端测试: 5 个环境切换测试（无头默认、production、sandbox、非法值降级、请求间隔离）

### 前端
- [x] 创建 `src/lib/environment.ts`: 模块级环境状态
- [x] 更新 EnvironmentProvider: toggleEnvironment 时同步到模块级
- [x] 更新 `src/lib/api.ts`: 每次请求附加 X-Environment 头

## Execution Log

### 2026-03-24 11:05
- 创建 EnvironmentContext (ThreadLocal): set/current/clear, 非法值降级为 sandbox
- 创建 EnvironmentInterceptor: preHandle 解析 X-Environment, afterCompletion 清理 ThreadLocal
- 创建 WebMvcConfig: 注册 interceptor 到 /api/**
- 更新 HealthController: 返回 {status, environment} 用于验证
- 重写 HealthApiTest: 新增 5 个环境切换测试（@Nested 分组）
- `./mvnw test` → 53 tests passed ✅
- 创建 src/lib/environment.ts: 模块级 get/setEnvironment
- 更新 EnvironmentProvider: toggleEnvironment 同步到模块级
- 更新 api.ts: 每次请求附加 X-Environment 头
- `pnpm test` → 28 tests passed, `pnpm build` → SUCCESS ✅

### 2026-03-24 11:15 (Bug fixes from user testing)
- 修复: cookie Secure 标志按 server.ssl.enabled 配置（dev=false/HTTP, prod=true/HTTPS）
  - 根因: Secure=true 导致浏览器在 HTTP localhost 下不发送 refresh_token cookie → 页面刷新丢失会话
  - 同步修复 logout 的 cookie 清除
  - SameSite 也按环境调整: dev=Lax, prod=Strict
- 修复: 测试使用独立数据库 oslpay_portal_test（创建 src/test/resources/application.yml）
  - 根因: 测试 @BeforeEach DELETE 清空了开发数据库
- 修复: 验证链接已消费后再次点击 → 提示"如已验证请直接登录"（更友好）
- 更新测试断言: cookie Secure=false in test, 验证消息文案匹配
- `./mvnw test` → 53 tests passed ✅（dev 数据库未被清空确认）

## Next Step
Task-006: 快速开始页面
