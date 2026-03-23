# OSLPay Merchant Portal - 产品概述

## 1. 产品定位

OSLPay Merchant Portal 是一个面向加密货币支付商户的综合性 B2B 门户平台，服务于商户的业务人员和技术人员，提供从入驻申请、业务运营到技术集成的全链路支持。

## 2. 产品愿景

打造 **Crypto 支付行业最 AI 友好的商户服务平台**，通过将传统的 API 文档转换为 AI 可解析的结构化格式，结合 MCP（Model Context Protocol）协议支持，让商户的技术团队能够借助 AI 编程助手（Cursor、Windsurf、Claude 等）在数分钟内完成 API 集成，将传统数天的对接周期缩短至数小时。

## 3. 目标用户

| 角色 | 职责 | 核心诉求 |
|------|------|----------|
| **管理员（Admin）** | 商户账户管理、团队管理、全局配置 | 全面掌控商户状态，高效管理团队权限 |
| **业务人员（Business）** | 入驻申请、交易数据查看、报表导出 | 快速完成入驻，实时了解业务运营状况 |
| **技术人员（Technical）** | API 集成、签名调试、Webhook 配置 | 快速理解 API、高效完成技术对接 |

## 4. 核心价值主张

### 4.1 AI 驱动的开发体验（核心差异化）
- **AI Context Block**: 每个 API 端点自动生成结构化元数据，AI 编程助手可直接解析
- **场景化 AI 提示词**: 一键生成「代码生成」「测试生成」「错误调试」「依赖分析」四类 AI 提示词
- **MCP Server**: 支持 AI 编程助手通过 SSE 远程连接直接调用 OSLPay API，自动处理签名
- **多语言代码生成**: 基于 OpenAPI 规范自动生成 Java、Go、TypeScript、Python、Rust、cURL 代码示例

### 4.2 双环境隔离
- 生产环境与沙箱环境完全独立，全局一键切换
- 沙箱提供测试卡号、测试账号、简化审核流程
- API 端点、入驻流程、数据存储均按环境隔离

### 4.3 全链路商户服务
- 从注册 → KYB 认证 → 入驻申请 → API 集成 → 业务运营的完整闭环
- 草稿自动保存、申请进度追踪、实时 Webhook 通知

### 4.4 角色化权限管理
- 基于角色的菜单过滤和页面访问控制
- 管理员可邀请团队成员并分配角色
- 全操作审计日志

## 5. 产品模块全景

```
OSLPay Merchant Portal
├── 认证与账户
│   ├── 商户注册/登录
│   ├── KYB 引导认证
│   └── 成员与权限管理
├── 商户入驻
│   ├── 入驻申请（多步骤表单 + 草稿）
│   └── 申请进度追踪
├── 业务运营
│   ├── 数据仪表盘（指标概览 + 图表）
│   └── 订单管理（列表 + 详情 + 导出）
├── 开发者套件
│   ├── 快速开始指南（WebSDK / OpenAPI）
│   ├── API 文档引擎（AI 友好交互式文档）
│   ├── API 凭证管理
│   ├── 签名与加密工具
│   ├── Webhook 管理
│   ├── 域名白名单
│   ├── API 请求日志
│   └── MCP 配置中心
└── 系统基础
    ├── 全局环境切换（生产/沙箱）
    ├── 菜单导航（层级化 + 权限过滤）
    └── 国际化（中/英）
```

## 6. 业务支撑的支付能力

OSLPay 的核心支付能力（由 OpenAPI 提供）包括：

| 能力 | 说明 |
|------|------|
| 法币到加密货币购买 | 支持 USD、EUR 等法币购买 BTC、ETH、USDT 等加密货币 |
| 多支付方式 | 银行卡（Visa/Mastercard）、Google Pay、Apple Pay |
| 多链支持 | ERC20、TRC20、BEP20、Polygon、Arbitrum、Optimism、Solana 等 |
| 3DS 安全验证 | 支持 3DS Frictionless 和 3DS Challenge 模式 |
| KYC/KYB 合规 | 用户身份验证和商户资质认证 |
| Webhook 事件推送 | 订单状态变更、KYC 状态、DeFi 账户绑定等实时通知 |

## 7. 技术架构概要

| 层次 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | Next.js 16 + React 19 + TypeScript + Tailwind CSS V4 | SSR/SSG、类型安全、原子化样式 |
| UI 组件 | Radix UI | 无障碍可访问的基础组件 |
| 后端 | Java (JDK 25) + Spring Boot 3.5.7 | 企业级服务框架 |
| 数据库 | MySQL | 商户数据、审计日志等结构化存储 |
| 缓存 | Redis | API 文档缓存、会话管理 |
| 配置中心 | Apollo | 多环境配置管理（功能开关、端点地址） |
| 任务调度 | XXL-Job | Webhook 重试、报表生成等定时任务 |
| AI 协议 | MCP (Model Context Protocol) | AI 编程助手远程调用接口 |

## 8. 文档索引

| 文档 | 说明 |
|------|------|
| [01-user-roles.md](./01-user-roles.md) | 用户角色与权限体系 |
| [02-registration-kyb.md](./02-registration-kyb.md) | 商户注册、登录与 KYB 认证 |
| [03-merchant-onboarding.md](./03-merchant-onboarding.md) | 商户入驻申请流程 |
| [04-dashboard-orders.md](./04-dashboard-orders.md) | 业务数据仪表盘与订单管理 |
| [05-api-doc-engine.md](./05-api-doc-engine.md) | API 文档引擎（核心亮点） |
| [06-developer-console.md](./06-developer-console.md) | 开发者控制台与环境管理 |
| [07-signature-tools.md](./07-signature-tools.md) | 签名与加密工具 |
| [08-webhook-management.md](./08-webhook-management.md) | Webhook 管理 |
| [09-mcp-integration.md](./09-mcp-integration.md) | MCP Server 与 AI 集成 |
| [10-member-permission.md](./10-member-permission.md) | 成员与权限管理 |
| [11-domain-whitelist.md](./11-domain-whitelist.md) | 域名白名单管理 |
| [12-api-request-logs.md](./12-api-request-logs.md) | API 请求日志 |
| [13-menu-navigation.md](./13-menu-navigation.md) | 菜单结构与导航 |
| [14-business-flows.md](./14-business-flows.md) | 核心业务流程总览 |
