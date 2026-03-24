# Task-007a: KYB 引导认证 — 状态检查 + 公司信息 + 法人信息表单

## Status: Done

## PRD Reference
docs/prd/02-registration-kyb.md — 第 4 节「KYB 引导认证」

## Scope
- 后端: GET /api/v1/kyb/status（查询当前商户 KYB 状态）+ POST /api/v1/kyb/submit（提交 KYB 信息）
- 后端: 数据库新增 t_kyb_application 表（存储 KYB 申请数据）
- 前端: `(portal)/kyb/page.tsx`（多步表单：公司信息 → 法人信息 → 确认提交）
- 前端: Portal 布局中检测 KYB 状态，未完成时显示引导提示

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试
1. GET /api/v1/kyb/status → 返回当前商户的 KYB 状态（NOT_STARTED / PENDING / APPROVED / REJECTED）
2. POST /api/v1/kyb/submit 提交合法的公司信息 + 法人信息 → HTTP 200，merchant.kyb_status 变为 PENDING
3. KYB 状态为 PENDING 时再次提交 → HTTP 400 "已提交审核，请等待"
4. KYB 状态为 APPROVED 时提交 → HTTP 400 "已通过认证"
5. KYB 状态为 REJECTED 时提交 → HTTP 200（允许重新提交）
6. 前端 KYB 页面展示多步表单：步骤1 公司信息 → 步骤2 法人信息 → 步骤3 确认提交
7. 前端 Portal 布局 KYB 未完成时顶部显示引导横幅

### 安全测试
8. GET /api/v1/kyb/status 未认证 → HTTP 403
9. POST /api/v1/kyb/submit 未认证 → HTTP 403
10. 请求中的 merchantId 从 JWT 获取，不从请求参数获取（防止跨租户提交）
11. 提交数据字段有 @Size 限制

### 安全检查清单
- [x] 认证: 两个端点均需 JWT 认证
- [x] 频率限制: submit 加入限流（5/h）
- [x] 信息泄漏: N/A
- [x] 输入校验: 所有字段 @NotBlank + @Size(max)
- [x] 租户隔离: merchantId 从 JWT 获取
- [x] 审计日志: KYB_SUBMIT 事件
- [x] HTTP 状态码: 400 状态不允许, 403 未认证
- [x] PII 脱敏: 法人信息在审计日志中脱敏

## Development Plan

### 数据库
- [x] 创建 t_kyb_application 表（merchant_id, company_reg_country, company_reg_number, business_license_no, company_type, legal_rep_name, legal_rep_nationality, legal_rep_id_type, legal_rep_id_number, legal_rep_share_pct, status, reject_reason, created_at, updated_at）

### 后端
- [x] 创建 KybApplication 实体 + KybApplicationMapper
- [x] 创建 KybSubmitRequest DTO（含公司信息 + 法人信息字段，@Valid）
- [x] 创建 KybStatusResponse DTO
- [x] 创建 KybService + KybServiceImpl（getStatus, submit）
- [x] 创建 KybController（GET /status, POST /submit）
- [x] RateLimitFilter 新增 /api/v1/kyb/submit 限流
- [x] 后端测试

### 前端
- [x] 创建 `(portal)/kyb/page.tsx`: 多步表单（3 步）+ 状态展示（APPROVED/PENDING/REJECTED）
- [x] 创建 `components/layout/kyb-banner.tsx`: KYB 未完成时顶部引导横幅
- [x] 更新 Portal 布局: 集成 KybBanner

## Execution Log

### 2026-03-24 15:10
- 创建 t_kyb_application 表（dev + test 数据库）
- 更新 init.sql
- 创建 KybApplication 实体 + KybApplicationMapper
- 创建 KybSubmitRequest DTO（@NotBlank + @Size 全字段校验）+ KybStatusResponse DTO
- 创建 KybService + KybServiceImpl（getStatus + submit，状态流转校验）
- 创建 KybController（GET /status + POST /submit，@AuthenticationPrincipal 获取用户）
- RateLimitFilter 新增 /api/v1/kyb/submit 限流 5/h
- KybApiTest: 6 个测试（状态查询、提交成功、重复提交、未认证、缺失字段）
- `./mvnw test` → 59 tests passed ✅

### 2026-03-24 15:18
- 创建 kybService.ts（getStatus + submit）
- 创建 (portal)/kyb/page.tsx: 3 步多步表单（公司信息→法人信息→确认提交）+ 状态页（APPROVED/PENDING/REJECTED）
- 创建 KybBanner: KYB 未完成时顶部黄色引导横幅（NOT_STARTED/REJECTED 显示，KYB 页面不显示）
- 更新 portal layout: 集成 KybBanner
- `pnpm test` → 34 tests passed, `pnpm build` → SUCCESS ✅

## Next Step
Task-007b: KYB 文件上传 + 状态追踪
