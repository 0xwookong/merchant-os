# Task-010: 仪表盘 — 指标概览

## Status: Done

## PRD Reference
docs/prd/04-dashboard-orders.md — §2 关键指标概览、§3 时间范围筛选

## Scope
- 后端: GET /api/v1/dashboard/metrics（返回 4 个指标，当前用 mock 数据，后续接入真实数据源）
- 前端: `(portal)/dashboard/page.tsx`（4 个指标卡片 + 时间范围筛选）
- 角色: ADMIN + BUSINESS
- 新端点: 1，新页面: 1

## Test Cases (TDD)

### 功能测试
1. GET /api/v1/dashboard/metrics → 返回 4 个指标（totalAmount, successRate, orderCount, activeUsers）+ 环比变化率
2. GET /api/v1/dashboard/metrics?range=7d → 按时间范围筛选
3. 前端展示 4 个指标卡片，hover 时 shadow 升起
4. 环比上升显示绿色箭头，下降显示红色箭头
5. 时间范围切换（今日/7天/30天）触发数据刷新

### 安全测试
6. 未认证 → HTTP 403
7. merchantId 从 JWT 获取（租户隔离）

### 安全检查清单
- [x] 认证: 需要 JWT
- [x] 频率限制: N/A（读取接口，已有全局限制）
- [x] 信息泄漏: N/A
- [x] 输入校验: range 参数白名单（today/7d/30d）
- [x] 租户隔离: merchantId 从 JWT
- [x] 审计日志: N/A（只读）
- [x] HTTP 状态码: 200 / 403
- [x] PII 脱敏: N/A

## Development Plan
- [x] 后端: DashboardMetricsResponse DTO（MetricCard 含 key/label/value/unit/changeRate）
- [x] 后端: DashboardService + impl（mock 数据按 range 变化）
- [x] 后端: DashboardController GET /api/v1/dashboard/metrics
- [x] 后端测试: 5 tests（默认range、today、30d、非法降级、未认证）
- [x] 前端: dashboardService.ts
- [x] 前端: dashboard/page.tsx — 4 个 MetricCard + range Tab + loading skeleton + 订单占位
- [x] 前端测试: 2 tests（标题、时间选择器）

## Execution Log

### 2026-03-24 16:40
- DashboardMetricsResponse: metrics[] + range，MetricCard: key/label/value/unit/changeRate
- DashboardServiceImpl: mock 数据按 today/7d/30d 返回不同数值，非法 range 降级 7d
- DashboardController: GET /metrics，@AuthenticationPrincipal 租户隔离
- DashboardApiTest: 5 tests
- `./mvnw test` → 77 tests passed ✅
- dashboardService.ts + dashboard/page.tsx: 4 MetricCard（图标+数值+环比箭头）+ range 切换 Tab + loading skeleton
- page.test.tsx: 2 tests
- `pnpm test` → 36 tests passed, `pnpm build` → SUCCESS ✅

## Next Step
Task-011: 仪表盘 — 订单管理
