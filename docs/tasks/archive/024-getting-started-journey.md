# Task-024: 快速开始页面重构 — 动态 Onboarding Journey

## Status: Verifying

## PRD Reference
docs/prd/13-menu-navigation.md + docs/prd/02-registration-kyb.md + docs/prd/03-merchant-onboarding.md

## Scope
- 后端: 新增 `GET /api/v1/merchant/progress` 聚合进度接口
- 前端: Getting Started 页面重构为动态进度面板 + 保留开发者快速指南
- i18n: 新增 onboarding journey 相关翻译 key

## 设计思路

### 页面结构（角色差异化）

**ADMIN 视角（完整 5 步流程）：**
```
┌──────────────────────────────────────────────────────────┐
│  Welcome to OSL Pay!                                     │
│  Complete the following steps to start accepting payments │
│                                                          │
│  ✅ Step 1: 创建账户              已完成                  │
│  🔵 Step 2: KYB 认证              进行中 → [去认证]       │
│  ⬚ Step 3: 提交入驻申请           待解锁                  │
│  ⬚ Step 4: 技术集成               可提前体验              │
│  ⬚ Step 5: 上线运营               待解锁                  │
│                                                          │
│  💡 审核期间可在沙箱环境体验完整流程 [进入沙箱体验]         │
└──────────────────────────────────────────────────────────┘

展开 Step 4 → 显示现有的开发者快速开始内容（WebSDK/OpenAPI）
```

**TECH 视角：**
- 只显示 Step 4（技术集成）的展开内容，即现有的开发者快速指南
- 加上技术集成子任务清单（凭证、签名、Webhook、域名、首笔沙箱交易）

**BUSINESS 视角：**
- 显示 Step 1-3（业务流程）+ Step 5（上线运营）
- 不显示技术集成步骤

### 后端接口设计

```
GET /api/v1/merchant/progress
Response:
{
  "code": 0,
  "data": {
    "accountCreated": true,
    "kybStatus": "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | "NEED_MORE_INFO",
    "onboardingStatus": null | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED",
    "hasCredentials": false,
    "hasWebhooks": false,
    "hasDomains": false,
    "environment": "sandbox" | "production"
  }
}
```

- 聚合 KYB、Onboarding、Credential、Webhook、Domain 状态
- 单次请求获取所有进度信息，避免前端多次调用
- 角色权限: 所有已认证角色可访问

### Step 状态映射逻辑

| Step | 状态条件 | 显示 |
|------|----------|------|
| 1. 创建账户 | 已登录（恒 true） | ✅ 已完成 |
| 2. KYB 认证 | kybStatus | NOT_STARTED→待开始, PENDING→审核中, APPROVED→✅, REJECTED→需修改 |
| 3. 入驻申请 | onboardingStatus + kybStatus | KYB 未通过→🔒锁定, 否则按 onboarding 状态显示 |
| 4. 技术集成 | hasCredentials/hasWebhooks/hasDomains | 始终可操作（沙箱体验），显示子任务完成数 |
| 5. 上线运营 | KYB+Onboarding 均 APPROVED | 未满足→🔒锁定, 满足→可切换生产环境 |

## Test Cases (TDD: 先写测试，后写实现)

### 后端功能测试
1. 正常获取进度: 已认证用户 → 返回聚合进度数据，HTTP 200
2. KYB 各状态映射: NOT_STARTED/PENDING/APPROVED/REJECTED → 正确反映
3. 无入驻申请: onboardingStatus 为 null
4. 有凭证/Webhook/域名: 对应 boolean 为 true
5. 租户隔离: 只返回当前 merchant 的数据

### 后端安全测试
1. 未认证访问: → 401
2. JWT 过期: → 401
3. 响应不泄漏其他租户信息

### 前端功能测试
1. ADMIN 视角: 渲染全部 5 个步骤
2. TECH 视角: 只渲染技术集成内容
3. BUSINESS 视角: 渲染业务步骤，不含技术集成
4. KYB 未开始: Step 2 显示"开始认证"按钮
5. KYB 审核中: Step 2 显示"审核中"状态
6. KYB 通过: Step 2 显示已完成，Step 3 解锁
7. 沙箱提示: 显示沙箱体验入口

### 安全检查清单
- [x] 认证: 需要 JWT，所有角色可访问
- [x] 租户隔离: 从 SecurityContext 获取 merchantId
- [x] 信息泄漏: 不返回其他租户数据
- [x] 输入校验: GET 请求无输入参数
- [ ] 频率限制: 普通读取接口，标准限制即可
- [ ] 审计日志: 只读接口，不需要审计
- [ ] HTTP 状态码: 401 未认证
- [ ] 日志安全: 不记录 PII

## Development Plan

### 后端
- [x] 1. 创建 `MerchantProgressResponse` DTO
- [x] 2. 创建 `MerchantProgressService` 接口和实现
- [x] 3. 创建 `MerchantProgressController`
- [x] 4. 编写后端集成测试（6 个测试）
- [x] 5. 运行后端测试验证 — 153/153 通过

### 前端
- [x] 6. 新增 `merchantService.getProgress()` 前端 service 方法
- [x] 7. 重构 Getting Started 页面 — 动态 Onboarding Journey 组件
- [x] 8. 保留开发者快速指南作为可折叠展开内容
- [x] 9. 角色差异化渲染逻辑（ADMIN/BUSINESS/TECH）
- [x] 10. i18n — 新增 45+ 翻译 key (en.js + zh.js)
- [x] 11. 编写前端测试（7 个测试）
- [x] 12. 运行 `pnpm build` + `pnpm test` 验证 — 70/70 通过

## Execution Log

### 2026-03-25 12:15
- 后端: 创建 MerchantProgressResponse DTO、MerchantProgressService 接口/实现、MerchantProgressController
- 后端: 聚合 KYB 状态(from t_merchant)、Onboarding 状态(from t_onboarding_application)、凭证/Webhook/域名存在性
- 后端测试: 6 个测试覆盖正常流程、KYB 状态反映、技术集成反映、安全（未认证/租户隔离）
- 前端: 创建 merchantService.ts，重构 getting-started/page.tsx
- 前端: 5 步 Onboarding Journey + 开发者快速指南折叠区 + 技术集成子任务清单
- 前端: ADMIN 看全部 5 步，TECH 只看技术集成+开发者指南，BUSINESS 看业务步骤
- i18n: en.js 和 zh.js 各新增 45+ 个 journey.* 翻译 key
- 前端测试: 7 个测试覆盖页面渲染、步骤显示、锁定状态、沙箱提示
- 全量验证: 后端 153/153，前端 70/70，pnpm build 通过

## Next Step
完成后更新 backlog.md，继续技术债务修复或其他优化任务
