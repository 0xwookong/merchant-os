# Task-008a: 入驻申请 — 表单与草稿（沙箱流程）

## Status: Done

## PRD Reference
docs/prd/03-merchant-onboarding.md — 全文

## Scope
- 后端: POST /api/v1/onboarding/save-draft（保存草稿）+ GET /api/v1/onboarding/current（获取当前申请）
- 后端: t_onboarding_application 表
- 前端: `(portal)/business/onboarding/page.tsx`（沙箱 3 步：公司信息 → 业务信息 → 确认提交）
- 前端: 草稿自动保存（点击下一步时）+ 草稿恢复（页面加载时）
- 角色: ADMIN + BUSINESS

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试
1. POST /api/v1/onboarding/save-draft → 保存草稿，状态 DRAFT，返回 applicationId
2. GET /api/v1/onboarding/current → 返回当前商户的最新申请（含草稿数据 + 当前步骤）
3. 无申请时 GET /api/v1/onboarding/current → 返回空（kybStatus 提示）
4. 保存草稿后再次保存 → 更新同一条记录（不创建新记录）
5. 提交申请（save-draft with status=SUBMITTED）→ 状态变为 SUBMITTED
6. 已提交后不能再保存草稿 → HTTP 400
7. 前端页面加载时自动恢复草稿内容和步骤
8. 前端点击"下一步"自动保存草稿

### 安全测试
9. 未认证 → HTTP 403
10. 其他商户的申请不可访问（merchantId 从 JWT 获取）
11. 字段 @Size 限制

### 安全检查清单
- [x] 认证: 两个端点均需 JWT
- [x] 频率限制: save-draft 10/min
- [x] 信息泄漏: N/A
- [x] 输入校验: @Size(max) 全字段
- [x] 租户隔离: merchantId 从 JWT
- [x] 审计日志: ONBOARDING_SUBMIT 事件
- [x] HTTP 状态码: 400 状态不允许
- [x] PII 脱敏: 联系信息在审计日志脱敏

## Development Plan

### 数据库
- [x] 创建 t_onboarding_application 表（merchant_id, status, current_step, company_name, company_address, contact_name, contact_phone, contact_email, business_type, monthly_volume, supported_fiat, supported_crypto, business_desc, created_at, updated_at）

### 后端
- [x] 创建 OnboardingApplication 实体 + Mapper
- [x] 创建 OnboardingSaveDraftRequest DTO + OnboardingResponse DTO
- [x] 创建 OnboardingService + impl（saveDraft, getCurrent）
- [x] 创建 OnboardingController（POST /save-draft, GET /current）
- [x] RateLimitFilter 新增 save-draft 10/min
- [x] 后端测试 (8 tests)

### 前端
- [x] 创建 onboardingService.ts
- [x] 创建 `(portal)/business/onboarding/page.tsx`: 3 步表单 + 草稿保存/恢复 + 状态标签 + CheckboxGroup

## Execution Log

### 2026-03-24 15:30
- 创建 t_onboarding_application 表（dev + test）+ 更新 init.sql
- 创建 OnboardingApplication 实体 + Mapper
- 创建 OnboardingSaveDraftRequest（草稿+提交共用，submit 标志区分）+ OnboardingResponse
- 创建 OnboardingService: getCurrent（加载最新申请）+ saveDraft（upsert + 提交时必填校验）
- 创建 OnboardingController (GET /current + POST /save-draft)
- RateLimitFilter: save-draft 10/min
- OnboardingApiTest: 8 tests（无申请/保存草稿/更新草稿/恢复草稿/提交/缺字段提交/已提交锁定/未认证）
- `./mvnw test` → 67 tests passed ✅

### 2026-03-24 15:37
- 创建 onboardingService.ts
- 创建 onboarding/page.tsx: 3步表单 + CheckboxGroup(法币/加密货币多选) + 草稿自动保存(下一步时) + 草稿恢复(页面加载时) + 状态标签(草稿/已拒绝) + 提交后状态页
- `pnpm test` → 34 tests passed, `pnpm build` → SUCCESS ✅

## Next Step
Task-008b: 入驻申请 — 文件上传 + 状态追踪（生产流程）
