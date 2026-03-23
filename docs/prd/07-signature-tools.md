# 签名与加密工具

## 1. 功能概述

签名工具提供在线的签名生成、签名验证和数据加密三大功能，帮助技术人员快速调试和验证集成中的安全逻辑。工具预填测试数据，支持开箱即用。

**适用角色**: 管理员、技术人员

## 2. 功能模块

### 2.1 生成签名（Tab 1）

**用途**: 使用私钥对签名字符串进行 RSA 签名，生成可用于 API 请求的签名值。

**预填测试数据**:
- App ID: `demo_app_20240101`
- Timestamp: 当前 Unix 时间戳（自动更新）
- 私钥: 测试用 RSA 私钥（PKCS#8 PEM 格式）

**签名过程**:
1. 构造签名字符串: `appId=[your_app_id]&timestamp=[unix_timestamp]`
2. 使用 RSA SHA256withRSA 算法对签名字符串签名
3. 输出 Base64 编码的签名值

**输出结果**:
- 签名字符串（原文）
- Base64 编码的签名值
- 可直接使用的请求头格式: `open-api-sign: {signature}`

### 2.2 验证签名（Tab 2）

**用途**: 使用公钥验证签名是否正确。

**自动传递**: 从「生成签名」Tab 切换过来时，自动填入 App ID、Timestamp 和签名值。

**验证结果**:
- 成功: 显示「签名验证通过」（绿色）
- 失败: 显示「签名验证失败」（红色）

### 2.3 加密数据（Tab 3）

**用途**: 使用 Webhook 公钥加密敏感字段数据。

**加密算法**: RSA/ECB/PKCS1Padding

**输入**:
- 明文（默认: `Hello OSLpay!`）
- Webhook 公钥

**输出**:
- Base64 编码的密文
- 支持一键复制

## 3. 通用功能

### 3.1 重置测试数据
- 提供「重置为测试数据」按钮
- 一键恢复所有预填的测试数据

### 3.2 错误处理
- 密钥格式不正确时显示明确错误提示
- 说明期望的密钥格式: PKCS#8 PEM 格式
- 提供 OpenSSL 密钥生成命令参考

## 4. 技术规格

| 项目 | 规格 |
|------|------|
| 签名算法 | RSA SHA256withRSA |
| 加密算法 | RSA/ECB/PKCS1Padding |
| 密钥格式 | PKCS#8 PEM |
| 签名字符串格式 | `appId=[appId]&timestamp=[timestamp]` |
| 签名输出格式 | Base64 编码 |
| 密钥长度 | RSA 2048-bit |

## 5. 密钥生成参考

```bash
# 生成私钥
openssl genrsa -out private.pem 2048

# 转换为 PKCS#8 格式
openssl pkcs8 -topk8 -inform PEM -in private.pem -outform PEM -nocrypt -out private_pkcs8.pem

# 生成公钥
openssl rsa -in private.pem -pubout -out public.pem
```

## 6. 验收标准

- [ ] 页面预填测试数据，可直接点击「生成签名」
- [ ] 签名结果包含签名字符串、签名值和请求头格式
- [ ] 切换到「验证签名」Tab 时自动填入上一步参数
- [ ] 验证结果正确显示通过或失败
- [ ] 加密功能使用 RSA/ECB/PKCS1Padding 算法
- [ ] 密钥格式错误时展示明确错误提示
- [ ] 「重置为测试数据」按钮恢复预填数据
