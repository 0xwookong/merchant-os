# MCP Server 与 AI 集成

## 1. 功能概述

MCP（Model Context Protocol）集成是 OSLPay 的前沿特性，让技术人员通过 AI 编程助手（Cursor、Windsurf、Claude 等）直接调用 OSLPay API，无需手动处理签名逻辑。包含两部分：**MCP Server**（远程服务）和 **MCP 配置中心**（Portal 页面）。

**适用角色**: 管理员、技术人员

## 2. MCP Server

### 2.1 架构
- 部署为远程服务，AI 助手通过 SSE（Server-Sent Events）协议连接
- 无需本地安装任何服务
- 由 OSLPay 团队维护和更新

### 2.2 端点地址

| 环境 | API 端点 | MCP 端点 |
|------|----------|----------|
| 生产 | `https://openapi.osl-pay.com` | `https://mcp.osl-pay.com/sse` |
| 沙箱 | `https://openapitest.osl-pay.com` | `https://mcptest.osl-pay.com/sse` |

### 2.3 提供的工具（6 个）

| 工具名称 | 功能描述 | 用途 |
|----------|----------|------|
| `oslpay_get_quote` | 获取法币到加密货币的报价 | 查询汇率和费用 |
| `oslpay_create_order` | 创建支付订单 | 发起支付请求 |
| `oslpay_query_order` | 查询订单状态 | 追踪订单进度 |
| `oslpay_generate_signature` | 生成 API 请求签名 | RSA SHA256withRSA 签名 |
| `oslpay_get_currency_list` | 获取支持的加密货币列表 | 查询可用币种 |
| `oslpay_get_guide` | 获取快速开始指南 | AI 可读的结构化数据 |

### 2.4 自动处理能力
- **自动签名**: 每次 API 调用自动生成 RSA SHA256withRSA 签名
- **自动添加请求头**: `X-App-Id`, `X-Timestamp`, `X-Signature`
- **环境感知**: 根据配置的 MCP URL 自动识别生产/沙箱环境
- **错误处理**: API 调用失败时返回详细错误信息和解决建议

### 2.5 技术实现
- 使用 TypeScript 实现
- 支持编译为 Node.js 可执行文件
- 实现标准 MCP 协议
- 通过环境变量切换环境

## 3. MCP 配置中心（Portal 页面）

### 3.1 页面内容

1. **当前环境信息**: 展示 API 端点、MCP 端点和环境标识
2. **配置 JSON**: 展示当前环境的 MCP 配置，支持一键复制

```json
{
  "mcpServers": {
    "oslpay": {
      "url": "https://mcptest.osl-pay.com/sse",
      "transport": {
        "type": "sse"
      }
    }
  }
}
```

3. **可用工具列表**: 展示 6 个工具的名称和描述
4. **配置指南（5 步）**:
   - 步骤 1: 复制 MCP 配置
   - 步骤 2: 安装和构建 MCP Server（远程服务无需安装）
   - 步骤 3: 打开 AI 编程助手的配置文件
   - 步骤 4: 粘贴配置并保存
   - 步骤 5: 重启 AI 助手，开始使用
5. **示例提示词**: 展示自然语言调用示例
6. **技术支持**: 联系方式和文档链接

### 3.2 AI 编程助手配置

| 工具 | 配置路径 |
|------|----------|
| Cursor | 设置 → MCP → 编辑配置文件 |
| Windsurf | 设置 → Extensions → MCP |
| 其他 | `mcp.json` 或 `.mcp/config.json` |

### 3.3 使用示例

用户在 AI 助手中输入自然语言：
- "使用 OSL Pay API 获取 100 USD 到 USDT 的报价"
- "创建一个支付订单，金额 100 USD"
- "查询订单 ORD123456 的状态"
- "生成 API 请求签名"
- "如何集成 OSL Pay API？"

AI 助手自动：通过 SSE 连接 → 调用对应 MCP 工具 → 处理签名 → 添加请求头 → 返回结果。

## 4. 效率对比

| 操作 | 传统方式 | AI 辅助（MCP） | 提升 |
|------|----------|----------------|------|
| 实现签名 | 30-60 分钟 | 0 分钟（自动处理） | ∞ |
| 理解 API 调用顺序 | 15-30 分钟 | 0 分钟（AI 自动处理） | ∞ |
| 编写集成代码 | 1-2 小时 | 1-2 分钟（AI 生成） | 30-60x |
| 调试问题 | 30-60 分钟 | 2-5 分钟（AI 定位） | 10-15x |

## 5. 验收标准

- [ ] MCP Server 实现 6 个工具，符合 MCP 协议
- [ ] 每次 API 调用自动生成签名和添加请求头
- [ ] 支持通过环境变量切换生产/沙箱环境
- [ ] API 失败时返回详细错误信息和解决建议
- [ ] 配置中心页面展示当前环境配置 JSON
- [ ] 「复制配置」按钮正常工作
- [ ] 展示 6 个可用工具及描述
- [ ] 配置指南内容完整（5 步）
- [ ] 根据全局环境切换自动更新配置
