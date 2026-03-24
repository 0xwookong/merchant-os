# Task-004b: 布局壳 + 侧边栏 + 顶部栏 + 角色菜单 + 环境切换

## Status: Done

## PRD Reference
docs/prd/13-menu-navigation.md — 菜单结构与导航
docs/prd/06-developer-console.md — 第 3 节「全局环境切换」
CLAUDE.md — Layout 规格、Design Tokens、Component Patterns (Menu items)

## Scope
- 前端: Sidebar 组件、TopBar 组件、EnvironmentProvider、菜单配置（角色过滤）
- 后端: 无新端点
- 新增页面: 0（修改 (portal)/layout.tsx）

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试
1. ADMIN 角色 → 看到全部菜单（快速开始、仪表盘、业务管理、开发者套件）
2. BUSINESS 角色 → 只看到快速开始、仪表盘、业务管理（入驻申请）
3. TECH 角色 → 只看到快速开始、开发者套件全部子菜单
4. 点击含子菜单的一级菜单 → 展开/收起子菜单列表
5. 当前路径匹配子菜单 → 父菜单自动展开，子菜单高亮
6. 激活菜单项样式：黑色背景 + 白色文字
7. 环境切换按钮点击 → 在生产/沙箱间切换，顶部栏显示当前环境标识
8. 顶部栏显示当前用户邮箱和公司名
9. 顶部栏登出按钮 → 调用 auth.logout()

### 安全测试
1. 菜单过滤基于服务端返回的 role（JWT claims），不依赖前端硬编码判断
2. EnvironmentProvider 状态变更不触发重新认证

### 安全检查清单
- [x] 认证: 复用 AuthProvider（(portal)/layout.tsx 已有守卫）
- [x] 频率限制: N/A（纯前端组件）
- [x] 信息泄漏: N/A
- [x] 输入校验: N/A
- [x] 租户隔离: 菜单基于 JWT role 过滤
- [x] 审计日志: 登出复用已有审计
- [x] HTTP 状态码: N/A
- [x] PII 脱敏: 顶部栏显示邮箱（用户自己的数据，非泄漏）

## Development Plan
- [ ] 创建 `src/providers/environment-provider.tsx`: EnvironmentProvider + useEnvironment hook
- [ ] 创建 `src/lib/menu-config.ts`: 菜单配置数据（items, roles, icons, paths）
- [ ] 创建 `src/components/layout/sidebar.tsx`: 侧边栏组件（Logo + 菜单列表 + 角色过滤 + 展开收起 + 激活高亮）
- [ ] 创建 `src/components/layout/topbar.tsx`: 顶部栏组件（环境切换 + 用户信息 + 登出）
- [x] 更新 `src/app/(portal)/layout.tsx`: 集成 Sidebar + TopBar + EnvironmentProvider
- [x] 创建测试: menu-config 角色过滤测试 (10 tests)

## Execution Log

### 2026-03-24 09:40
- 创建 EnvironmentProvider: production/sandbox 状态 + toggleEnvironment
- 创建 menu-config.ts: 完整菜单定义（4 个一级 + 9 个二级）+ filterMenuByRole 纯函数
- 创建 Sidebar: Logo 区(黑底) + 菜单列表(角色过滤 + 展开收起 + 路径匹配高亮 + 荧光绿 active icon)
- 创建 TopBar: 环境切换按钮(红/绿标识) + 公司名+邮箱 + 登出按钮
- 更新 (portal)/layout.tsx: 集成 Sidebar + TopBar + EnvironmentProvider + 侧边栏固定布局
- menu-config.test.ts: 10 个角色过滤测试（ADMIN/BUSINESS/TECH 各角色菜单可见性）
- `pnpm test` → 24 tests passed ✅
- `pnpm build` → SUCCESS ✅

## Next Step
Task-005: 全局环境切换联动（前端 X-Environment 请求头 + 后端拦截器）
