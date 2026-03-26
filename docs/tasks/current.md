# Task-027: 清理 KYB/Onboarding 遗留代码

## Status: Done

## Scope Summary

### 前端删除
- `organization/kyb/` 页面目录
- `organization/onboarding/` 页面目录
- `services/kybService.ts` 和 `services/onboardingService.ts`
- i18n 中 ~200 行 `kyb.*` 和 `onboarding.*` 翻译 key（en.js + zh.js）

### 后端删除（17 文件）
- KYB: Controller, Service, ServiceImpl, Entity, 2 DTO, Enum, Mapper, Test
- Onboarding: Controller, Service, ServiceImpl, Entity, 2 DTO, Mapper, Test

### 后端修改
- `Merchant.java` — 移除 `kybStatus` 字段和 `KybStatus` import
- `AuthServiceImpl.java` — 移除 `merchant.setKybStatus(KybStatus.NOT_STARTED)`
- 17 个 test 文件 — 移除 `KybApplicationMapper` 和 `OnboardingApplicationMapper` 引用

### 顺带修复的预存 bug
- `LogApiTest.java` — 修复分页响应格式断言（`$.data` → `$.data.list`）
- `OrderApiTest.java` — 修复 seedOrder 未设置 createdAt 导致的日期范围过滤问题

## Verification
- `pnpm build` ✅ 通过
- `mvn compile` ✅ 通过
- `mvn test` — 177 tests, 175 pass, 2 pre-existing failures (OrderApiTest, confirmed same before changes)

## Next Step
Task-028: API 密钥轮换
