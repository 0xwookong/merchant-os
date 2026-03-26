# Task-028: 仪表盘增强 — 交易趋势图 + 支付方式分布

## Status: Verifying

## PRD Reference
docs/prd/04-dashboard-orders.md — Part A §A5-A7

## Scope
- 前端: 更新 `/dashboard` 页面，新增趋势图、支付方式分布
- 后端: 新增 2 个 API 端点（trend + payment-methods），mock 数据
- 依赖: 前端新增 Recharts 图表库

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试 — 后端
1. GET /dashboard/trend?range=7d → 返回 points 数组，每个 point 含 time/amount/orderCount，granularity=day
2. GET /dashboard/trend?range=today → granularity=hour，points 按小时分布
3. GET /dashboard/trend?range=invalid → 默认 7d
4. GET /dashboard/payment-methods?range=7d → 返回 methods 数组，含 CARD/GOOGLEPAY/APPLEPAY，percentage 合计 100%
5. GET /dashboard/payment-methods 无 range 参数 → 默认 7d
6. 未认证请求 → 401

### 功能测试 — 前端
1. 仪表盘页面渲染趋势图区域（标题 "交易趋势"）
2. 仪表盘页面渲染支付方式分布区域（标题 "支付方式分布"）
3. 切换时间范围后，三个模块（指标卡片、趋势图、分布图）均触发数据刷新
4. Loading 状态显示骨架屏
5. 空数据状态显示 "暂无数据"

### 安全检查清单
- [x] 认证: 复用现有 DashboardController 认证机制（@AuthenticationPrincipal）
- [x] 租户隔离: merchantId 从 JWT 获取，不从参数传入
- [x] 输入校验: range 参数白名单校验（normalizeRange）
- [x] HTTP 状态码: 未认证 401（Spring Security 自动处理）

## Development Plan

### 后端
- [x] 1. 新增 DashboardTrendResponse DTO（points 数组 + granularity）
- [x] 2. 新增 DashboardPaymentMethodResponse DTO（methods 数组）
- [x] 3. DashboardService 接口新增 getTrend() + getPaymentMethods()
- [x] 4. DashboardServiceImpl 实现 mock 数据（trend 按时间粒度生成，payment-methods 按比例分布）
- [x] 5. DashboardController 新增两个 GET 端点 + @Slf4j 日志
- [x] 6. 后端测试通过（191 tests passed）

### 前端
- [x] 7. 安装 recharts 3.8.1
- [x] 8. dashboardService 新增 getTrend() + getPaymentMethods()
- [x] 9. i18n 新增 16 个 dashboard key（en.js + zh.js）
- [x] 10. Dashboard 页面重构：指标卡片 + 趋势面积图 + 支付方式环形图/明细表
- [ ] 11. 自定义日期范围选择器（延后到下个迭代）
- [x] 12. 前端测试更新（6 个测试用例）
- [x] 13. pnpm build + pnpm test 全量验证（16 files, 74 tests passed）

## Execution Log

### 2026-03-26 08:00
- 后端: 新增 DashboardTrendResponse + DashboardPaymentMethodResponse DTO
- 后端: DashboardService 接口 + ServiceImpl mock 数据（today=hourly, 7d/30d=daily）
- 后端: DashboardController 新增 /trend + /payment-methods 端点
- 后端: 191 tests passed, BUILD SUCCESS
- 前端: 安装 recharts 3.8.1
- 前端: dashboardService 新增 getTrend + getPaymentMethods
- 前端: i18n en.js/zh.js 各新增 16 个 key
- 前端: Dashboard 页面重构 — Promise.all 并行请求三个接口
- 前端: 新建 _components/trend-chart.tsx（ComposedChart + Area + Line 双 Y 轴）
- 前端: 新建 _components/payment-method-distribution.tsx（PieChart 环形图 + 明细表格）
- 前端: 测试更新 — mock recharts, 6 个测试用例
- 前端: pnpm build OK, 74 tests passed

## Next Step
自定义日期范围选择器（A4 PRD）可作为下一个小迭代
