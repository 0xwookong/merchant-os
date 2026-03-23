# Task-002: 商户注册

## Status: Done

## PRD Reference
docs/prd/02-registration-kyb.md — 第 2 节「商户注册」
CLAUDE.md — 多租户架构

## Scope
- 数据库: 创建 `oslpay_portal` 数据库 + `t_merchant` 商户表 + `t_merchant_user` 用户表
- 后端: POST /api/v1/auth/register + GET /api/v1/auth/verify-email + 邮件服务接口（日志实现）
- 前端: 注册页面 `/register` + 邮箱验证页面 `/verify-email` + API 基础封装

## 关键决策
- **多租户**: 注册时同时创建 Merchant（租户）+ 第一个 ADMIN 用户
- **邮件**: 完整的 EmailService 接口，当前用日志输出实现，后续配置 SMTP 即可切换
- **验证 token**: 有效期 30 分钟
- **默认角色**: 注册用户为 ADMIN
- **数据库**: MySQL root/123456

## 不含（留给后续 Task）
- 登录 + JWT（Task-003）
- 忘记密码（Task-003）
- KYB 引导认证（Task-007）

## Development Plan

### 数据库
- [x] 创建数据库 `oslpay_portal`（charset utf8mb4）
- [x] 创建 `t_merchant` 表（id, company_name, status, kyb_status, created_at, updated_at）
- [x] 创建 `t_merchant_user` 表（id, merchant_id, email, password_hash, contact_name, role, status, email_verified, verify_token, verify_token_expire, failed_login_count, locked_until, created_at, updated_at）
- [x] 更新 application.yml: 接入真实 MySQL（root/123456），移除 DataSource 排除配置
- [x] 创建 SQL 初始化脚本 `backend/src/main/resources/db/init.sql`

### 后端 - Model 层
- [x] 创建 `MerchantStatus` 枚举（ACTIVE, SUSPENDED, DISABLED）
- [x] 创建 `KybStatus` 枚举（NOT_STARTED, PENDING, APPROVED, REJECTED, NEED_MORE_INFO）
- [x] 创建 `UserRole` 枚举（ADMIN, BUSINESS, TECH）
- [x] 创建 `UserStatus` 枚举（ACTIVE, LOCKED, DISABLED）
- [x] 创建 `Merchant` 实体类（@TableName("t_merchant")）
- [x] 创建 `MerchantUser` 实体类（@TableName("t_merchant_user")）

### 后端 - Repository 层
- [x] 创建 `MerchantMapper` 接口（extends BaseMapper<Merchant>）
- [x] 创建 `MerchantUserMapper` 接口（extends BaseMapper<MerchantUser>）

### 后端 - DTO
- [x] 创建 `RegisterRequest`（email, password, confirmPassword, companyName, contactName）+ Jakarta Validation
- [x] 创建 `RegisterResponse`（merchantId, userId, email, message）

### 后端 - 邮件服务
- [x] 创建 `EmailService` 接口: sendVerificationEmail(to, token)
- [x] 创建 `LogEmailServiceImpl`（@Profile("dev")）: 将验证链接输出到日志
- [x] 创建 `SmtpEmailServiceImpl`（@Profile("prod")）: 预留 SMTP 实现骨架，配置缺失时 graceful skip

### 后端 - 业务逻辑
- [x] 创建 `AuthService` 接口
- [x] 创建 `AuthServiceImpl`:
  - `register(RegisterRequest)`:
    1. 校验邮箱唯一性（查 t_merchant_user）
    2. 密码规则校验（≥8位，大小写+数字至少两种，不与邮箱相同）
    3. BCrypt 加密密码
    4. 创建 t_merchant 记录（company_name, status=ACTIVE, kyb_status=NOT_STARTED）
    5. 创建 t_merchant_user 记录（merchant_id, email, password_hash, role=ADMIN, email_verified=false）
    6. 生成 verify_token（UUID）+ 过期时间（30分钟）
    7. 调用 EmailService 发送验证链接
    8. 返回 RegisterResponse
  - `verifyEmail(token)`:
    1. 查询 token 对应的用户
    2. 校验 token 未过期
    3. 标记 email_verified=true, 清空 token
    4. 返回成功

### 后端 - Controller
- [x] 创建 `AuthController`:
  - `POST /api/v1/auth/register` → AuthService.register
  - `GET /api/v1/auth/verify-email?token={token}` → AuthService.verifyEmail
- [x] 确认 SecurityConfig 已放行 `/api/v1/auth/**`

### 后端 - 测试
- [x] AuthService 单元测试（正常注册、重复邮箱、密码规则、验证 token）
- [x] AuthController 集成测试（MockMvc）

### 前端 - 基础设施
- [x] 创建 `src/lib/api.ts`: fetch wrapper（baseURL、JSON 处理、错误统一处理）
- [x] 创建 `src/services/authService.ts`: register() + verifyEmail()
- [x] 创建 `src/app/(auth)/layout.tsx`: 认证页面布局（居中卡片，无侧边栏）

### 前端 - 注册页面
- [x] 创建 `src/app/(auth)/register/page.tsx`:
  - 表单: 邮箱、密码、确认密码、公司名称、联系人姓名
  - 前端验证: 必填、邮箱格式、密码规则、确认密码一致
  - Loading 状态 + 错误提示
  - 提交成功 → 显示"验证邮件已发送"提示
  - 底部链接: "已有账号？去登录"（指向 /login，Task-003 实现页面）

### 前端 - 邮箱验证页面
- [x] 创建 `src/app/(auth)/verify-email/page.tsx`:
  - 从 URL 读取 token 参数
  - 自动调用后端验证 API
  - Loading → 成功（引导去登录）/ 失败（token 无效或过期）

### 前端 - i18n
- [x] 添加 `auth.register.*` 和 `auth.verifyEmail.*` keys 到 en.js / zh.js

### 前端 - 测试
- [x] 注册页面 smoke test（渲染标题 + 表单字段）

## Test Cases
1. **正常注册**: 填写全部字段 → 提交 → 后端创建 merchant + user → 返回成功 → 前端显示邮件提示 → 日志输出验证链接
2. **邮箱验证成功**: 访问验证链接（30分钟内）→ email_verified=true → 前端显示成功并引导登录
3. **重复邮箱**: 注册已存在邮箱 → 后端返回 `{ code: 40001, message: "邮箱已注册" }` → 前端显示错误
4. **密码太短**: 输入 "Ab1" → 前端拦截 → 显示"密码至少 8 个字符"
5. **密码规则不满足**: 输入 "abcdefgh"（纯小写）→ 前端拦截 → 显示密码规则提示
6. **密码与邮箱相同**: 密码等于邮箱 → 前端拦截 → 显示"密码不能与邮箱相同"
7. **确认密码不一致**: 两次输入不同 → 前端拦截 → 显示"两次密码不一致"
8. **邮箱格式错误**: 输入 "abc" → 前端拦截 → 显示"请输入有效邮箱"
9. **验证 token 过期**: 使用 30 分钟前的 token → 后端返回错误 → 前端显示"链接已过期"
10. **验证 token 无效**: 随机 token → 后端返回错误 → 前端显示"链接无效"
11. **多租户验证**: 注册后数据库中 t_merchant 和 t_merchant_user 各有一条记录，merchant_id 关联正确

## Execution Log

### 2026-03-23 23:00
- 创建 `db/init.sql`: oslpay_portal 数据库 + t_merchant + t_merchant_user 表
- 执行 SQL → 两张表创建成功
- 更新 application.yml: 接入 MySQL (root/123456), 移除 DataSource 排除, 添加 spring.profiles.active=dev, 添加 mail 配置

### 2026-03-23 23:05
- 创建 4 个枚举: MerchantStatus, KybStatus, UserRole, UserStatus
- 创建 2 个实体: Merchant, MerchantUser（含 MyBatis-Plus 注解）
- 创建 2 个 Mapper: MerchantMapper, MerchantUserMapper
- 创建 DTO: RegisterRequest (含 Jakarta Validation), RegisterResponse
- 创建 MyBatisPlusConfig（自动填充 createdAt/updatedAt）
- 创建 EmailService 接口 + LogEmailServiceImpl(@Profile("dev")) + SmtpEmailServiceImpl 骨架(@Profile("prod"))
- 创建 AuthService + AuthServiceImpl（register + verifyEmail, 含密码规则校验、BCrypt 加密、事务）
- 创建 AuthController (POST /register, GET /verify-email)
- SecurityConfig 添加 PasswordEncoder bean
- `./mvnw clean compile` → BUILD SUCCESS ✅

### 2026-03-23 23:07
- 创建 AuthControllerTest: 7 个测试用例（注册成功、重复邮箱、密码不一致、弱密码、验证成功、无效token、缺失字段）
- 修复: MyBatis-Plus updateById 不更新 null 字段 → 改用 LambdaUpdateWrapper.set(field, null)
- `./mvnw test` → 8 tests passed ✅

### 2026-03-23 23:10
- 创建 `src/lib/api.ts`: fetch wrapper（统一错误处理、ApiError 类）
- 创建 `src/services/authService.ts`: register + verifyEmail
- 创建 `(auth)/layout.tsx`: 居中卡片式布局
- 创建 `(auth)/register/page.tsx`: 5 字段表单 + 前端验证 + Loading/Error/Success 状态
- 创建 `(auth)/verify-email/page.tsx`: 自动验证 token + 三态展示
- 修复: useSearchParams 需要 Suspense 边界 → 拆分 VerifyEmailPage + VerifyEmailContent
- 更新 i18n: en.js + zh.js 添加 auth.register.* 和 auth.verifyEmail.* 共 30+ keys
- 创建 register 页面 smoke test
- `pnpm test` → 2 tests passed ✅
- `pnpm build` → SUCCESS ✅

### 2026-03-23 23:20 (Review feedback: 多租户邮箱唯一性)
- 方案确认: 邮箱在租户内唯一 UNIQUE(merchant_id, email)，同一邮箱可注册不同商户
- 修改 init.sql: uk_email → uk_merchant_email(merchant_id, email)，新增 idx_email
- 执行 ALTER TABLE 修改已有数据库
- 修改 AuthServiceImpl: 重复检查改为"同邮箱+同公司名"（用安全的参数化查询替代 SQL 拼接）
- 修改 AuthControllerTest: 拆分为 registerDuplicateEmailSameCompany + registerSameEmailDifferentCompany
- 更新 CLAUDE.md 多租户规则: 新增邮箱唯一性和登录商户选择规则
- `./mvnw test` → 9 tests passed ✅

## Next Step
Task-003: 商户登录 + JWT（登录页 + JWT 签发/刷新 + 忘记密码）
