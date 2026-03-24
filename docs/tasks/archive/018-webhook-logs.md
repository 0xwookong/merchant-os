# Task-018: Webhook 推送日志

## Status: Planning

## PRD Reference
docs/prd/08-webhook-management.md — §4「推送日志」

## Scope
- 前端: 在 webhooks 页面添加推送日志面板（选择配置 → 查看日志列表）
- 后端: `GET /api/v1/webhooks/{id}/logs` — 推送日志列表
- 数据库: 新增 `t_webhook_log` 表

## Test Cases
1. **日志列表**: GET /api/v1/webhooks/{id}/logs → 200
2. **未认证**: → 403
3. **租户隔离**: 不能查看其他商户的日志
4. **前端**: 渲染日志列表

## Development Plan
- [ ] 1. t_webhook_log 表 + Entity + Mapper
- [ ] 2. WebhookService 添加 logs 方法 + Controller 添加端点
- [ ] 3. 后端测试
- [ ] 4. 前端: 日志面板 + i18n + 测试

## Next Step
Task-019: 域名白名单
