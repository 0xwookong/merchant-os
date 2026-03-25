# Task-025a: OTP 绑定/解绑 + 邮件验证码基础能力

## Status: Verifying

## PRD Reference
docs/prd/02-registration-kyb.md — "后续可扩展：MFA（多因子认证）"

## Scope
- 后端: TOTP 绑定/解绑 API、邮件验证码发送/校验 API
- 前端: 个人安全设置页（OTP 绑定流程 + 绑定状态展示）
- 数据库: `t_merchant_user` 新增 `otp_secret`、`otp_enabled` 字段

## 设计思路

### OTP 绑定流程
```
用户进入安全设置 → 点击"绑定 OTP"
  → 后端生成 TOTP secret → 返回 secret + QR code URI
  → 前端展示 QR code + secret 明文（手动输入备选）
  → 用户用 Google Authenticator 扫码
  → 输入 6 位验证码确认
  → 后端验证通过 → 保存 otp_secret + otp_enabled=true
  → 显示备用恢复码（一次性显示，用户自行保存）
```

### OTP 解绑流程
```
用户点击"解绑 OTP"
  → 需要验证当前 OTP 码（防止非本人操作）
  → 后端验证通过 → 清除 otp_secret + otp_enabled=false
```

### 邮件验证码（通用能力）
```
POST /api/v1/auth/send-email-code → 发送 6 位验证码到用户邮箱
POST /api/v1/auth/verify-email-code → 校验验证码，返回一次性 action token
```
用于未绑定 OTP 的用户进行敏感操作验证（迭代 C 使用）。

### 后端 API 设计

| 端点 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/v1/auth/otp/setup` | POST | 生成 TOTP secret + QR URI | 已认证 |
| `/api/v1/auth/otp/verify-bind` | POST | 验证 OTP 码并绑定 | 已认证 |
| `/api/v1/auth/otp/unbind` | POST | 验证 OTP 码并解绑 | 已认证 |
| `/api/v1/auth/otp/status` | GET | 获取当前用户 OTP 绑定状态 | 已认证 |
| `/api/v1/auth/send-email-code` | POST | 发送邮件验证码 | 已认证 |
| `/api/v1/auth/verify-email-code` | POST | 校验邮件验证码 | 已认证 |

### 数据库变更
```sql
ALTER TABLE t_merchant_user
  ADD COLUMN otp_secret VARCHAR(64) DEFAULT NULL COMMENT 'TOTP secret (Base32 encoded)',
  ADD COLUMN otp_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether OTP is enabled';
```

### 前端页面
- 路由: `/organization/security` 或在个人中心下拉菜单内
- 内容: OTP 绑定状态卡片、绑定/解绑按钮、QR code 展示弹窗

## Test Cases (TDD)

### 后端功能测试
1. setup → 返回 secret 和 otpauth URI，包含正确的 issuer 和 account
2. verify-bind → 正确的 OTP 码 → otp_enabled 变为 true
3. verify-bind → 错误的 OTP 码 → 400 错误，otp_enabled 不变
4. verify-bind → 已绑定用户重复绑定 → 400 错误
5. unbind → 正确的 OTP 码 → otp_enabled 变为 false，otp_secret 清除
6. unbind → 错误的 OTP 码 → 400 错误
7. unbind → 未绑定用户解绑 → 400 错误
8. status → 返回 { otpEnabled: true/false }
9. send-email-code → 发送邮件，Redis 中存在验证码
10. verify-email-code → 正确验证码 → 返回 action token
11. verify-email-code → 错误验证码 → 400 错误
12. verify-email-code → 过期验证码 → 400 错误

### 后端安全测试
1. 未认证访问所有 OTP 端点 → 403
2. OTP secret 不出现在日志中
3. 验证码尝试次数限制（防暴力破解）
4. 租户隔离：只能操作自己的 OTP

### 安全检查清单
- [ ] 认证: 所有 OTP 端点需要 JWT
- [ ] 频率限制: send-email-code 每分钟最多 1 次，verify 每分钟最多 5 次
- [ ] 信息泄漏: 不在错误响应中泄漏 OTP 状态
- [ ] 输入校验: OTP 码必须 6 位数字
- [ ] 日志安全: otp_secret 和验证码不写入日志
- [ ] TOTP 时间窗口: 允许前后各 1 个 30 秒窗口（90 秒容差）

## Development Plan

### 后端
- [ ] 1. pom.xml 添加 TOTP 库依赖（如 `com.j256.two-factor-auth` 或手动实现）
- [ ] 2. `t_merchant_user` 新增 `otp_secret`、`otp_enabled` 字段（init.sql + Entity）
- [ ] 3. 实现 `TotpService`（生成 secret、生成 QR URI、验证 OTP 码）
- [ ] 4. `AuthRedisService` 新增邮件验证码存储/校验方法
- [ ] 5. `EmailService` 新增 `sendVerificationCode()` 方法
- [ ] 6. 实现 OTP 相关 4 个端点（setup/verify-bind/unbind/status）
- [ ] 7. 实现邮件验证码 2 个端点（send/verify）
- [ ] 8. 编写后端测试
- [ ] 9. 运行后端测试验证

### 前端
- [ ] 10. `authService.ts` 新增 OTP 相关 API 方法
- [ ] 11. 安全设置页面（OTP 状态卡片 + 绑定/解绑入口）
- [ ] 12. OTP 绑定弹窗（QR code + 手动输入 + 验证码确认）
- [ ] 13. OTP 解绑弹窗（输入当前 OTP 码确认）
- [ ] 14. i18n 翻译 key
- [ ] 15. 编写前端测试
- [ ] 16. 运行 pnpm build + pnpm test 验证

## Execution Log

_(待开始)_

## Next Step
Task-025b: 登录集成 OTP（密码验证后 → OTP 验证 → 签发 JWT）
Task-025c: 敏感操作验证 + 角色修改
