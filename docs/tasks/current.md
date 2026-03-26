# Task-029: 域名白名单操作增加身份验证（2FA / 邮件验证码）

## Status: Verifying

## PRD Reference
docs/prd/11-domain-whitelist.md — §2.2 添加域名, §2.3 移除域名

## Scope
- 前端: 修改 `/developer/domains` 页面，添加/删除域名前弹出验证对话框
- 后端: 修改 DomainController 的 POST 和 POST remove 端点，接收 otpCode/emailCode 参数并调用 ActionVerificationService
- 数据库: 无变更

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试 — 后端
1. POST /domains + 有效 OTP 验证码 → 201 添加成功
2. POST /domains + 无验证码 → 400 "请输入验证码"
3. POST /domains + 错误邮件验证码 → 400 "邮件验证码错误或已过期"
4. POST /domains + 有效邮件验证码 → 200 添加成功
5. 重复添加 → 400 "该域名已存在"
6. POST /domains/{id}/remove + 有效验证码 → 200 删除成功
7. POST /domains/{id}/remove + 无验证码 → 400
8. 未认证请求 → 403
9. 添加域名后审计日志中存在 DOMAIN_ADDED 记录

### 功能测试 — 前端
1. 渲染标题和添加输入框
2. 展示域名列表
3. 展示用途说明
4. 点击添加 → 弹出验证对话框
5. 点击删除 → 弹出验证对话框（显示域名信息）

### 安全检查清单
- [x] 认证: POST/DELETE 端点验证 JWT（已有）
- [x] 身份验证: 添加/删除操作调用 ActionVerificationService.verify()
- [x] 租户隔离: merchantId 从 JWT 获取（已有）
- [x] 输入校验: otpCode/emailCode 长度限制 6 位（@Size(max=6)）
- [x] 审计日志: DOMAIN_ADDED / DOMAIN_REMOVED 事件记录（含 IP、UA、脱敏邮箱）
- [x] HTTP 状态码: 验证失败 400，未认证 403

## Development Plan

### 后端
- [x] 1. DomainRequest 增加 otpCode/emailCode 可选字段
- [x] 2. 新增 DomainRemoveRequest DTO（otpCode/emailCode）
- [x] 3. DomainController.add() 调用 ActionVerificationService.verify()
- [x] 4. DomainController.remove() 改为 POST /{id}/remove + RequestBody + 调用 verify()
- [x] 5. DomainServiceImpl 添加/删除增加审计日志
- [x] 6. 后端测试更新（10 tests passed）

### 前端
- [x] 7. domainService 更新：add/remove 接口增加 otpCode/emailCode 参数
- [x] 8. domains/page.tsx 新增 VerifyDialog 组件（复用成员管理的验证 UI 模式）
- [x] 9. handleAdd/handleRemove 流程改为：先弹出验证 → 验证通过后执行操作
- [x] 10. i18n 新增验证对话框相关 key（en.js + zh.js，各 11 个新 key）
- [x] 11. 前端测试更新（5 个测试用例）
- [x] 12. pnpm build OK + pnpm test 76 tests passed

## Execution Log

### 2026-03-26 10:20
- 后端: DomainRequest 增加 otpCode/emailCode 字段（@Size(max=6)）
- 后端: 新建 DomainRemoveRequest DTO
- 后端: DomainController 重构 — add() 调用 actionVerification.verify()，remove() 改为 POST /{id}/remove
- 后端: DomainService 接口增加 userId + HttpServletRequest 参数
- 后端: DomainServiceImpl 添加 AuditService 审计日志（DOMAIN_ADDED / DOMAIN_REMOVED）
- 后端: DomainApiTest 重写 — 10 测试全通过（含验证码验证、无验证码拒绝、错误码拒绝、审计日志）
- 后端全量: 196 tests, 194 passed, 2 failed（OrderApiTest 30天窗口问题，pre-existing）
- 前端: domainService.add/remove 增加 VerifyParams 参数
- 前端: domains/page.tsx 新增 VerifyDialog 组件 — OTP/邮件验证码双通道，域名信息展示
- 前端: i18n en.js/zh.js 各增加 11 个 domains.verify.* / domains.remove.* key
- 前端: page.test.tsx 更新 — 5 个测试用例（含验证对话框弹出检验）
- 前端: pnpm build OK, 76 tests passed

## Next Step
等待用户验收。后续可考虑 Webhook 配置等其他敏感操作是否也需要 2FA 验证。
