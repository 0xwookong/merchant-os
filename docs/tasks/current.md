# Task-029: 商户设置页

## Status: Done

## 实现内容

### 后端
- `AccountController` — `GET /api/v1/account/profile` + `PUT /api/v1/account/profile`
- `ProfileResponse` DTO — companyName, contactName, email, role, createdAt
- `UpdateProfileRequest` DTO — contactName (NotBlank, max 100)
- 审计日志 `PROFILE_UPDATED`

### 前端
- `/settings/page.tsx` — 账户设置页面
  - 公司信息卡片（只读）
  - 个人信息卡片（联系人可内联编辑，邮箱/角色/注册时间只读）
  - 编辑模式：输入框 + 保存/取消按钮
  - Toast 成功/失败通知
- `accountService.ts` — getProfile + updateProfile
- 顶栏用户菜单增加「Account Settings」入口（Cog6ToothIcon）
- i18n 新增 14 个翻译 key（en + zh）

## Verification
- `pnpm build` ✅
- `mvn compile` ✅

## Next Step
Task-030: 通知系统
