# MCP Server 与 AI 集成

## 1. 功能概述

MCP（Model Context Protocol）集成是 OSLPay 的前沿特性，让技术人员通过 AI 编程助手（Cursor、Windsurf、Claude Code 等）直接调用 OSLPay API，无需手动处理签名逻辑。包含两部分：

- **MCP Server**（独立 TypeScript 项目，npm 包，本地 stdio 运行）— 需求14
- **MCP 配置中心**（Portal 前端页面，帮助商户快速获取配置）— 需求15

**适用角色**: 管理员、技术人员

## 2. MCP Server（需求14）

### 2.1 架构

```
开发者的 AI 助手 ──stdio──→ 本地 MCP Server 进程 ──HTTPS──→ openapi.osl-pay.com
                           (TypeScript / Node.js)            (OSLPay API)

密钥流向：
  开发者本地 private.pem → 本地 MCP Server 进程 → 本地签名 → 发送带签名的请求
  （私钥始终不离开开发者的机器）
```

**核心设计决策**：

| 方案 | 传输协议 | 私钥位置 | 选择 |
|------|----------|----------|------|
| 远程 SSE | SSE 长连接到 mcp.osl-pay.com | 远程服务器托管（安全风险高） | ❌ 不采用 |
| **本地 stdio** | AI 助手 spawn 本地进程 | **开发者本地（私钥永不外传）** | ✅ **采用** |

**选择理由**：
1. **支付系统的 RSA 私钥是最高敏感凭证**，不能传输到远程服务器
2. 本地 stdio 模式天然实现租户隔离（每个商户独立进程）
3. `npx` 自动下载运行，便捷性接近远程 SSE
4. 零服务端运维成本（无需部署/维护公网 MCP Server）
5. 与行业标准一致（Stripe、Shopify 等均采用 npm 包 + stdio 模式）

### 2.2 项目结构

MCP Server 作为独立项目，位于 monorepo 根目录 `mcp-server/`：

```
mcp-server/
├── package.json            # name: "oslpay-mcp-server"
├── tsconfig.json
├── README.md               # 安装、配置、使用说明
├── src/
│   ├── index.ts            # 入口，MCP Server 初始化
│   ├── tools/              # 6 个工具实现
│   │   ├── get-quote.ts
│   │   ├── create-order.ts
│   │   ├── query-order.ts
│   │   ├── generate-signature.ts
│   │   ├── get-currency-list.ts
│   │   └── get-guide.ts
│   ├── signing.ts          # RSA SHA256withRSA 签名逻辑
│   ├── api-client.ts       # HTTP 客户端（调用 openapi.osl-pay.com）
│   └── config.ts           # 环境变量解析
├── tests/                  # 测试
└── dist/                   # 编译输出
```

### 2.3 环境变量

| 变量 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `OSLPAY_APP_ID` | ✅ | 商户 AppId | `app_xxxxxx` |
| `OSLPAY_PRIVATE_KEY_PATH` | ✅ | RSA 私钥文件路径 | `./keys/private.pem` |
| `OSLPAY_ENV` | ❌ | 环境（默认 `sandbox`） | `sandbox` \| `production` |

环境决定 API 端点：

| 环境 | API 端点 |
|------|----------|
| `sandbox` | `https://openapitest.osl-pay.com` |
| `production` | `https://openapi.osl-pay.com` |

### 2.4 提供的工具（6 个）

| 工具名称 | 功能描述 | 用途 |
|----------|----------|------|
| `oslpay_get_quote` | 获取法币到加密货币的报价 | 查询汇率和费用 |
| `oslpay_create_order` | 创建支付订单 | 发起支付请求 |
| `oslpay_query_order` | 查询订单状态 | 追踪订单进度 |
| `oslpay_generate_signature` | 生成 API 请求签名 | RSA SHA256withRSA 签名 |
| `oslpay_get_currency_list` | 获取支持的加密货币列表 | 查询可用币种 |
| `oslpay_get_guide` | 获取快速开始指南 | AI 可读的结构化数据 |

### 2.5 自动处理能力

- **自动签名**: 每次 API 调用自动读取本地私钥，生成 RSA SHA256withRSA 签名
- **自动添加请求头**: `X-App-Id`, `X-Timestamp`, `X-Signature`
- **环境感知**: 根据 `OSLPAY_ENV` 环境变量自动选择 API 端点
- **错误处理**: API 调用失败时返回详细错误信息和解决建议

### 2.6 安全模型

| 维度 | 设计 |
|------|------|
| 私钥存储 | 仅存在于开发者本地文件系统，通过文件路径引用 |
| 签名生成 | 本地进程内完成，签名字符串 `appId=[appId]&timestamp=[timestamp]` |
| 网络传输 | 仅发送签名后的 HTTPS 请求到 OSLPay API，私钥本身不传输 |
| 进程隔离 | stdio 模式下每个 AI 助手会话独立进程，天然租户隔离 |
| 权限最小化 | MCP Server 仅读取私钥文件，不写入任何本地文件 |

### 2.7 技术实现

- 使用 TypeScript 实现
- 使用 `@modelcontextprotocol/sdk` 官方 SDK
- 传输协议: `stdio`（AI 助手通过 stdin/stdout 通信）
- 支持编译为 Node.js 可执行文件
- 发布为 npm 包（`oslpay-mcp-server`），支持 `npx` 一键运行
- 提供完整 README 文档

### 2.8 验收标准（需求14）

- [ ] 实现 6 个工具，符合 MCP 协议（stdio 传输）
- [ ] 每次 API 调用从本地私钥生成签名并自动添加请求头
- [ ] 支持通过环境变量切换生产/沙箱环境
- [ ] API 失败时返回详细错误信息和解决建议
- [ ] TypeScript 实现，支持编译为 Node.js 可执行文件
- [ ] 提供完整 README 文档（安装、配置、使用方法）
- [ ] 通过 `npx oslpay-mcp-server` 可直接运行
- [ ] 私钥始终在本地，不通过网络传输

## 3. MCP 配置中心（需求15 — Portal 页面）

### 3.1 页面内容

1. **场景说明**: 说明 MCP 是什么、适合什么场景
2. **配置 JSON**: 展示当前环境的 MCP 配置（stdio 格式），支持一键复制

```json
{
  "mcpServers": {
    "oslpay": {
      "command": "npx",
      "args": ["-y", "oslpay-mcp-server"],
      "env": {
        "OSLPAY_APP_ID": "app_xxxxxx",
        "OSLPAY_PRIVATE_KEY_PATH": "./keys/private.pem",
        "OSLPAY_ENV": "sandbox"
      }
    }
  }
}
```

  - `OSLPAY_APP_ID`: 从当前商户凭证自动填入（如果已创建凭证）
  - `OSLPAY_PRIVATE_KEY_PATH`: 默认占位，用户需修改为自己的私钥路径
  - `OSLPAY_ENV`: 跟随全局环境切换（sandbox / production）

3. **可用工具列表**: 展示 6 个工具的名称和描述
4. **配置指南（3 步）**:
   - 步骤 1: 复制 MCP 配置 JSON
   - 步骤 2: 打开 AI 编程助手的 MCP 配置文件，粘贴配置
   - 步骤 3: 将 `OSLPAY_PRIVATE_KEY_PATH` 修改为你的私钥文件实际路径，重启 AI 助手
5. **示例提示词**: 展示自然语言调用示例
6. **技术支持**: 联系方式和文档链接

### 3.2 AI 编程助手配置路径

| 工具 | 配置路径 |
|------|----------|
| Claude Code | `~/.claude/settings.json` → `mcpServers` |
| Cursor | 设置 → MCP → 编辑配置文件（`~/.cursor/mcp.json`） |
| Windsurf | 设置 → Extensions → MCP（`~/.codeium/windsurf/mcp_config.json`） |
| VS Code (Copilot) | `.vscode/mcp.json` |

### 3.3 使用示例

用户在 AI 助手中输入自然语言：
- "使用 OSL Pay API 获取 100 USD 到 USDT 的报价"
- "创建一个支付订单，金额 100 USD"
- "查询订单 ORD123456 的状态"
- "生成 API 请求签名"
- "如何集成 OSL Pay API？"

AI 助手自动：spawn 本地 MCP Server → 调用对应工具 → 本地签名 → 发送请求 → 返回结果。

### 3.4 验收标准（需求15）

- [ ] 配置中心页面展示 stdio 格式的 MCP 配置 JSON
- [ ] AppId 从当前商户凭证自动填入（已创建凭证时）
- [ ] `OSLPAY_ENV` 跟随全局环境切换自动更新
- [ ] 「复制配置」按钮正常工作，显示「已复制」反馈
- [ ] 展示 6 个可用工具及描述
- [ ] 配置指南简化为 3 步，内容准确
- [ ] 提供示例提示词
- [ ] 仅对管理员和技术开发角色显示 MCP 配置中心菜单

## 4. 清理项

由于架构从远程 SSE 改为本地 stdio，以下代码需要清理：

- [ ] 删除后端 `mcp/` 包（`McpController`, `McpToolService`, `McpToolDefinition`, `McpToolCallRequest`, `McpToolCallResponse`）
- [ ] 删除后端 MCP 测试（`McpApiTest`）
- [ ] 移除 `SecurityConfig` 中 `/api/v1/mcp/**` 的 `permitAll()` 规则
- [ ] 移除 `application.yml` 中 `oslpay.mcp.*` 配置项
- [ ] 更新前端 MCP 页面：SSE 配置 JSON → stdio 配置 JSON
- [ ] 更新前端 MCP 页面：5 步指南 → 3 步指南
- [ ] 更新 i18n locale 文件中 MCP 相关的翻译

## 5. 效率对比

| 操作 | 传统方式 | AI 辅助（MCP） | 提升 |
|------|----------|----------------|------|
| 实现签名 | 30-60 分钟 | 0 分钟（自动处理） | ∞ |
| 理解 API 调用顺序 | 15-30 分钟 | 0 分钟（AI 自动处理） | ∞ |
| 编写集成代码 | 1-2 小时 | 1-2 分钟（AI 生成） | 30-60x |
| 调试问题 | 30-60 分钟 | 2-5 分钟（AI 定位） | 10-15x |
