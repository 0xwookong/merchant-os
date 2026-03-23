# Webhook 管理

## 1. 功能概述

Webhook 管理模块允许技术人员配置事件推送端点，当系统中发生特定事件（订单状态变更、KYC 审核结果等）时，自动向商户配置的 URL 发送 HTTP POST 通知。

**适用角色**: 管理员、技术人员

## 2. Webhook 配置

### 2.1 创建 Webhook

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| 目标 URL | URL | ✅ | 必须为 HTTPS 地址（生产环境） |
| 订阅事件 | Multi-Select | ✅ | 选择要监听的事件类型 |

创建后系统自动生成签名密钥（Secret），用于接收端验签。

### 2.2 支持的事件类型

| 事件类型 | 说明 | 分类 |
|----------|------|------|
| `order.created` | 订单已创建 | 订单事件 |
| `order.completed` | 订单已完成 | 订单事件 |
| `order.failed` | 订单失败 | 订单事件 |
| `payment.success` | 支付成功 | 支付事件 |
| `payment.refund` | 支付退款 | 支付事件 |
| `kyc.approved` | KYC 审核通过 | KYC 事件 |
| `kyc.rejected` | KYC 审核拒绝 | KYC 事件 |
| `kyc_status_change` | KYC 状态变更 | KYC 事件 |
| `defi_account_bind_status` | DeFi 账户绑定状态 | DeFi 事件 |
| `defi_account_auth_status` | DeFi 账户授权状态 | DeFi 事件 |
| `order_status_change` | 订单状态变更 | 订单事件 |

### 2.3 编辑 / 删除 Webhook
- 支持修改 URL 和订阅事件
- 删除需二次确认，关联的推送日志一并清理

## 3. Webhook 测试

- 在配置列表中点击「测试」按钮
- 系统向配置的 URL 发送一条模拟测试消息
- 在推送日志中查看测试结果
- 可验证端点连通性和接收端逻辑

## 4. 推送日志

### 4.1 日志内容

| 字段 | 说明 |
|------|------|
| 事件类型 | 触发的事件名称 |
| 推送状态 | pending / success / retry_pending / final_failed |
| HTTP 响应状态码 | 接收端返回的状态码 |
| 重试次数 | 当前已重试次数（0-5） |
| 推送时间 | 推送发起时间 |

### 4.2 查看方式
- 左侧选择 Webhook 配置
- 右侧面板展示该配置的所有推送日志

## 5. 推送机制

### 5.1 请求格式

```
HTTP Headers:
  Content-Type: application/json
  X-Webhook-Secret: {签名密钥}
  X-Webhook-Event: {事件类型}

Body:
{
  "event": "order.created",
  "timestamp": "2024-03-03T10:30:00Z",
  "data": {
    "orderId": "ORD20240303001",
    "amount": 100.00,
    "currency": "USD",
    "status": "pending"
  }
}
```

### 5.2 重试策略

| 重试次数 | 等待时间 | 说明 |
|----------|----------|------|
| 第 1 次 | 1 秒 | 指数退避 |
| 第 2 次 | 2 秒 | |
| 第 3 次 | 4 秒 | |
| 第 4 次 | 8 秒 | |
| 第 5 次 | 16 秒 | 最后一次尝试 |

- 5 次重试后仍失败，状态标记为 `final_failed`
- 日志中展示告警提示

### 5.3 推送状态说明

| 状态 | 含义 |
|------|------|
| `pending` | 等待推送 |
| `success` | 推送成功（收到 2xx 响应） |
| `retry_pending` | 推送失败，等待重试 |
| `final_failed` | 5 次重试后最终失败 |

## 6. 接收端实现指南

### 6.1 安全要求
1. **验证签名密钥**: 校验 `X-Webhook-Secret` 请求头
2. **实现幂等性**: 同一事件可能因重试多次推送，需按事件 ID 去重
3. **快速响应**: 5 秒内返回 2xx 响应，避免超时
4. **异步处理**: 耗时操作放到后台队列
5. **HTTPS**: 生产环境必须使用 HTTPS

### 6.2 接收端示例（Node.js）

```javascript
app.post('/webhook', express.json(), (req, res) => {
  // 1. 验证签名密钥
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  // 2. 获取事件信息
  const eventType = req.headers['x-webhook-event'];
  const event = req.body;

  // 3. 快速返回 200
  res.status(200).send('OK');

  // 4. 异步处理
  processEventAsync(event).catch(console.error);
});
```

## 7. 验收标准

- [ ] 可创建 Webhook，填写 URL 和选择事件类型
- [ ] 创建后自动生成签名密钥
- [ ] 「测试」按钮发送模拟消息并展示结果
- [ ] 推送日志展示事件类型、状态、响应码、重试次数
- [ ] 推送失败自动重试（指数退避，最多 5 次）
- [ ] 5 次失败后标记为 final_failed 并展示告警
- [ ] 删除 Webhook 需二次确认
- [ ] 生产/沙箱环境的 Webhook 配置和日志独立
