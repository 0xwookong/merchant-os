# Task-021: 成员与权限管理

## Status: In Progress

## PRD Reference
docs/prd/10-member-permission.md

## Scope
- 前端: `/business/members` 页面（成员列表 + 邀请对话框 + 移除）
- 后端:
  - `GET /api/v1/members` — 成员列表
  - `POST /api/v1/members/invite` — 邀请成员（发邮件）
  - `DELETE /api/v1/members/{id}` — 移除成员
- 数据库: 复用 t_merchant_user（添加 invited_by 字段暂不需要，邀请状态用 email_verified 区分）

## Development Plan
- [ ] 1. Backend: MemberService + MemberController (list/invite/remove)
- [ ] 2. Backend tests
- [ ] 3. Frontend: memberService + i18n + page + test
