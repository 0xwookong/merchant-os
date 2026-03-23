# API 文档引擎（核心亮点）

## 1. 功能概述

API 文档引擎是 OSLPay Merchant Portal 的核心差异化功能，将 OpenAPI 3.0 规范文件解析为 **AI 编程友好的交互式文档**。技术人员或 AI 编程助手可通过结构化的 AI Context Block 快速理解并集成 API。

**适用角色**: 管理员、技术人员

## 2. 核心能力

### 2.1 OpenAPI 规范结构化转换
- 解析 OpenAPI 3.0 YAML/JSON 规范文件
- 每个端点包含完整的请求参数 Schema（字段名、类型、必填、枚举值、示例、描述）
- 每个端点包含完整的响应 Schema（成功 + 错误响应）
- 可复用数据模型定义为 `components/schemas`
- 端点间的调用顺序和数据依赖关系
- 完整错误码列表（错误码、消息、处理建议）

### 2.2 AI Context Block
每个 API 端点自动生成 AI Context Block，包含：
- 端点路径和方法
- 用途描述
- 输入/输出 JSON Schema
- 依赖端点列表
- 错误码
- 请求/响应示例
- AI 使用提示

### 2.3 场景化 AI 提示词
点击按钮一键复制结构化 AI 提示词到剪贴板：

| 场景 | 图标 | 用途 | AI 使用示例 |
|------|------|------|-------------|
| 生成代码 | 📋 | 生成 API 调用代码 | "请用 TypeScript 实现这个 API" |
| 生成测试 | 🧪 | 生成单元测试代码 | "生成 Jest 测试，覆盖正常和异常场景" |
| 调试错误 | 🐛 | 分析错误原因 | 附上错误信息和代码片段 |
| 理解依赖 | 🔗 | 解释接口依赖关系 | "这个 API 的完整调用流程是什么？" |

**使用流程**:
1. 选择 API 端点
2. 点击场景按钮
3. 提示词复制到剪贴板，显示「已复制到剪贴板」
4. 打开 AI 助手（Cursor / Claude / ChatGPT）
5. 粘贴提示词，补充具体需求

### 2.4 多语言代码生成
基于 OpenAPI 规范为每个端点生成代码示例：

| 语言 | 说明 |
|------|------|
| TypeScript | 使用 fetch/axios，含类型定义 |
| Python | 使用 requests，含类型提示 |
| Java | 使用 HttpClient，含完整类定义 |
| Go | 使用 net/http |
| Rust | 使用 reqwest |
| cURL | 命令行调用 |
| WebSDK | 前端 HTML/JavaScript 集成 |

代码示例包含：
- 完整请求构造（含 URL、Headers、Body）
- RSA SHA256withRSA 签名计算过程
- 响应解析逻辑
- 错误处理模式
- 对应语言的依赖包说明

### 2.5 在线试用（Try It）
- 支持填写请求参数
- 发送请求到沙箱环境端点（`openapitest.osl-pay.com`）
- 展示格式化的响应结果

## 3. API 端点分类

共 16 个 API 接口，按以下分类组织：

| 分类 | 接口数 | 说明 |
|------|--------|------|
| 用户管理（User Management） | 2 | 用户注册、KYC 查询 |
| 报价（Quote） | 1 | 获取法币到加密货币报价 |
| 订单（Order） | 3 | 创建订单、查询订单、订单列表 |
| 银行卡（Card） | 3 | 卡绑定、卡列表、卡删除 |
| 配置（Config） | 3 | 货币列表、网络列表、限额查询 |
| 商户（Merchant） | 2 | 商户信息、商户配置 |

每个接口详情页包含：
- HTTP 方法和路径
- 请求参数（header / query / path）
- 请求体结构（JSON Schema）
- 响应结构（成功和错误响应）
- 依赖关系说明
- 错误码列表
- 官方文档链接（新标签页打开）

## 4. 快速开始页面

提供两种集成模式的分步指引：

### 4.1 WebSDK 快速开始（4 步）

| 步骤 | 说明 |
|------|------|
| 1. 访问 Web SDK 测试页面 | 使用测试 appId 访问指定 URL |
| 2. 填写 KYC 信息 | 沙箱环境中 KYC 信息不验证 |
| 3. 使用测试卡号支付 | 提供 Visa 测试卡号（3DS Frictionless / Challenge / 失败） |
| 4. 查看支持的货币和网络 | 展示沙箱环境支持的法币、加密货币组合和限额 |

### 4.2 OpenAPI 快速开始（4 步）

| 步骤 | 说明 |
|------|------|
| 1. 获取 API 凭证 | 跳转开发者控制台复制 App ID 和公钥 |
| 2. 实现签名逻辑 | 签名字符串格式和 RSA 算法说明 |
| 3. 调用 API 接口 | 参考 API 文档进行调用 |
| 4. 配置 Webhook | 配置端点接收实时通知 |

### 4.3 结构化快速开始指南 API

提供供 AI 编程助手消费的结构化 JSON API：

| 端点 | 说明 |
|------|------|
| `GET /api/guides/getting-started` | 完整快速开始指南 JSON |
| `GET /api/guides/getting-started/{mode}` | 特定集成模式指南（websdk / openapi） |
| `GET /api/guides/common-issues` | 常见问题和解决方案 |

指南内容包含：模式 ID、名称、难度级别、预估时间、前置条件、详细步骤（含操作、预期结果、故障排查）、代码示例（Node.js / Python / Java）、测试数据、资源链接。

## 5. 文档引擎后端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/docs/spec` | 获取完整 OpenAPI 规范 |
| GET | `/api/docs/endpoints` | 获取端点列表（支持分类筛选） |
| GET | `/api/docs/endpoints/:path` | 获取单个端点详情 + AI Context Block |
| GET | `/api/docs/aicontext/:path` | 获取端点 AI Context Block（纯文本） |
| GET | `/api/docs/schemas` | 获取所有数据模型定义 |
| GET | `/api/docs/error-codes` | 获取完整错误码列表 |

## 6. 验收标准

- [ ] API 文档页面展示所有 16 个端点，支持按分类筛选
- [ ] 每个端点详情包含参数表、响应表、调用示例、依赖关系
- [ ] 4 种 AI 提示词按钮可用，点击后复制到剪贴板并显示提示
- [ ] 代码示例支持至少 TypeScript、Python、Java 三种语言
- [ ] 代码示例包含完整的签名计算逻辑
- [ ] 「在线试用」可发送请求到沙箱环境并展示响应
- [ ] 快速开始页面展示 WebSDK 和 OpenAPI 两种模式
- [ ] 结构化指南 API 返回正确的 JSON 数据
- [ ] 官方文档链接在新标签页打开
