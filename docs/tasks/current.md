# Task-012: 开发者控制台 - API 凭证

## Status: Verifying

## PRD Reference
docs/prd/06-developer-console.md — 第 2、4 节「API 凭证管理」「沙箱测试指南」

## Scope
- 前端: `/developer/credentials` 页面（凭证展示+复制、沙箱测试指南、快速链接）
- 后端: `GET /api/v1/credentials` 查询凭证（首次访问自动生成）
- 数据库: 新增 `t_api_credential` 表

## 设计要点

### 数据模型
```sql
t_api_credential (
  id BIGINT PK AUTO_INCREMENT,
  merchant_id BIGINT NOT NULL (FK → t_merchant),
  app_id VARCHAR(64) NOT NULL UNIQUE,     -- 格式: "osl_app_" + UUID
  api_public_key TEXT NOT NULL,            -- RSA 2048 公钥 (PEM)
  api_private_key TEXT NOT NULL,           -- RSA 2048 私钥 (PEM, 仅后端存储)
  webhook_public_key TEXT NOT NULL,        -- RSA 2048 公钥 (PEM)
  webhook_private_key TEXT NOT NULL,       -- RSA 2048 私钥 (PEM, 仅后端存储)
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE KEY uk_merchant_id (merchant_id)  -- 每个商户一组凭证
)
```

### API 设计
- `GET /api/v1/credentials` → 返回 appId、apiPublicKey、webhookPublicKey、apiEndpoint（根据环境动态返回）
- 首次访问自动生成凭证（lazy init），后续直接返回
- **私钥不返回给前端**，仅在签名工具中使用

### 前端页面结构
1. **凭证信息卡片**: App ID、API 端点（随环境切换）、API 公钥、Webhook 公钥，每项带复制按钮
2. **沙箱测试指南**: 仅 sandbox 环境显示，包含测试卡号、支持货币/网络、限额
3. **快速链接**: 3 个导航卡片（API 文档、签名工具、Webhook 管理）

## Test Cases (TDD: 先写测试，后写实现)

### 后端功能测试
1. **首次获取凭证**: 已认证用户 GET /api/v1/credentials → 200，自动生成并返回 appId、apiPublicKey、webhookPublicKey、apiEndpoint
2. **重复获取凭证**: 再次 GET → 200，返回相同的 appId（幂等）
3. **沙箱环境**: 无 X-Environment 或 sandbox → apiEndpoint = `https://openapitest.osl-pay.com`
4. **生产环境**: X-Environment: production → apiEndpoint = `https://openapi.osl-pay.com`
5. **响应不含私钥**: 响应 JSON 中不存在 apiPrivateKey 或 webhookPrivateKey 字段
6. **数据库存储**: 生成后 t_api_credential 有 1 条记录，merchant_id 正确

### 后端安全测试
7. **未认证访问**: 无 JWT → 403
8. **频率限制**: 连续请求超过阈值 → 429
9. **租户隔离**: 商户 A 的凭证请求只能看到自己的凭证，不能看到商户 B 的
10. **App ID 格式安全**: 生成的 appId 使用安全随机数，格式为 `osl_app_` + UUID

### 前端功能测试
11. **凭证展示**: 渲染 4 个凭证项（App ID、API 端点、API 公钥、Webhook 公钥）
12. **复制功能**: 点击复制按钮，调用 clipboard API
13. **沙箱指南显示**: sandbox 环境下显示测试卡号等指南信息
14. **生产环境隐藏指南**: production 环境下不显示沙箱测试指南
15. **快速链接导航**: 3 个快速链接卡片可点击

### 安全检查清单
- [x] 认证: GET /api/v1/credentials 需要 JWT（SecurityConfig anyRequest().authenticated()）
- [x] 频率限制: 已有全局 RateLimitFilter 覆盖
- [x] 信息泄漏: CredentialResponse 仅含公钥，测试验证响应中无 PRIVATE KEY
- [x] 输入校验: GET 请求无用户输入参数，无需校验
- [x] 租户隔离: 查询使用 merchant_id 条件，测试验证 A/B 商户凭证不同
- [x] 审计日志: 首次生成凭证记录日志（log.info）
- [x] HTTP 状态码: 403 未认证，429 频率限制（全局 filter）
- [x] 日志安全: log.info 仅输出 merchantId 和 appId，无私钥
- [x] 安全响应头: 已有全局配置

## Development Plan

### 后端
- [x] 1. 新增 `t_api_credential` 表 DDL 到 init.sql
- [x] 2. 创建 `ApiCredential` 实体 + `ApiCredentialMapper`
- [x] 3. 创建 `CredentialResponse` DTO（不含私钥）
- [x] 4. 创建 `CredentialService` 接口 + `CredentialServiceImpl`（含 RSA 密钥生成、lazy init 逻辑）
- [x] 5. 创建 `CredentialController`（GET /api/v1/credentials）
- [x] 6. 编写后端测试 `CredentialApiTest`（覆盖测试用例 1-10）

### 前端
- [x] 7. 创建 `credentialService.ts`
- [x] 8. 添加 i18n 翻译键（credentials namespace）
- [x] 9. 创建 `/developer/credentials/page.tsx`（凭证卡片+复制+沙箱指南+快速链接）
- [x] 10. 编写前端测试

## Execution Log

### 2026-03-24 18:25
- 后端: 新增 t_api_credential 表（dev+test 两个数据库），创建 ApiCredential 实体、Mapper、CredentialResponse DTO、CredentialService（RSA 2048 密钥生成 + lazy init）、CredentialController
- 后端测试: CredentialApiTest 9 个测试全部通过（首次生成、幂等、环境切换、私钥不泄漏、租户隔离、App ID 格式）
- 前端: credentialService.ts、i18n 翻译键（zh+en）、credentials page（凭证卡片+复制+沙箱指南+快速链接）
- 前端测试: 7 个测试全部通过（凭证展示、复制、沙箱指南、生产隐藏、快速链接）
- 更新 8 个既有测试文件 @BeforeEach 清理 apiCredentialMapper（FK 依赖）
- 全量测试: 后端 91 通过，前端 43 通过
- 安全自查全部通过

## Next Step
Task-013: 签名工具
