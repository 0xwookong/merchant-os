# Task-014: API 文档引擎 - 端点列表与详情

## Status: Verifying

## PRD Reference
docs/prd/05-api-doc-engine.md — §2.1-2.2「OpenAPI 规范结构化转换」「AI Context Block」、§3「API 端点分类」、§5「文档引擎后端接口」

## Scope
- 前端: `/developer/docs` 页面（分类导航 + 端点列表 + 端点详情面板）
- 后端: 2 个 API
  - `GET /api/v1/docs/endpoints` — 端点列表（支持分类筛选）
  - `GET /api/v1/docs/endpoints/{operationId}` — 端点详情 + AI Context Block
- 数据源: 内置 OpenAPI 3.0 YAML 规范文件（描述 OSLPay 支付 API 的 16 个端点）

## 设计要点

### 数据源
- 后端 resources 目录下放置 `oslpay-openapi.yaml`（OSLPay 支付 API 规范）
- 应用启动时解析并缓存，不涉及数据库
- 每个端点提取: method, path, summary, description, tags, parameters, requestBody, responses

### 端点列表 API 响应结构
```json
{
  "categories": [
    { "key": "user", "label": "用户管理", "count": 2 },
    { "key": "quote", "label": "报价", "count": 1 },
    ...
  ],
  "endpoints": [
    {
      "operationId": "createUser",
      "method": "POST",
      "path": "/api/v1/users",
      "summary": "用户注册",
      "category": "user",
      "tags": ["User Management"]
    }
  ]
}
```

### 端点详情 API 响应结构
```json
{
  "operationId": "createUser",
  "method": "POST",
  "path": "/api/v1/users",
  "summary": "...",
  "description": "...",
  "category": "user",
  "parameters": [...],
  "requestBody": { "contentType": "application/json", "schema": {...}, "example": {...} },
  "responses": { "200": {...}, "400": {...} },
  "aiContextBlock": "structured AI-friendly text block"
}
```

### 前端页面布局
- 左侧: 分类导航（6 个分类）+ 搜索框
- 右侧: 端点列表 → 点击展开详情面板
- 详情面板: 请求参数表、响应结构、AI Context Block（可复制）

## Test Cases (TDD)

### 后端功能测试
1. **端点列表**: GET /api/v1/docs/endpoints → 200，返回 categories + endpoints
2. **分类筛选**: ?category=order → 仅返回订单相关端点
3. **端点详情**: GET /api/v1/docs/endpoints/createUser → 200，返回完整详情
4. **AI Context Block**: 详情响应中包含 aiContextBlock 字段
5. **不存在的端点**: GET /api/v1/docs/endpoints/notExist → 404

### 后端安全测试
6. **未认证访问**: 无 JWT → 403
7. **operationId 注入**: 特殊字符 operationId → 404（安全处理）

### 前端功能测试
8. **渲染分类导航**: 6 个分类可见
9. **渲染端点列表**: 显示端点方法 + 路径 + 摘要
10. **端点搜索**: 输入关键词过滤端点

### 安全检查清单
- [x] 认证: 需要 JWT
- [x] 频率限制: 全局 RateLimitFilter
- [x] 信息泄漏: 不涉及（公开 API 文档数据）
- [x] 输入校验: operationId 白名单匹配，category 枚举校验
- [x] 租户隔离: 不涉及（文档数据所有商户共享）
- [x] HTTP 状态码: 404 端点不存在
- [x] 日志安全: 无敏感数据

## Development Plan

### 后端
- [x] 1. 创建 `oslpay-openapi.yaml` 规范文件（16 个端点，6 个分类）
- [x] 2. 创建 DocEngineService（@PostConstruct 解析 + 内存缓存）
- [x] 3. 创建 DTO（EndpointSummary, EndpointDetail, CategoryInfo, EndpointListResult）
- [x] 4. 创建 DocsController（2 个 GET 端点）
- [x] 5. 编写后端测试 DocsApiTest（6 个测试）

### 前端
- [x] 6. 创建 docsService.ts
- [x] 7. 添加 i18n 翻译键（docs namespace，zh+en）
- [x] 8. 创建 /developer/docs/page.tsx（分类pills + 搜索 + 列表 + 详情面板 + AI Context Block）
- [x] 9. 编写前端测试（4 个测试）

## Execution Log

### 2026-03-24 18:57
- 后端: oslpay-openapi.yaml（16 端点，6 分类）+ DocEngineService（Jackson YAML 解析 + $ref 解析 + AI Context Block 生成）+ DocsController
- 后端测试: 6 个全部通过（列表、分类筛选、详情、AI Context、404、未认证）
- 前端: docsService.ts + i18n + docs page（搜索框 + 分类 pills + 端点列表 + 详情面板 + 参数表 + 响应 JSON + AI Context 暗色代码块）
- 前端测试: 4 个全部通过
- 全量: 后端 106 通过，前端 52 通过

## Next Step
Task-015: API 文档引擎 - AI 提示词与代码生成
