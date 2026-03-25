# Task-026d: 统一入驻申请 — 文件上传 + 确认提交 + 合规声明

## Status: Verifying

## PRD Reference
docs/prd/15-unified-merchant-application.md — §3.4 文件上传, §3.5 确认提交, §5 状态流转

## Scope
- 前端: Step 4 文件上传 UI（拖拽上传、文件列表、删除）
- 前端: Step 5 确认提交（信息预览 + 合规声明 + 提交按钮）
- 前端: 主页面重写支持 5 步（生产）/ 4 步（沙箱）
- 前端: submit/resubmit 功能
- 前端: i18n 新增 30+ keys
- 前端: CLAUDE.md 路由文档更新

## Development Plan
- [x] 1. 创建 step-documents.tsx（文件上传 UI：拖拽/点击上传、已上传文件展示、删除）
- [x] 2. 创建 step-confirm.tsx（信息预览 + 编辑按钮 + 合规声明 3 项复选框）
- [x] 3. 重写 page.tsx（5 步/4 步环境感知、submit/resubmit、NEED_MORE_INFO 展示）
- [x] 4. 添加 i18n keys（文件上传 + 确认提交 + 合规声明，en + zh）
- [x] 5. 更新 CLAUDE.md 路由结构
- [x] 6. pnpm build 通过, 16 test files / 70 tests passing

## Execution Log

### 2026-03-25 19:40
- 新建 2 个组件:
  - `step-documents.tsx`: 按类型分区的文件上传（公司文件/法人证件/UBO证件/银行证明/可选），支持拖拽上传、进度状态、删除
  - `step-confirm.tsx`: 全信息预览（6 区块各带编辑按钮）+ 合规声明 3 项勾选
- 重写 page.tsx:
  - 生产环境 5 步（公司→法人→业务→文件→确认），沙箱 4 步（跳过文件上传）
  - submit/resubmit 功能，合规声明全勾选才能提交
  - NEED_MORE_INFO 状态展示补充项列表
  - 审核等待页增加沙箱提示
- i18n: 30+ 新 key 覆盖文件上传/合规声明/步骤标签
- CLAUDE.md: 路由结构从 kyb + onboarding 改为 application

## Next Step
清理旧 KYB/Onboarding 页面代码（可选，低优先级）
