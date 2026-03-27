# Task-038: MCP 后端清理 + 前端配置中心重构

## Status: Planning

## PRD Reference
docs/prd/09-mcp-integration.md — §3「MCP 配置中心」+ §4「清理项」

## Scope
- 后端: 删除 `mcp/` 包（5 个 Java 文件）+ 测试 + SecurityConfig 规则 + application.yml 配置
- 前端: MCP 配置中心页面重构（SSE → stdio 配置 JSON，5 步 → 3 步指南，AppId 占位自动填入）
- i18n: 更新 en.js / zh.js 中 MCP 相关翻译（删除废弃 key，新增/修改 key）
- 数据库: 无
- 不涉及新 API 端点

## Test Cases (TDD: 先写测试，后写实现)

### 功能测试

1. **前端 - stdio 配置 JSON 正确渲染**: 页面展示 `command: "npx"` 格式的 JSON，包含 `OSLPAY_APP_ID`、`OSLPAY_PRIVATE_KEY_PATH`、`OSLPAY_ENV` → 预期 JSON 结构正确
2. **前端 - 环境切换联动**: sandbox 环境下 `OSLPAY_ENV` 为 `"sandbox"`，切换 production 后变为 `"production"` → 预期 JSON 自动更新
3. **前端 - 复制配置按钮**: 点击「复制配置」→ 剪贴板写入 stdio 格式 JSON，按钮显示「已复制」
4. **前端 - 3 步指南渲染**: 配置指南展示 3 步（非 5 步）→ 步骤内容与 PRD §3.1 一致
5. **前端 - 工具列表仍展示 6 个工具**: 工具列表不变 → 6 个工具卡片正确渲染
6. **后端 - MCP 端点已移除**: `GET /api/v1/mcp/sse`、`POST /api/v1/mcp/tools/call`、`GET /api/v1/mcp/tools` 均返回 404（或被 Security 拦截 401）
7. **后端 - 编译通过**: `mvn compile` 无错误（无残留 MCP 引用）
8. **前端 - 构建通过**: `pnpm build` 无错误

### 安全测试
1. **MCP permitAll 已移除**: `/api/v1/mcp/sse` 不再公开放行，未认证请求返回 401
2. **无残留公开端点**: SecurityConfig 中不存在 `/api/v1/mcp/**` 规则

### 安全检查清单
- [x] 认证: 本任务移除公开 MCP 端点，无新增端点
- [x] 频率限制: 无新增端点，N/A
- [x] 信息泄漏: 移除了公开暴露的 MCP 工具端点，减少攻击面
- [x] 输入校验: 无新增输入，N/A
- [x] 租户隔离: 无新增数据查询，N/A
- [x] 审计日志: 无新增操作，N/A
- [x] HTTP 状态码: N/A
- [x] PII 脱敏: N/A

## Development Plan

### 后端清理
- [ ] 1. 删除 `backend/src/main/java/com/osl/pay/portal/mcp/` 目录（5 个文件: McpController, McpToolService, McpToolDefinition, McpToolCallRequest, McpToolCallResponse）
- [ ] 2. 删除 `backend/src/test/java/com/osl/pay/portal/mcp/McpApiTest.java`
- [ ] 3. SecurityConfig.java: 移除 `.requestMatchers("/api/v1/mcp/**").permitAll()` 行
- [ ] 4. application.yml: 移除 `oslpay.mcp` 配置块（production-url, sandbox-url）
- [ ] 5. 验证 `mvn compile` 通过，无残留 MCP 引用

### 前端重构
- [ ] 6. 更新 i18n en.js: 删除 `mcp.env.*`（不再展示环境端点区块），修改 `mcp.config.desc`，将 `mcp.guide.step1-5` 改为 `step1-3`（3 步指南），新增 `mcp.config.notePrivateKey` 提示
- [ ] 7. 更新 i18n zh.js: 同上
- [ ] 8. 重构 `frontend/src/app/(portal)/developer/mcp/page.tsx`:
   - 配置 JSON: SSE URL 格式 → stdio command+env 格式
   - 移除「当前环境」卡片（环境信息已融入 JSON 的 `OSLPAY_ENV`）
   - 配置指南: 5 步 → 3 步
   - 新增私钥路径修改提醒
- [ ] 9. 更新前端测试 `page.test.tsx`（验证 stdio JSON、3 步指南）
- [ ] 10. 验证 `pnpm build` 通过

## Execution Log (倒序，最新的在上面)

(待开始)

## Next Step
Task-039: MCP Server - 项目初始化与签名工具（`mcp-server/` TypeScript 独立项目）
