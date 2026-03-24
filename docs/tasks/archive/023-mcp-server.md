# Task-023: MCP Server 实现

## Status: In Progress

## PRD Reference
docs/prd/09-mcp-integration.md — §2「MCP Server」

## Scope
- 后端: MCP SSE 端点 + 6 个工具实现
  - `GET /api/v1/mcp/sse` — SSE 连接（推送工具定义）
  - `POST /api/v1/mcp/tools/call` — 工具调用
- 6 个工具: getQuote, createOrder, queryOrder, generateSignature, getCurrencyList, getGuide

## Development Plan
- [ ] 1. MCP 协议 DTO（ToolDefinition, ToolCallRequest, ToolCallResponse）
- [ ] 2. McpToolService（6 个工具实现）
- [ ] 3. McpController（SSE + tool call endpoint）
- [ ] 4. 后端测试
