# Task-036: Public ID 安全改造（方案 B：双 ID 模式）

## Status: Planning

## 背景
当前所有数据库表使用 BIGINT AUTO_INCREMENT 主键，对外暴露的 ID 是连续整数，存在：
- **可枚举性**：攻击者可推测所有 ID 范围
- **信息泄露**：ID 大小暴露业务规模和注册顺序
- **IDOR 攻击面**：顺序 ID 降低攻击成本

## 方案
方案 B（双 ID 模式）：保留内部自增 ID 用于数据库关联，新增 `public_id`（UUID v4）对外暴露。

## Scope

### 需要 public_id 的表（ID 暴露给前端）

| 表 | 暴露场景 | 优先级 |
|---|---|---|
| `t_merchant` | LoginResponse, JWT claims | P0 |
| `t_merchant_user` | LoginResponse, JWT claims, MemberResponse | P0 |
| `t_webhook_config` | WebhookResponse (CRUD 操作用 id) | P1 |
| `t_domain_whitelist` | DomainResponse (删除操作用 id) | P1 |
| `t_notification` | NotificationItem (标记已读/删除用 id) | P1 |
| `t_order` | OrderListResponse, OrderDetailResponse | P1 |
| `t_merchant_application` | ApplicationResponse | P1 |
| `t_application_document` | DocumentResponse (删除操作用 id) | P1 |
| `t_api_request_log` | ApiRequestLogResponse | P2 (只读) |
| `t_webhook_log` | WebhookLogResponse | P2 (只读) |

### 不需要 public_id 的表

| 表 | 原因 |
|---|---|
| `t_api_credential` | 已使用 UUID 格式的 app_id |
| `t_email_template` | 内部使用，不暴露给商户 |
| `t_audit_log` | 内部使用，不暴露给商户 |
| `t_application_status_history` | 只读展示，无操作，且 merchant 隔离 |

## 子任务拆分

### Task-036a: 基础设施 + 认证链路（P0）
**范围**: DB schema + Entity + JWT + Auth 响应 + 前端 Auth 类型
- 后端: JwtService, AuthUserDetails, LoginResponse, RegisterResponse, MerchantSelectItem
- 前端: authService.ts, auth-provider.tsx, login page merchantId 选择
- 不涉及新 API 端点

### Task-036b: 业务实体改造（P1）
**范围**: Webhook, Domain, Notification, Order, Application, Document
- 后端: 所有 Response DTO 的 id 字段改为 publicId, Controller 接受 publicId 并解析
- 前端: 所有 service 文件的 id 类型从 number 改为 string

### Task-036c: 只读实体改造（P2）
**范围**: ApiRequestLog, WebhookLog
- 改动最小，这些只是展示用

---

## Task-036a: 基础设施 + 认证链路

### Test Cases (TDD)

#### 功能测试
1. 新注册商户 → t_merchant 和 t_merchant_user 自动生成 public_id (UUID 格式)
2. 登录成功 → LoginResponse 返回 string 类型 merchantId/userId（UUID），不返回数字 ID
3. JWT claims 包含 publicMerchantId 和 publicUserId（UUID），不含数字 ID
4. token refresh → 返回的 LoginResponse 同样使用 public_id
5. 商户选择列表 → MerchantSelectItem.merchantId 是 UUID 字符串
6. 前端 AuthUser 类型 → userId 和 merchantId 是 string
7. Internal API → 继续使用数字 merchant_id（不受影响）

#### 安全测试
1. JWT 中不包含任何数字 ID（userId, merchantId）
2. API 响应中不泄露数字 ID
3. 旧的数字 ID 格式 JWT 被拒绝（validateToken 失败或无法解析）

### 安全检查清单
- [x] 认证: JWT claims 从数字 ID 改为 UUID public_id
- [x] 信息泄漏: API 响应不再包含可枚举的数字 ID
- [x] 租户隔离: 后端内部仍用数字 merchant_id 做 WHERE 条件，不受影响
- [x] 向后兼容: 已登录用户的旧 JWT 会因 claim 类型变化而失效，需重新登录

### Development Plan

#### 后端
- [ ] 1. DB migration: t_merchant 和 t_merchant_user 添加 `public_id VARCHAR(36) NOT NULL UNIQUE`
- [ ] 2. Entity: Merchant 和 MerchantUser 实体添加 publicId 字段，@TableField 映射
- [ ] 3. 注册流程: 创建 merchant/user 时自动生成 UUID 填入 public_id
- [ ] 4. JwtService: generateAccessToken/RefreshToken 参数改为接受 publicId 字符串
- [ ] 5. JwtAuthenticationFilter: 解析 JWT 时，用 publicId 查找数字 ID 设入 AuthUserDetails
- [ ] 6. AuthUserDetails: 新增 publicMerchantId, publicUserId 字段（保留内部数字 ID）
- [ ] 7. LoginResponse: userId/merchantId 字段类型从 Long 改为 String（使用 public_id）
- [ ] 8. RegisterResponse: 同上
- [ ] 9. MerchantSelectItem: merchantId 改为 String
- [ ] 10. AuthService 登录/注册/刷新流程: 构建响应时使用 public_id
- [ ] 11. LoginRequest: merchantId 字段从 Long 改为 String，选择商户时用 public_id
- [ ] 12. mvn compile 验证

#### 前端
- [ ] 13. authService.ts: 所有 ID 类型从 number 改为 string
- [ ] 14. auth-provider.tsx: AuthUser 接口 userId/merchantId 从 number 改为 string
- [ ] 15. login page: merchantId 选择逻辑适配 string 类型
- [ ] 16. pnpm build 验证

### Execution Log

（等待计划评审）

## Next Step
Task-036b: 业务实体 public_id 改造
