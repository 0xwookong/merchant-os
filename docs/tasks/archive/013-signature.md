# Task-013: 签名工具

## Status: Verifying

## PRD Reference
docs/prd/07-signature-tools.md — 签名生成/验证/加密三合一工具页

## Scope
- 前端: `/developer/signature` 页面（3 个 Tab：生成签名、验证签名、加密数据）
- 后端: 3 个无状态 API（无 DB 写入，纯计算）
  - `POST /api/v1/sign/generate` — RSA SHA256withRSA 签名
  - `POST /api/v1/sign/verify` — 验证签名
  - `POST /api/v1/sign/encrypt` — RSA/ECB/PKCS1Padding 加密
- 数据库: 无（纯工具，不涉及持久化）

> 注: 3 个端点均为无状态计算接口，无 DB 操作，复杂度等同于 2 个普通 CRUD 端点

## 设计要点

### 签名流程
1. 签名字符串: `appId=[appId]&timestamp=[timestamp]`
2. RSA SHA256withRSA 签名 → Base64 输出
3. 验证: 用公钥验签，返回 true/false
4. 加密: RSA/ECB/PKCS1Padding → Base64 密文

### 前端交互
- Tab 切换时自动传递数据（生成→验证时自动填入 appId、timestamp、签名值）
- 预填测试数据（demo appId、当前时间戳、测试私钥）
- "重置为测试数据" 按钮
- 密钥格式错误时明确错误提示

## Test Cases (TDD)

### 后端功能测试
1. **生成签名**: 有效私钥 + appId + timestamp → 200，返回 signatureString + signature (Base64)
2. **验证签名 — 正确**: 匹配的公钥 + 正确签名 → 200，valid=true
3. **验证签名 — 错误**: 错误签名 → 200，valid=false
4. **加密数据**: 有效公钥 + 明文 → 200，返回 Base64 密文
5. **无效私钥格式**: 非 PEM 格式 → 400，明确错误消息
6. **无效公钥格式**: 非 PEM 格式 → 400，明确错误消息
7. **缺失参数**: appId 为空 → 400

### 后端安全测试
8. **未认证访问**: 无 JWT → 403
9. **超长输入**: 明文超长 → 400

### 前端功能测试
10. **渲染 3 个 Tab**: 生成签名、验证签名、加密数据
11. **预填测试数据**: 初始显示 demo appId 和当前时间戳
12. **Tab 切换数据传递**: 生成签名后切换到验证，自动填入参数

### 安全检查清单
- [x] 认证: 需要 JWT（anyRequest().authenticated()）
- [x] 频率限制: 全局 RateLimitFilter 覆盖
- [x] 信息泄漏: 纯计算工具，用户提供自己的密钥
- [x] 输入校验: PEM 格式校验、参数非空、长度限制
- [x] 租户隔离: 不涉及（无持久化数据）
- [x] 审计日志: 不涉及（工具性质，无业务数据变更）
- [x] HTTP 状态码: 400 参数错误，403 未认证
- [x] 日志安全: 不记录用户提供的密钥内容

## Development Plan

### 后端
- [x] 1. 创建 DTO（SignGenerateRequest/Response, SignVerifyRequest/Response, EncryptRequest/Response）
- [x] 2. 创建 SignService + SignServiceImpl（RSA 签名/验签/加密逻辑）
- [x] 3. 创建 SignController（3 个 POST 端点）
- [x] 4. 编写后端测试 SignApiTest（9 个测试）

### 前端
- [x] 5. 创建 signService.ts
- [x] 6. 添加 i18n 翻译键（signature namespace，zh+en）
- [x] 7. 创建 /developer/signature/page.tsx（3 Tab + Radix Tabs + 密钥参考）
- [x] 8. 编写前端测试（5 个测试）

## Execution Log

### 2026-03-24 18:40
- 后端: 6 个 DTO + SignService（SHA256withRSA 签名/验签 + RSA/ECB/PKCS1Padding 加密）+ SignController（3 POST 端点）
- 后端测试: 9 个全部通过（生成/验证/加密 + 无效密钥 + 缺失参数 + 未认证）
- 前端: signService.ts + i18n（40+ keys）+ signature page（Radix Tabs 3-tab 布局 + 密钥参考）
- 前端测试: 5 个全部通过
- 全量: 后端 100 通过，前端 48 通过

## Next Step
Task-014: API 文档引擎 - 端点列表与详情
