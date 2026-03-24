# CR-001: 全面安全代码审查

## 审查时间: 2026-03-24
## 审查范围: Task-001 ~ Task-003 全部后端 + 前端代码

---

## CRITICAL（部署前必须修复）

| # | 问题 | 文件 | 说明 |
|---|------|------|------|
| C-1 | 敏感信息硬编码 | application.yml | DB 密码、JWT secret 明文写在代码中，无生产环境配置覆盖 |
| C-2 | Redis 无密码 | application.yml | Redis 存储 refresh token、重置 token 等，无认证保护 |
| C-3 | 生产邮件服务未实现 | SmtpEmailServiceImpl | prod profile 仍然 log.warn 输出 token，邮件功能不可用 |
| C-4 | PII 明文写入日志 | AuthServiceImpl, LogEmailServiceImpl | 用户邮箱、安全 token 出现在日志中，违反 GDPR/PDPA |

## HIGH（当前 Task 内必须修复）

| # | 问题 | 说明 |
|---|------|------|
| H-1 | 无请求频率限制 | 所有 auth 端点无 rate limiting，可被暴力攻击/DDoS |
| H-2 | Refresh Token 不轮换 | 刷新时不生成新 refresh token，被盗后可无限使用 |
| H-3 | 无登出端点 | 无法主动撤销会话 |
| H-4 | CORS 仅允许 localhost | 无生产环境配置 |
| H-5 | Swagger 生产环境暴露 | API 文档无条件公开 |
| H-6 | MyBatis SQL 日志 | 生产环境泄漏 SQL 语句 |
| H-7 | BizException 全返回 HTTP 200 | 安全监控工具无法区分成功/失败 |
| H-8 | 密码无最大长度限制 | BCrypt 72 字节限制，超长密码导致 DoS |

## MEDIUM（尽快修复）

| # | 问题 | 说明 |
|---|------|------|
| M-1 | CSRF 已禁用 | 当前 SPA + SameSite=Strict 可接受，需文档化 |
| M-2 | 注册泄漏公司名存在性 | 错误消息"该公司已注册"暴露商业信息 |
| M-3 | 注册泄漏邮箱存在性 | 错误消息"该邮箱已注册"确认账户存在 |
| M-4 | 登录时序攻击 | 邮箱不存在时跳过 BCrypt，响应时间差异暴露邮箱存在性 |
| M-5 | 注册字段无最大长度 | companyName/contactName 无 @Size(max) |
| M-6 | 无结构化审计日志 | 安全事件仅 log.info，无独立审计表 |
| M-7 | Auth 事件不记录 IP/UA | 登录日志缺失客户端 IP 和 User-Agent |
| M-8 | 前端未使用 i18n | 所有 auth 页面硬编码中文字符串，违反 CLAUDE.md 规则 |
| M-9 | 前端无 401 自动刷新 | Access Token 过期后不自动刷新，用户体验差 |
| M-10 | 无安全响应头 | CSP、HSTS、X-Frame-Options 等均缺失 |

## LOW（后续优化）

| # | 问题 | 说明 |
|---|------|------|
| L-1 | 验证 token 通过 GET 参数 | URL 参数可能被记录在日志/浏览器历史 |
| L-2 | 密码策略无特殊字符要求 | 支付行业可考虑更严格策略 |
| L-3 | Token 生成可用 SecureRandom | UUID 122bit 够用，256bit 更显式安全 |
| L-4 | 前端登录失败后未清除密码 | 防御纵深 |
| L-5 | 表单缺少 autocomplete 属性 | 密码管理器兼容性 |
| L-6 | 未来外部链接需 noopener | 当前无外部链接，预防性提醒 |
