# Task-008b: KYB 状态完善 + 入驻申请门控

## Status: Done

## PRD Reference
docs/prd/02-registration-kyb.md — §4 KYB 引导认证
docs/prd/03-merchant-onboarding.md — §7 业务规则

## Scope
- 后端: KybService 沙箱环境自动审批
- 前端: KYB 已通过页面增加"联系客服更新"提示
- 前端: 侧边栏入驻申请门控（KYB 未通过时禁用）
- 新端点: 0，新页面: 0

## Test Cases (TDD)

### 功能测试
1. 沙箱环境提交 KYB → merchant.kyb_status 直接变为 APPROVED（不是 PENDING）
2. 生产环境提交 KYB → merchant.kyb_status 变为 PENDING（等待人工审核）
3. KYB 已通过页面 → 显示公司信息 + "如需更新请联系客服"提示
4. KYB 未通过时 → 侧边栏"入驻申请"灰色禁用，点击提示"请先完成 KYB 认证"
5. KYB 已通过时 → 侧边栏"入驻申请"正常可点击

### 安全检查清单
- [x] 认证: 复用已有 KYB 端点
- [x] 频率限制: 复用已有
- [x] 租户隔离: EnvironmentContext 从请求头获取
- [x] 审计: 复用已有

## Development Plan
- [x] 后端: KybServiceImpl.submit 读取 EnvironmentContext，沙箱→APPROVED，生产→PENDING
- [x] 后端: KybStatusResponse 增加 companyRegCountry/companyRegNumber/companyType/legalRepName
- [x] 后端测试: 沙箱自动审批 + 生产 PENDING + 已审批后拒绝重复提交 (+2 tests)
- [x] 前端: KYB 已通过页面 → 展示认证信息 + "联系客服更新"蓝色提示
- [x] 前端: 侧边栏入驻申请门控 → KYB 未通过时灰色禁用 + title 提示
- [x] 前端: KYB 提交后自动 reload 状态（沙箱直接显示已通过）

## Execution Log

### 2026-03-24 16:05
- KybServiceImpl: 读取 EnvironmentContext.isSandbox()，沙箱提交直接 APPROVED
- KybStatusResponse: 新增 companyRegCountry/companyRegNumber/companyType/legalRepName
- KybServiceImpl.getStatus: APPROVED 时返回公司信息
- KybApiTest: 新增沙箱自动审批测试 + 生产PENDING测试 + 已审批后拒绝重复提交
- `./mvnw test` → 69 tests passed ✅
- KYB 页面 APPROVED 状态: 展示认证信息卡片 + "联系客服更新"提示
- KYB 提交后 reload status（沙箱自动审批 → 直接显示已通过）
- 侧边栏: MenuItemComponent 新增 isDisabled + disabledTooltip 支持
- Sidebar: kybService.getStatus 获取 KYB 状态，onboarding 菜单门控
- `pnpm test` → 34 tests passed, `pnpm build` → SUCCESS ✅

## Next Step
Task-009: 入驻申请 - 提交与状态追踪
