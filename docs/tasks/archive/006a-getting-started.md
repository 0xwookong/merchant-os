# Task-006a: 快速开始页面（WebSDK + OpenAPI 分步指引）

## Status: Done

## PRD Reference
docs/prd/05-api-doc-engine.md — 第 4 节「快速开始页面」
docs/prd/06-developer-console.md — 第 4 节「沙箱测试指南」（测试卡号、货币网络）

## Scope
- 前端: 重写 `(portal)/getting-started/page.tsx` 为完整的快速开始页面
- 后端: 无新端点
- 新增页面: 0（替换现有占位页）

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试
1. 页面渲染标题"快速开始" + 副标题
2. 默认展示 WebSDK 模式 Tab 选中状态
3. 点击 OpenAPI Tab → 切换到 OpenAPI 模式内容
4. WebSDK 模式展示 4 个步骤（访问测试页、KYC、测试卡号、货币网络）
5. OpenAPI 模式展示 4 个步骤（获取凭证、实现签名、调用 API、配置 Webhook）
6. 测试卡号区域展示 3 种卡（Frictionless、Challenge、失败）
7. 货币网络表格展示限额信息
8. 快速链接卡片（API 文档、签名工具、Webhook 管理）

### 安全检查清单
- [x] 认证: 页面在 (portal) 下，需要登录（已有 AuthProvider 守卫）
- [x] 频率限制: N/A（纯前端页面）
- [x] 信息泄漏: 测试卡号仅在页面展示，非敏感数据
- [x] 输入校验: N/A
- [x] 租户隔离: N/A
- [x] 审计日志: N/A
- [x] HTTP 状态码: N/A
- [x] PII 脱敏: N/A

## Development Plan
- [x] 重写 `(portal)/getting-started/page.tsx`: Tab 切换 + WebSDK 4步 + OpenAPI 4步 + 测试卡号 + 货币网络 + 快速链接 + 技术支持
- [x] 创建测试: 6 个测试（标题、WebSDK 默认、测试卡号、货币限额、快速链接、支持邮箱）

## Execution Log

### 2026-03-24 11:30
- 重写 getting-started/page.tsx: ModeTab 切换（WebSDK/OpenAPI）+ StepCard 分步卡片
- WebSDK 4步: 访问测试页(含环境感知URL)、KYC、测试卡号、货币网络
- OpenAPI 4步: 获取凭证→签名→API调用→Webhook，每步含跳转链接
- 测试卡号表格: 3种卡(Frictionless/Challenge/失败) + 有效期/CVV说明
- 货币网络表格: EUR/USD → USDT/USDC/ETH 限额 + 支持网络列表
- 快速链接: 3个卡片(API文档/签名工具/Webhook管理)
- 技术支持区: support@osl-pay.com
- page.test.tsx: 6个测试
- `pnpm test` → 34 tests passed ✅
- `pnpm build` → SUCCESS ✅

## Next Step
Task-007: KYB 引导认证
