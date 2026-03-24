# Task-004a: AuthProvider + 路由保护

## Status: Done

## PRD Reference
docs/prd/01-user-roles.md — 权限控制规则
docs/prd/02-registration-kyb.md — 第 3.2 节「登录流程」
CLAUDE.md — 认证与鉴权（JWT Claims, Access Token 内存存储, Refresh Token httpOnly cookie）

## Scope
- 前端: AuthProvider（React Context）、路由保护 HOC/middleware、页面刷新 token 恢复
- 后端: 无新增端点（复用 POST /api/v1/auth/refresh）

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试
1. AuthProvider 初始化时调用 /api/v1/auth/refresh → 如果有 httpOnly cookie 则恢复登录态，获取用户信息
2. AuthProvider 初始化时 refresh 失败（无 cookie）→ 状态为未登录，isAuthenticated=false
3. login() 调用后 → isAuthenticated=true，user 对象包含 userId、merchantId、email、role、companyName
4. logout() 调用后 → isAuthenticated=false，user=null，access token 清除，调用后端 /api/v1/auth/logout
5. 已登录用户访问 /login → 自动重定向到 /（不允许已登录用户访问认证页面）
6. 未登录用户访问 /(portal) 下的页面 → 自动重定向到 /login

### 安全测试
1. Access Token 仅存在于 React Context 内存中 → 不使用 localStorage/sessionStorage
2. 页面刷新后 Access Token 丢失 → 通过 refresh 接口恢复（httpOnly cookie 自动携带）
3. Refresh 失败时 → 清除所有状态，不保留过期的用户信息

### 安全检查清单
- [x] 认证: AuthProvider 管理认证状态，(portal) 路由组需要认证
- [x] 频率限制: 复用已有的 /api/v1/auth/refresh 限流（20/min）
- [x] 信息泄漏: N/A（前端 Provider，不暴露新端点）
- [x] 输入校验: N/A
- [x] 租户隔离: user context 包含 merchantId
- [x] 审计日志: 复用后端 refresh/logout 审计
- [x] HTTP 状态码: N/A
- [x] PII 脱敏: 前端不在 console.log 中输出用户信息

## Development Plan
- [x] 创建 `src/providers/auth-provider.tsx`: AuthContext + AuthProvider
- [x] 更新 `src/services/authService.ts`: 新增 logout() 方法
- [x] 创建 `src/app/(portal)/layout.tsx`: 包裹 AuthProvider，未登录时重定向到 /login
- [x] 更新 `src/app/(auth)/layout.tsx`: 已登录时重定向到 /
- [x] 更新 `src/app/page.tsx`: 根路径重定向到 /getting-started
- [x] 创建 `src/app/(portal)/getting-started/page.tsx`: 验证 AuthProvider 工作的占位页
- [x] 创建前端测试: AuthProvider (4 tests) + 根路径重定向 (1 test)

## Execution Log

### 2026-03-24 09:30
- 创建 AuthProvider: user/isAuthenticated/isLoading 状态, 初始化 refresh 恢复, login/logout 方法
- authService.ts 新增 logout()
- (portal)/layout.tsx: AuthProvider + PortalGuard（未登录→/login, loading spinner）
- (auth)/layout.tsx: 已登录→/ 重定向，检测 refresh 成功则跳转
- page.tsx: 根路径 redirect("/getting-started")
- (portal)/getting-started/page.tsx: 显示用户信息占位页
- auth-provider.test.tsx: 4 个测试（refresh 成功/失败, logout, useAuth 外部使用报错）
- page.test.tsx: 更新为重定向测试
- 修复: 测试间 DOM 残留 → 添加 afterEach(cleanup)
- `pnpm test` → 14 tests passed ✅
- `pnpm build` → SUCCESS ✅

## Next Step
Task-004b: 布局壳 + 侧边栏 + 顶部栏 + 角色菜单 + 环境切换
