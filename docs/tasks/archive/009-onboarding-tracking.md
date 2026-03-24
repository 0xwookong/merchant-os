# Task-009: 入驻申请 — 提交后状态追踪 + 重新提交

## Status: Done

## PRD Reference
docs/prd/03-merchant-onboarding.md — §5 状态流转、§6 申请进展追踪

## Scope
- 前端: 入驻申请页面增加提交后的状态追踪视图（时间线 + 已填信息只读预览 + 拒绝后重新提交）
- 后端: 沙箱环境提交自动审批（与 KYB 同策略）
- 新端点: 0，新页面: 0（在现有 onboarding page 内扩展）

## Test Cases (TDD)

### 功能测试
1. 沙箱环境提交入驻申请 → 状态直接变为 APPROVED（自动审批）
2. 生产环境提交 → 状态变为 SUBMITTED（等待人工审核）
3. 状态为 SUBMITTED/UNDER_REVIEW → 页面展示时间线 + 已填信息只读预览
4. 状态为 APPROVED → 展示"已通过"绿色状态 + 已填信息
5. 状态为 REJECTED → 展示拒绝原因 + 已填信息 + "重新提交"按钮
6. 点击"重新提交" → 状态回退到 DRAFT + 表单可编辑 + 预填上次数据
7. 沙箱自动审批测试（后端）

### 安全检查清单
- [x] 认证: 复用已有端点
- [x] 频率限制: 复用已有
- [x] 租户隔离: 复用已有
- [x] 审计: 复用已有

## Development Plan
- [x] 后端: OnboardingServiceImpl 沙箱自动审批(APPROVED) + 生产(SUBMITTED)
- [x] 后端: resetToDraft 方法（仅 REJECTED 可重置）
- [x] 后端: OnboardingController POST /api/v1/onboarding/reset
- [x] 后端测试: 沙箱自动审批 + 生产提交 + 已提交锁定 + REJECTED重置 + 非REJECTED重置拒绝
- [x] 前端: 状态追踪视图 — 状态横幅(SUBMITTED/APPROVED/REJECTED) + 时间线 + 信息预览 + 重新提交按钮
- [x] 前端: onboardingService.resetToDraft

## Execution Log

### 2026-03-24 16:25
- OnboardingServiceImpl: 沙箱 EnvironmentContext.isSandbox() → APPROVED，生产 → SUBMITTED
- 新增 resetToDraft: REJECTED → DRAFT + 保留数据
- OnboardingController: POST /api/v1/onboarding/reset
- OnboardingApiTest: +3 tests（沙箱自动审批 + 生产提交 + reset REJECTED + reset 非REJECTED拒绝）
- `./mvnw test` → 72 tests passed ✅

### 2026-03-24 16:31
- onboardingService.ts: 新增 resetToDraft()
- Onboarding page: 非DRAFT状态展示完整追踪视图 — 状态横幅 + TimelineItem 时间线 + 信息只读预览
- REJECTED: 红色横幅 + "重新提交"按钮 → resetToDraft → 回到表单编辑（预填数据）
- APPROVED: 绿色横幅 + 信息展示
- SUBMITTED/UNDER_REVIEW: 蓝色横幅 + 时间线动画
- `pnpm test` → 34 tests passed, `pnpm build` → SUCCESS ✅

## Next Step
Task-010: 仪表盘 — 指标概览
