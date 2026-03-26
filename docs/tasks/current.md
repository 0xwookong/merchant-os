# Task-030: 通知系统

## Status: In Progress

## 背景
商户无法感知系统事件（申请状态变更、Webhook 投递失败、密钥轮换等），需要顶栏通知铃铛 + 下拉面板。

## 设计决策
- **展示方式**: 顶栏铃铛图标 + 未读数角标 + 下拉面板（不新建独立页面）
- **数据获取**: 轮询（30s），不做 WebSocket（MVP 阶段）
- **通知类型**: APPLICATION_STATUS（申请状态变更）、WEBHOOK_FAILED（推送失败）、CREDENTIAL_ROTATED（密钥轮换）、MEMBER_INVITED（成员邀请）、SECURITY_ALERT（安全事件）
- **标记已读**: 单条标记 + 全部标记

## Scope
- 后端: `t_notification` 表 + `GET /api/v1/notifications` + `PUT /api/v1/notifications/read`
- 前端: 顶栏铃铛组件 + 下拉通知面板
- 不含: 通知触发逻辑（后续在各业务模块中逐步接入）

## Development Plan
- [ ] 1. 后端: t_notification 建表 + Entity + Mapper
- [ ] 2. 后端: NotificationController (GET list + PUT mark read)
- [ ] 3. 后端: mvn compile
- [ ] 4. 前端: notificationService.ts
- [ ] 5. 前端: NotificationBell 组件（铃铛+角标+下拉面板）
- [ ] 6. 前端: 集成到 topbar
- [ ] 7. 前端: i18n
- [ ] 8. 验证: pnpm build

## Next Step
Task-031: 申请状态时间线
