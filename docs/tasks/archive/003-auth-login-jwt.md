# Task-003: 商户登录 + JWT

## Status: Done

## PRD Reference
docs/prd/02-registration-kyb.md — 第 3 节「商户登录」
CLAUDE.md — 认证与鉴权（JWT Claims, Token 有效期）、多租户架构（登录商户选择）

## Scope
- 后端: POST /api/v1/auth/login + POST /api/v1/auth/refresh + POST /api/v1/auth/forgot-password + POST /api/v1/auth/reset-password
- 后端: JWT 签发/验证/刷新机制 + Spring Security JWT Filter
- 后端: 登录失败锁定（5次/15分钟）
- 前端: 登录页 `/login` + 忘记密码页 `/forgot-password` + 重置密码页 `/reset-password`
- 前端: 多商户选择（同一邮箱在多个商户下时）

## 关键设计
- **多商户登录**: 邮箱+密码验证后，若匹配多个商户 → 返回商户列表 → 用户选择 → 签发该商户的 JWT
- **JWT Claims**: userId, merchantId, email, role
- **Token 有效期**: Access Token 2h, Refresh Token 7d
- **锁定**: 连续 5 次失败锁定 15 分钟（按 merchant_user 粒度）
- **忘记密码**: 复用 EmailService，重置 token 有效期 30 分钟

## 不含（留给后续 Task）
- KYB 状态检查和跳转（Task-007）
- 前端 AuthProvider / 路由守卫（Task-004 布局壳）

## Development Plan

### 后端 - JWT 基础设施
- [x] 添加 `jjwt` 依赖到 pom.xml
- [x] 创建 `JwtService`: generateAccessToken, generateRefreshToken, parseToken, validateToken
- [x] 配置 `application.yml`: jwt.secret, jwt.access-expire-hours=2, jwt.refresh-expire-days=7
- [x] 创建 `JwtAuthenticationFilter`（OncePerRequestFilter）: 从 Authorization 头解析 JWT → 设置 SecurityContext
- [x] 更新 `SecurityConfig`: 注册 JwtAuthenticationFilter，放行 /api/v1/auth/**

### 后端 - DTO
- [x] 创建 `LoginRequest`（email, password, merchantId?）
- [x] 创建 `LoginResponse`（accessToken, refreshToken, userId, merchantId, email, role）
- [x] 创建 `MerchantSelectItem`（merchantId, companyName, role）— 多商户选择列表项
- [x] 创建 `RefreshTokenRequest`（refreshToken）
- [x] 创建 `ForgotPasswordRequest`（email）
- [x] 创建 `ResetPasswordRequest`（token, newPassword, confirmPassword）

### 后端 - 登录逻辑
- [x] `AuthService.login(LoginRequest)`:
  1. 按 email 查询所有 merchant_user 记录
  2. 找不到 → 抛"账号或密码错误"
  3. 逐条验证密码（BCrypt match），筛选出密码匹配的记录
  4. 无匹配 → 所有匹配 email 的记录 failedLoginCount++（按 merchantId 粒度）
  5. 检查锁定状态：failedLoginCount >= 5 且 lockedUntil > now → 抛"账号已锁定"
  6. 检查邮箱验证：emailVerified = false → 抛"请先验证邮箱"
  7. 匹配一个商户 → 直接签发 JWT
  8. 匹配多个商户且 request.merchantId 为空 → 返回商户选择列表（不签发 JWT）
  9. 匹配多个商户且 request.merchantId 有值 → 签发指定商户的 JWT
  10. 登录成功 → 重置 failedLoginCount=0, lockedUntil=null

### 后端 - Token 刷新
- [x] `AuthService.refreshToken(HttpServletRequest)`: 从 httpOnly cookie 读取 refresh token → 解析验证 → 签发新 access token
- [x] Refresh Token 通过 `Set-Cookie: refresh_token=xxx; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800` 下发

### 后端 - 忘记密码
- [x] `AuthService.forgotPassword(email)`: 查询该邮箱下所有 merchant_user → 为每条记录生成重置 token（30分钟）→ EmailService 发送一封邮件包含所有重置链接
- [x] `AuthService.resetPassword(token, newPassword)`: 校验 token → 密码规则 → BCrypt 加密 → 更新该条记录的密码（重置粒度为单条 merchant_user）

### 后端 - 数据库
- [x] `t_merchant_user` 新增 `reset_token` + `reset_token_expire` 字段
- [x] 更新 `MerchantUser` 实体

### 后端 - Controller
- [x] `AuthController` 新增:
  - `POST /api/v1/auth/login` → login
  - `POST /api/v1/auth/refresh` → refreshToken
  - `POST /api/v1/auth/forgot-password` → forgotPassword
  - `POST /api/v1/auth/reset-password` → resetPassword

### 后端 - 测试
- [x] 登录成功（单商户）
- [x] 登录成功（多商户 → 选择列表 → 指定 merchantId 登录）
- [x] 密码错误
- [x] 账号锁定（5次失败）
- [x] 邮箱未验证
- [x] Token 刷新
- [x] 忘记密码 + 重置密码
- [x] JWT Filter 拦截无 token 请求

### 前端 - 登录页
- [x] 创建 `(auth)/login/page.tsx`:
  - 表单: 邮箱 + 密码
  - 提交 → 单商户直接跳转 / 多商户显示选择列表
  - 商户选择: 卡片列表，点击后二次调用 login（带 merchantId）
  - 错误处理: 密码错误、账号锁定、邮箱未验证
  - 底部链接: "忘记密码？" + "没有账号？去注册"
  - 登录成功 → 存储 token → 跳转首页（暂时 /）

### 前端 - 忘记密码 + 重置密码
- [x] 创建 `(auth)/forgot-password/page.tsx`: 输入邮箱 → 发送重置链接
- [x] 创建 `(auth)/reset-password/page.tsx`: 输入新密码 → 重置 → 引导登录

### 前端 - Token 存储（安全优先）
- [x] Access Token 仅存内存（React Context），不落盘，不用 localStorage
- [x] Refresh Token 由后端 httpOnly cookie 管理，前端无法读取
- [x] `src/lib/auth.ts`: 内存 token 管理（getAccessToken / setAccessToken / clearAccessToken）
- [x] 更新 `src/lib/api.ts`: 请求自动附加 Authorization 头 + fetch 配置 credentials: 'include'（携带 cookie）
- [x] 页面刷新时自动调用 /api/v1/auth/refresh 恢复 access token

### 前端 - i18n + 测试
- [x] 添加 auth.login.*, auth.forgotPassword.*, auth.resetPassword.* keys
- [x] 登录页 smoke test

## Test Cases
1. **单商户登录**: 邮箱+密码正确 → 返回 accessToken + refreshToken + 用户信息
2. **多商户选择**: 同一邮箱在 2 个商户下 → 第一次返回商户列表 → 选择后返回 JWT
3. **密码错误**: → 返回"账号或密码错误"，failedLoginCount +1
4. **账号锁定**: 连续 5 次错误 → 返回"账号已锁定，请 15 分钟后重试"
5. **邮箱未验证**: → 返回"请先验证邮箱"
6. **Token 刷新**: 用 refreshToken 获取新 accessToken
7. **Token 过期**: 用过期 accessToken 请求受保护接口 → 401
8. **忘记密码**: 输入邮箱 → 后端日志输出重置链接（若邮箱在多个商户下，每个商户各一个 token）
9. **重置密码**: 使用重置链接 → 设置新密码 → 该商户下旧密码失效
10. **重置 token 过期**: → 返回"链接已过期"
11. **Refresh Token cookie**: 登录响应包含 Set-Cookie httpOnly → 刷新请求自动携带
11. **JWT Filter**: 无 token 访问 /api/v1/health → 200（公开）；无 token 访问其他接口 → 401

## Execution Log

### 2026-03-23 23:35
- 添加 jjwt 依赖（api + impl + jackson）到 pom.xml
- DB migration: t_merchant_user 新增 reset_token, reset_token_expire 字段
- 更新 init.sql 和 MerchantUser 实体
- 更新 application.yml: jwt.secret, jwt.access-expire-hours=2, jwt.refresh-expire-days=7, mail.reset-*

### 2026-03-23 23:40
- 创建 JwtService（generateAccessToken, generateRefreshToken, parseToken, validateToken）
- 创建 JwtAuthenticationFilter（OncePerRequestFilter, 从 Authorization 头解析 JWT）
- 创建 AuthUserDetails（userId, merchantId, email, role）
- 更新 SecurityConfig: 注册 JWT filter, .anyRequest().authenticated()
- 创建 6 个 DTO: LoginRequest, LoginResponse, MerchantSelectItem, ForgotPasswordRequest, ResetPasswordRequest
- 更新 EmailService + LogEmailServiceImpl + SmtpEmailServiceImpl: 新增 sendPasswordResetEmail
- 重写 AuthServiceImpl: 新增 login（含多商户选择、锁定检查、cookie 设置）、refreshToken、forgotPassword（重置所有商户）、resetPassword
- 更新 AuthController: 新增 login, refresh, forgot-password, reset-password 端点
- 修复: login 方法移除 @Transactional（避免 BizException 回滚 failedLoginCount 更新）
- 修复: 锁定检查移到密码验证之前（防止被锁定后仍可用正确密码登录）
- `./mvnw compile` → SUCCESS ✅

### 2026-03-23 23:43
- 创建 AuthLoginTest: 10 个测试（单商户登录、多商户选择、指定商户登录、密码错误、账号锁定、邮箱未验证、token刷新、忘记+重置密码、JWT filter 阻止/放行）
- `./mvnw test` → 19 tests passed (9 auth-register + 10 auth-login + 1 health) ✅

### 2026-03-23 23:47
- 创建 src/lib/auth.ts: 内存 access token 管理（不用 localStorage）
- 更新 src/lib/api.ts: 自动附加 Authorization 头 + credentials: 'include'（携带 httpOnly cookie）
- 更新 src/services/authService.ts: 新增 login, refresh, forgotPassword, resetPassword
- 创建 (auth)/login/page.tsx: 登录表单 + 多商户选择交互
- 创建 (auth)/forgot-password/page.tsx: 邮箱输入 + 发送成功提示
- 创建 (auth)/reset-password/page.tsx: 新密码表单 + Suspense 边界
- 更新 i18n en.js/zh.js: 新增 login, forgotPassword, resetPassword keys
- 创建 login 页面 smoke test
- `pnpm test` → 3 tests passed ✅
- `pnpm build` → SUCCESS ✅

### 2026-03-23 23:55 (Review feedback: Redis 重构)
- 重构: 所有临时认证状态从 MySQL 迁移到 Redis
- 创建 AuthRedisService: 验证token、重置token、失败计数、refresh token 全部 Redis 管理
- 从 t_merchant_user 移除 6 个列: verify_token, verify_token_expire, reset_token, reset_token_expire, failed_login_count, locked_until
- 更新 init.sql: 精简用户表，注释说明临时状态在 Redis
- 更新 MerchantUser 实体: 移除临时字段
- 重写 AuthServiceImpl: 全部使用 AuthRedisService 替代 DB 操作
- 启用 Redis: application.yml 移除 RedisAutoConfiguration 排除，配置 localhost:6379
- 配置 key 前缀统一改为 auth.* 命名空间
- 修复: EmailService 实现类仍引用旧的 mail.* 配置 → 统一改为 auth.*
- 重写 AuthControllerTest + AuthLoginTest: 使用 Redis 验证替代 DB 字段检查，BeforeEach 清理 Redis keys
- `./mvnw test` → 19 tests passed ✅

### 2026-03-24 00:15 (Bug fixes from user testing)
- 修复: t_merchant.company_name 添加 UNIQUE 约束，一家公司只能有一个 Merchant
- 修复: 注册逻辑重写 — 公司名已存在则拒绝("该公司已注册，如需加入请联系管理员邀请")，邮箱已注册则拒绝
- 修复: incrementFailCount 使用 Lua 脚本保证 INCR + EXPIRE 原子性
- 清理数据库中重复的 ABC 商户
- 重写测试: registerDuplicateCompanyName + registerDuplicateEmail 替代旧的多商户注册测试
- 重写多商户登录测试: 用 createUserInMerchant 模拟邀请加入（而非注册）
- 更新 CLAUDE.md 多租户规则: 公司名唯一，注册只创建新公司，加入已有公司只能通过邀请
- `./mvnw test` → 19 tests passed ✅

### 2026-03-24 01:00 (Full security code review — CR-001)
- 对全部已实现代码进行安全 CR，发现 4 CRITICAL + 8 HIGH + 10 MEDIUM + 6 LOW
- 完整报告: docs/cr-001-security-review.md
- 更新 CLAUDE.md: 新增「安全检查清单」作为每个 Task 验收的硬性门禁
- 更新 backlog.md: 技术债务重新分类，区分"Task-003 内立即修复"和"后续 Task 修复"
- 以下为 Task-003 内需要立即修复的安全问题:

### 安全修复计划（阻塞验收）
- [x] IP 级请求频率限制（RateLimitFilter, Redis Lua 脚本, 按端点差异化限制）
- [x] Refresh Token 轮换（每次 refresh 签发新 token + jti 唯一标识 + 更新 Redis + 重设 cookie）
- [x] 登出端点（POST /api/v1/auth/logout → 撤销 refresh token + 清除 cookie + 清除 SecurityContext）
- [x] BizException 按错误码映射 HTTP 状态码（400xx→400, 401xx→401, 403xx→403, 429xx→429）
- [x] 密码最大长度限制（@Size(max=72) 在所有密码 DTO 字段 + validatePassword 检查）
- [x] 注册信息泄漏修复（公司名/邮箱重复统一返回"注册信息有误"，不区分具体原因）
- [x] 登录时序攻击修复（邮箱不存在时执行 dummy BCrypt hash 比对，消除时间差）
- [x] 注册字段 @Size(max) 校验（email≤200, companyName≤200, contactName≤100）
- [x] 结构化安全审计日志（t_audit_log 表 + AuditService @Async + 10 种事件类型 + IP/UA 记录）
- [x] 日志中 PII 脱敏（AuditService.maskEmail 掩码化，AuthServiceImpl 不再 log 明文邮箱和 token）

### 2026-03-24 00:50 (Security fixes implementation)
- 创建 t_audit_log 表 + AuditLog 实体 + AuditLogMapper + AuditEventType + AuditService（@Async, maskEmail, getClientIp）
- 创建 RateLimitFilter（Redis Lua 脚本原子限流, 6 种端点差异化限制, 返回 HTTP 429）
- 重写 GlobalExceptionHandler: BizException 按 code/100 映射 HTTP 状态码
- 重写 AuthServiceImpl: 所有方法接收 HttpServletRequest, 全部操作记录审计日志, dummy BCrypt 防时序攻击, 统一错误消息防枚举, refresh token 轮换
- 新增 POST /api/v1/auth/logout 端点
- DTO 全部增加 @Size(max) 校验
- JwtService 增加 jti (UUID) 保证每个 token 唯一
- PortalApplication 增加 @EnableAsync
- SecurityConfig 注册 RateLimitFilter
- 重写 AuthControllerTest (9 tests) + AuthLoginTest (11 tests): 适配新的 HTTP 状态码和错误消息
- `./mvnw test` → 20 tests passed ✅
- `pnpm test` → 3 tests passed ✅
- `pnpm build` → SUCCESS ✅

### 2026-03-24 01:00 (Rate limit CORS fix + audit log DDoS fix)
- 问题: RateLimitFilter 返回 429 时无 CORS 头 → 浏览器拒绝响应 → 前端显示"网络错误"
- 问题: 每次被限流的请求仍调 auditService.log() 写 DB → DB 成为 DDoS 攻击面
- 修复: CorsConfig 从独立 CorsFilter bean 改为 CorsConfigurationSource bean
- 修复: SecurityConfig 使用 Spring Security 内置 .cors() 配置，确保 CORS 头出现在所有响应上
- 修复: RateLimitFilter 移除 auditService 依赖，不再写 DB（Redis 计数器即为审计证据）
- 修复: RateLimitFilter 增加全局 per-IP 限流层（所有 auth 端点合计 30/min per IP）
- 修复: 前端 api.ts 重写错误处理：fetch 异常捕获 → "网络连接失败"；非 JSON 响应捕获；429/401 等正确解析 JSON body 中的错误消息
- `./mvnw test` → 20 tests passed ✅
- `pnpm test` → 3 tests passed, `pnpm build` → SUCCESS ✅

### 2026-03-24 01:10 (测试用例重写)
- 更新 CLAUDE.md: 新增「测试代码规范」— @DisplayName 中文标注、@Nested 分组、覆盖维度要求
- 删除旧测试: HealthControllerTest, AuthControllerTest, AuthLoginTest
- 重写 HealthApiTest (2 tests): 无认证访问 + 带 JWT 访问
- 重写 AuthRegisterApiTest (11 tests): 正常流程(2) + 参数校验(7) + 业务规则(2) + 邮箱验证(3)
- 重写 AuthLoginApiTest (17 tests): 单商户(1) + 多商户(2) + 失败场景(4) + Token刷新(3) + 登出(1) + JWT过滤器(2) + 审计日志(2)
- 重写 AuthPasswordResetApiTest (7 tests): 忘记密码(2) + 密码重置(5)
- 重写前端测试: 首页(1) + 注册页(4) + 登录页(5)，全部使用中文描述
- `./mvnw test` → 41 tests passed ✅
- `pnpm test` → 10 tests passed ✅

## Next Step
Task-004: 平台布局壳（侧边栏 + 顶部栏 + 内容区 + 路由保护 + 角色菜单过滤）
