# Task-028: API 密钥轮换

## Status: Done

## 实现内容

### 后端
- `CredentialService` 新增 `rotateApiKeys()` / `rotateWebhookKeys()` 方法
- `CredentialController` 新增 `POST /api/v1/credentials/rotate` 端点
- `CredentialRotateRequest` DTO（keyType: api|webhook + OTP/邮箱验证码）
- 2FA 验证通过 `ActionVerificationService`
- 审计日志记录 `CREDENTIAL_ROTATED` 事件
- appId 保持不变，只轮换 RSA 密钥对

### 前端
- `credentialService` 新增 `rotate()` API 调用
- Credentials 页面每个公钥卡片下方增加「轮换密钥」按钮（amber 色）
- 点击后弹出 `VerifyActionDialog` 进行 2FA 验证
- 轮换成功后自动刷新显示新公钥 + Toast 通知
- i18n 新增 7 个翻译 key（en + zh）

## Verification
- `pnpm build` ✅
- `mvn compile` ✅

## Next Step
Task-029: 商户设置页
