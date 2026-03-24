# Task-016: API 文档引擎 - 在线试用 (Try It)

## Status: Verifying

## PRD Reference
docs/prd/05-api-doc-engine.md — §2.5「在线试用（Try It）」

## Scope
- 前端: 在端点详情面板中添加 Try It 面板（填参数、发请求、展示响应）
- 后端: `POST /api/v1/docs/proxy` — 沙箱代理转发（解决 CORS，后端转发请求到 openapitest.osl-pay.com）
- 数据库: 无

## 设计要点

### 后端代理
- 前端不能直接请求 openapitest.osl-pay.com（CORS 限制）
- 后端代理: 接收前端请求参数，转发到沙箱 API，返回响应
- 仅限沙箱环境（X-Environment: sandbox），生产环境拒绝代理

### 前端 Try It 面板
- 在端点详情 Code Samples 下方新增 "Try It" 区域
- 自动根据端点 parameters + requestBody 生成表单字段
- Header 参数（appId, timestamp, sign）预填或自动计算
- 发送按钮 + 响应展示（状态码 + JSON body，语法高亮）
- Loading 状态 + 错误处理

## Test Cases (TDD)

### 后端功能测试
1. **代理转发**: POST /api/v1/docs/proxy + 有效参数 → 200，返回代理响应
2. **仅沙箱**: X-Environment: production → 400 "在线试用仅支持沙箱环境"
3. **缺失参数**: method/url 为空 → 400

### 后端安全测试
4. **未认证**: 无 JWT → 403
5. **URL 限制**: 仅允许转发到 openapitest.osl-pay.com 域名

### 前端功能测试
6. **渲染 Try It 区域**: 端点详情中显示 Try It 面板
7. **展示发送按钮**: Send Request 按钮可见

### 安全检查清单
- [x] 认证: 需要 JWT
- [x] 频率限制: 全局 RateLimitFilter
- [x] URL 白名单: 仅允许转发到沙箱域名，防 SSRF
- [x] 环境限制: 仅沙箱环境可用
- [x] 输入校验: URL/method/headers 校验

## Development Plan

### 后端
- [ ] 1. 创建 ProxyRequest/ProxyResponse DTO
- [ ] 2. 创建 DocsProxyService（HTTP 转发 + 域名白名单）
- [ ] 3. 在 DocsController 添加 POST /api/v1/docs/proxy
- [ ] 4. 编写后端测试

### 前端
- [ ] 5. 添加 i18n 翻译键
- [ ] 6. 在 docs page 端点详情中添加 TryItPanel 组件
- [ ] 7. 编写前端测试

## Execution Log

### 2026-03-24 19:20
- 后端: DocsProxyService（HttpClient 转发 + 域名白名单 SSRF 防护 + 仅沙箱环境）+ ProxyRequest/ProxyResponse DTO + DocsController 添加 POST /proxy
- 后端测试: 3 个新增全部通过（生产环境拒绝、非白名单域名拒绝、缺失参数拒绝）
- 前端: TryItPanel 组件（URL 预览 + App ID 输入 + JSON body 编辑器 + Send 按钮 + 响应暗色展示 + 状态码+耗时）
- 前端测试: 52 全部通过
- 全量: 后端 109 通过，前端 52 通过

## Next Step
Task-017: Webhook 配置管理
