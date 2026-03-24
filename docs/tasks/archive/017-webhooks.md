# Task-017: Webhook 配置管理

## Status: Verifying

## PRD Reference
docs/prd/08-webhook-management.md — §2「Webhook 配置」、§3「Webhook 测试」

## Scope
- 前端: `/developer/webhooks` 页面（配置列表 + 创建/编辑对话框 + 测试按钮）
- 后端: Webhook CRUD + 测试推送
  - `GET /api/v1/webhooks` — 列表
  - `POST /api/v1/webhooks` — 创建（自动生成 secret）
  - `PUT /api/v1/webhooks/{id}` — 更新
  - `DELETE /api/v1/webhooks/{id}` — 删除
  - `POST /api/v1/webhooks/{id}/test` — 测试推送
- 数据库: 新增 `t_webhook_config` 表

> 注: 5 个端点均为 CRUD + 测试推送，属于一个逻辑模块

## Test Cases (TDD)

### 后端功能测试
1. **创建 Webhook**: 有效 URL + 事件 → 200，自动生成 secret
2. **列表查询**: 返回当前商户的所有 webhook 配置
3. **更新 Webhook**: 修改 URL + 事件 → 200
4. **删除 Webhook**: 删除后列表不再包含
5. **测试推送**: 发送测试消息到配置的 URL

### 后端安全测试
6. **未认证**: → 403
7. **租户隔离**: 商户 A 不能操作商户 B 的配置
8. **URL 校验**: 非法 URL → 400

### 安全检查清单
- [x] 认证 + 租户隔离 + 频率限制 + 输入校验 + HTTP 状态码

## Development Plan
- [ ] 1. 新增 t_webhook_config 表 + Entity + Mapper
- [ ] 2. 创建 DTO + WebhookService + WebhookController
- [ ] 3. 编写后端测试
- [ ] 4. 前端 webhookService + i18n + page + test

## Execution Log

### 2026-03-24 19:30
- 后端: t_webhook_config 表 + Entity + Mapper + WebhookService（CRUD + 测试推送 + secret 自动生成）+ WebhookController（5 endpoints）
- 后端测试: 7 个全部通过（创建+secret、列表、更新、删除、URL校验、未认证、租户隔离）
- 前端: webhookService.ts + i18n + webhooks page（配置列表+创建/编辑表单+事件多选+测试推送+secret 复制+删除确认）
- 前端测试: 3 个全部通过
- 更新 11 个既有测试文件 FK 清理
- 全量: 后端 116 通过，前端 55 通过

## Next Step
Task-018: Webhook 推送日志
