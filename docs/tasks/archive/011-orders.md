# Task-011a: 仪表盘 — 订单列表 + 筛选 + 分页

## Status: Done

## PRD Reference
docs/prd/04-dashboard-orders.md — §4 订单列表、§7 订单状态

## Scope
- 后端: GET /api/v1/orders（分页 + 状态/支付方式筛选）+ t_order 表（mock 种子数据）
- 前端: dashboard 页面扩展 — 订单列表替换占位区
- 新端点: 1，新页面: 0（扩展 dashboard）

注: 订单详情 + CSV 导出拆为 Task-011b

## Test Cases (TDD)

### 功能测试
1. GET /api/v1/orders → 返回分页订单列表（list + total + page + pageSize）
2. GET /api/v1/orders?status=COMPLETED → 按状态筛选
3. GET /api/v1/orders?paymentMethod=CARD → 按支付方式筛选
4. GET /api/v1/orders?page=2&pageSize=20 → 分页
5. 前端订单列表展示 6 列（订单号、金额、加密货币、支付方式、状态、时间）
6. 前端状态标签颜色（CREATED灰/PROCESSING蓝/SUCCESSED黄/COMPLETED绿/FAILED红）
7. 前端筛选器联动数据刷新

### 安全测试
8. 未认证 → HTTP 403
9. 只返回当前商户的订单（merchantId 从 JWT）

### 安全检查清单
- [x] 认证: 需要 JWT
- [x] 频率限制: N/A（读取）
- [x] 输入校验: status/paymentMethod 白名单，page/pageSize 正整数
- [x] 租户隔离: merchantId 从 JWT
- [x] HTTP 状态码: 200 / 403

## Development Plan
- [x] 创建 t_order 表 + mock 种子数据 10 条（dev + test）
- [x] 后端: Order 实体 + OrderMapper + OrderListResponse + MyBatis-Plus 分页插件
- [x] 后端: OrderService + impl（分页 + status/paymentMethod 白名单筛选）
- [x] 后端: OrderController GET /api/v1/orders
- [x] 后端测试: 5 tests + 修复全部测试 FK 清理顺序
- [x] 前端: orderService.ts
- [x] 前端: dashboard 订单列表（状态/支付方式筛选 + 分页 + StatusBadge + 空状态）

## Execution Log

### 2026-03-24 17:00
- t_order 表（dev + test）+ 10 条 mock 种子数据（5 种状态 + 3 种支付方式）
- Order 实体 + OrderMapper
- MyBatisPlusConfig 新增 PaginationInnerInterceptor + mybatis-plus-jsqlparser 依赖
- OrderService: 分页查询 + status/paymentMethod 白名单筛选
- OrderController: GET /api/v1/orders
- 修复: 全部测试类 @BeforeEach 增加 orderMapper.delete(null)（FK 约束清理顺序）
- OrderApiTest: 5 tests（全部/状态筛选/支付方式筛选/分页/未认证）
- `./mvnw test` → 82 tests passed ✅
- orderService.ts + dashboard 订单列表（筛选器 + 分页 + StatusBadge + PaymentBadge + 空状态）
- `pnpm test` → 36 tests passed, `pnpm build` → SUCCESS ✅

## Next Step
Task-011b: 订单详情 + CSV 导出
