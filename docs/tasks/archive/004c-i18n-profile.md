# Task-004c: i18n Provider 接入 + 个人中心入口

## Status: Done

## PRD Reference
CLAUDE.md — i18n Rules (MANDATORY)、i18n Namespace 约定
docs/prd/02-registration-kyb.md — 安全措施（修改密码）

## Scope
- 前端: LanguageProvider + useI18n hook、auth 页面接入 t()、TopBar 用户下拉菜单（个人中心入口）
- 前端: 个人中心弹窗/页面（修改密码）
- 后端: POST /api/v1/auth/change-password（已登录用户修改密码）
- 注: 2FA 绑定为后续独立 Task，当前只预留入口

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试 — i18n
1. LanguageProvider 默认语言为中文 → t("common.save") 返回 "保存"
2. 切换语言为英文 → t("common.save") 返回 "Save"
3. t() 传入不存在的 key → 返回 key 本身作为 fallback
4. t() 支持变量插值 → t("key", { count: 3 }) 正确替换 "{count}"

### 功能测试 — 个人中心
5. TopBar 用户区域点击 → 展开下拉菜单（修改密码、语言切换、登出）
6. 点击"修改密码" → 弹出修改密码对话框
7. 修改密码：输入旧密码 + 新密码 + 确认密码 → 调用后端 API → 成功提示
8. 修改密码后旧密码失效 → 重新登录用新密码

### 安全测试 — 修改密码
9. 未认证调用 POST /api/v1/auth/change-password → HTTP 401
10. 旧密码错误 → HTTP 401 "旧密码错误"
11. 新密码不符合规则 → HTTP 400
12. 新密码与旧密码相同 → HTTP 400 "新密码不能与旧密码相同"
13. 修改密码后 refresh token 被撤销（强制重新登录）
14. 修改密码记录审计日志

### 安全检查清单
- [x] 认证: change-password 需要 JWT 认证
- [x] 频率限制: change-password 加入限流（5/h per user）
- [x] 信息泄漏: 旧密码错误不泄漏额外信息
- [x] 输入校验: 新密码 @Size(min=8, max=72)，旧密码 @Size(max=72)
- [x] 租户隔离: 从 JWT 获取 userId，只能改自己的密码
- [x] 审计日志: 记录 PASSWORD_CHANGE 事件
- [x] HTTP 状态码: 401 旧密码错误，400 规则不满足
- [x] PII 脱敏: 审计日志邮箱掩码

## Development Plan

### i18n 基础设施
- [x] 创建 `src/providers/language-provider.tsx`: LanguageProvider + useI18n hook (t 函数 + locale 切换)
- [x] 更新 `src/app/layout.tsx`: 包裹 LanguageProvider

### 后端 — 修改密码
- [x] 创建 `ChangePasswordRequest` DTO (oldPassword, newPassword, confirmPassword)
- [x] `AuthService.changePassword()`: 验证旧密码 → 校验新密码规则 → BCrypt 加密 → 更新 → 撤销 refresh token
- [x] `AuthController` 新增 `POST /api/v1/auth/change-password` (需要认证)
- [x] SecurityConfig 中 `/api/v1/auth/change-password` 需要认证（不在 permitAll 列表）
- [x] RateLimitFilter 新增 change-password 限流规则
- [x] 后端测试

### 前端 — 个人中心
- [x] 重构 TopBar 用户区域: 改为 Radix DropdownMenu（修改密码、语言切换、登出）
- [x] 创建修改密码对话框组件 (Radix Dialog)
- [x] 创建 `src/services/authService.ts` 新增 changePassword()
- [x] 前端测试

## Execution Log

### 2026-03-24 10:50
- 创建 LanguageProvider + useI18n hook (t 函数 + locale 切换 + 变量插值)
- 创建 RootProviders 客户端包装（LanguageProvider）
- 更新 root layout.tsx: 包裹 RootProviders，html lang="zh"
- 创建 ChangePasswordRequest DTO (@Size min=8 max=72)
- AuthService + AuthServiceImpl.changePassword(): 验证旧密码 → 新旧不同检查 → 密码规则 → BCrypt → 撤销 refresh token
- AuthController 新增 POST /api/v1/auth/change-password
- SecurityConfig: /api/v1/auth/change-password 需要 authenticated（在 permitAll 之前匹配）
- RateLimitFilter: change-password 5/h 限流
- AuditEventType 新增 PASSWORD_CHANGE
- AuthChangePasswordApiTest: 7 tests (正常修改 + 审计日志 + 未认证 + 旧密码错误 + 新旧相同 + 弱密码 + 不一致)
- `./mvnw test` → 48 tests passed ✅

### 2026-03-24 10:58
- 创建 ChangePasswordDialog (Radix Dialog): 旧密码 + 新密码 + 确认 + 前端校验
- 重写 TopBar: Radix DropdownMenu（修改密码、安全设置(disabled)、语言切换、退出登录）
- authService.ts 新增 changePassword()
- language-provider.test.tsx: 4 tests (默认中文、切换英文、fallback、插值)
- `pnpm test` → 28 tests passed ✅
- `pnpm build` → SUCCESS ✅

## Next Step
Task-005: 全局环境切换联动（前端 X-Environment 请求头 + 后端拦截器）
