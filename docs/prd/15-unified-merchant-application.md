# 统一商户入驻申请（合并 KYB + Onboarding）

> **本文档替代**: `02-registration-kyb.md` 中的 §4 KYB 引导认证 + `03-merchant-onboarding.md` 全部内容
> **注册/登录/忘记密码**仍参考 `02-registration-kyb.md` §1-3

## 1. 设计理念

### 1.1 为什么合并

原设计将 KYB（合规验证）和 Onboarding（业务信息）拆成两个独立流程，存在以下问题：

| 问题 | 说明 |
|------|------|
| **信息重复采集** | 公司名称、注册地等在两个流程中重复填写 |
| **流程理解成本高** | 商户需要理解"KYB"和"入驻"的区别，实际上他们只想"开通支付" |
| **串行阻塞** | KYB 审核 3-7 天期间，商户无法进行入驻申请，流失风险高 |
| **合规深度不足** | KYB 缺少 UBO 识别、文件上传、制裁声明等合规必要项 |

### 1.2 合并后的设计原则

1. **一次提交，统一审核**：商户只需要走一个流程，填完所有信息一次性提交
2. **合规优先**：满足 FATF 建议、香港 SFC 持牌平台的 AML/KYB 要求
3. **不阻塞技术集成**：审核期间商户可以在沙箱环境完成技术对接
4. **草稿随时保存**：分步填写，每步自动保存，支持多次会话完成
5. **审核透明**：实时追踪审核进度，被拒后明确标注需修改项

## 2. 入驻流程总览

### 2.1 生产环境 — 5 步流程

```
Step 1          Step 2          Step 3         Step 4         Step 5
公司基本信息  →  法人与 UBO    →  业务信息    →  合规文件上传 →  确认提交
──────────     ──────────      ──────────     ──────────     ──────────
公司全称        法定代表人       业务类型       营业执照        信息预览
注册国家/号      UBO 列表        交易量预估     法人/UBO证件    合规声明
公司类型        (≥25%持股人)     支持币种       公司章程        条款确认
注册地址        控制结构说明     使用场景       银行证明        电子签名
主联系人                        业务描述                       提交
```

### 2.2 沙箱环境 — 4 步流程（跳过文件上传）

```
Step 1          Step 2          Step 3         Step 4
公司基本信息  →  法人与 UBO    →  业务信息    →  确认提交
```

沙箱环境提交后自动通过，无需人工审核。

### 2.3 适用角色

管理员（ADMIN）、业务人员（BUSINESS）

## 3. 表单字段设计

### 3.1 Step 1：公司基本信息

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:----:|----------|------|
| 公司全称 | Text | ✅ | max 200 | 法律注册名称 |
| 公司英文名 | Text | ❌ | max 200 | 国际支付场景必要 |
| 注册国家/地区 | Select | ✅ | ISO 3166-1 国家列表 | 影响后续合规要求 |
| 公司注册号 | Text | ✅ | max 100 | 公司注册证书上的编号 |
| 营业执照号 | Text | ❌ | max 100 | 部分国家/地区适用 |
| 公司类型 | Select | ✅ | 预定义选项 | 有限公司/合伙企业/个人独资/其他 |
| 成立日期 | Date | ✅ | ≤ 今天 | YYYY-MM-DD |

**注册地址**

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|:----:|----------|
| 地址行 1 | Text | ✅ | max 300 |
| 地址行 2 | Text | ❌ | max 300 |
| 城市 | Text | ✅ | max 100 |
| 州/省 | Text | ❌ | max 100 |
| 邮政编码 | Text | ✅ | max 20 |
| 国家 | Select | ✅ | 自动填充注册国家 |

**主联系人**

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|:----:|----------|
| 联系人姓名 | Text | ✅ | max 100 |
| 职位/头衔 | Text | ✅ | max 100 |
| 联系邮箱 | Email | ✅ | 有效邮箱格式 |
| 联系电话 | Phone | ✅ | 含国际区号 |

### 3.2 Step 2：法定代表人与 UBO

**法定代表人 / 授权签字人**

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:----:|----------|------|
| 姓名 | Text | ✅ | max 100 | |
| 国籍 | Select | ✅ | ISO 国家列表 | |
| 证件类型 | Select | ✅ | 护照/身份证/驾照 | |
| 证件号码 | Text | ✅ | max 50 | |
| 出生日期 | Date | ✅ | ≤ 今天，≥ 18岁 | 制裁筛查需要 |

**最终受益所有人（UBO）**

> 根据 FATF 第 24 条建议，必须识别所有直接或间接持有公司 25% 以上股份或表决权的自然人。

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|:----:|----------|
| 姓名 | Text | ✅ | max 100 |
| 国籍 | Select | ✅ | ISO 国家列表 |
| 证件类型 | Select | ✅ | 护照/身份证/驾照 |
| 证件号码 | Text | ✅ | max 50 |
| 出生日期 | Date | ✅ | ≤ 今天，≥ 18岁 |
| 持股比例 | Number | ✅ | 25-100，总和 ≤ 100 |
| 是否为法定代表人 | Checkbox | ❌ | 勾选后自动填充法人信息 |

**规则**：
- 支持添加多个 UBO（最多 10 人）
- 所有 UBO 持股比例之和不得超过 100%
- 如果没有自然人持股超过 25%，提供"无 UBO 声明"选项，需填写公司控制结构说明

### 3.3 Step 3：业务信息

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|:----:|----------|------|
| 业务类型 | Select | ✅ | 预定义选项 | 电商/游戏/SaaS/跨境贸易/金融服务/其他 |
| 公司网站 | URL | ❌ | 有效 URL | |
| 月预估交易金额 | Select | ✅ | 预定义区间 | <$10K / $10K-100K / $100K-1M / >$1M |
| 月预估交易笔数 | Select | ✅ | 预定义区间 | <100 / 100-1K / 1K-10K / >10K |
| 支持的法币 | Multi-select | ✅ | 至少选 1 | USD, EUR, GBP, HKD, SGD, JPY |
| 支持的加密货币 | Multi-select | ✅ | 至少选 1 | USDT, USDC, BTC, ETH |
| 使用场景 | Multi-select | ✅ | 至少选 1 | 在线支付/入金出金/跨境汇款/OTC/其他 |
| 业务描述 | Textarea | ✅ | max 2000 | 业务模式、目标客户群体、资金流向 |

### 3.4 Step 4：合规文件上传（仅生产环境）

**公司文件**

| 文件类型 | 格式 | 大小限制 | 必填 | 说明 |
|----------|------|----------|:----:|------|
| 营业执照 / 注册证书 | PDF/JPG/PNG | 10MB | ✅ | |
| 公司章程 / 组织大纲 | PDF/JPG/PNG | 10MB | ✅ | |

**身份证件**

| 文件类型 | 格式 | 大小限制 | 必填 | 说明 |
|----------|------|----------|:----:|------|
| 法定代表人证件（正面） | PDF/JPG/PNG | 10MB | ✅ | |
| 法定代表人证件（反面） | PDF/JPG/PNG | 10MB | ✅ | 护照则正面即可 |
| 各 UBO 证件（正面） | PDF/JPG/PNG | 10MB | ✅ | 每个 UBO 各一份 |
| 各 UBO 证件（反面） | PDF/JPG/PNG | 10MB | ✅ | 护照则正面即可 |

**财务文件**

| 文件类型 | 格式 | 大小限制 | 必填 | 说明 |
|----------|------|----------|:----:|------|
| 银行开户证明 / 近 3 月银行流水 | PDF/JPG/PNG | 10MB | ✅ | |

**其他文件（可选）**

| 文件类型 | 格式 | 大小限制 | 必填 | 说明 |
|----------|------|----------|:----:|------|
| 股权结构图 | PDF/JPG/PNG | 10MB | ❌ | 复杂股权结构建议提供 |

**上传规则**：
- 支持拖拽上传和点击上传
- 上传时显示进度条
- 上传成功后显示文件名、大小、缩略图（图片）
- 支持删除已上传文件重新上传
- 文件存储路径按 `merchant_id/application_id/` 组织

### 3.5 Step 5：确认提交

**信息预览**

分区展示所有已填信息（只读），每个分区提供"编辑"按钮可跳回对应步骤修改。

**合规声明（必须全部勾选才能提交）**

| 声明 | 必填 |
|------|:----:|
| 我确认以上信息真实、完整、准确 | ✅ |
| 我确认本公司及其受益所有人不在任何国际制裁名单上（包括但不限于 OFAC、UN、EU 制裁名单） | ✅ |
| 我已阅读并同意 OSLPay《商户服务协议》和《隐私政策》 | ✅ |

**提交提示**

提交后进入审核流程，审核期间无法修改已提交的信息。预计审核时间：3-5 个工作日。

## 4. 草稿管理

### 4.1 自动保存

- 每次点击"下一步"时自动保存当前步骤数据为草稿
- 页面右上角显示当前状态标签：`草稿`
- 保存成功后短暂显示"已自动保存"提示

### 4.2 草稿恢复

- 用户离开页面后再次访问，自动恢复草稿内容和当前步骤
- 草稿永久保存，直到用户提交或手动删除

### 4.3 字段级部分保存

- 草稿保存不做必填校验（允许部分为空）
- 仅在最终提交时做完整校验
- 前端在"下一步"时做本步骤字段校验（非空 + 格式），但允许用户跳过去保存

## 5. 申请状态流转

```
                    ┌─────────┐
                    │  DRAFT  │ ← 用户正在填写
                    └────┬────┘
                         │ [用户提交]
                    ┌────▼────┐
                    │SUBMITTED│ ← 已提交，等待处理
                    └────┬────┘
                         │ [合规团队开始审核]
                ┌────────▼────────┐
                │  UNDER_REVIEW   │ ← 审核中
                └────┬───────┬────┘
                     │       │
          [审核通过] │       │ [需要补充信息]
            ┌────────▼┐  ┌──▼──────────┐
            │ APPROVED │  │NEED_MORE_INFO│ → 用户补充 → UNDER_REVIEW
            └──────────┘  └──────┬──────┘
                                 │ [审核拒绝]
                          ┌──────▼──────┐
                          │  REJECTED   │ → 用户修改重提 → SUBMITTED
                          └─────────────┘
```

### 状态说明

| 状态 | 标签颜色 | 用户可执行操作 | 说明 |
|------|----------|----------------|------|
| DRAFT | 灰色 | 编辑、保存、提交 | 用户正在填写 |
| SUBMITTED | 蓝色 | 查看（只读） | 已提交，等待合规团队处理 |
| UNDER_REVIEW | 黄色 | 查看（只读） | 合规团队正在审核 |
| APPROVED | 绿色 | 查看（只读） | 审核通过，全功能解锁 |
| NEED_MORE_INFO | 橙色 | 修改指定字段、重新提交 | 合规团队指出需要补充的项目 |
| REJECTED | 红色 | 修改全部字段、重新提交 | 审核未通过，需要修改 |

### 与功能解锁的关系

| 入驻状态 | 沙箱环境 | 生产环境 |
|----------|----------|----------|
| DRAFT | 全部功能 ✅ | ❌ |
| SUBMITTED | 全部功能 ✅ | API 文档（只读）✅ |
| UNDER_REVIEW | 全部功能 ✅ | API 文档（只读）✅ |
| APPROVED | 全部功能 ✅ | 全部功能 ✅ |
| NEED_MORE_INFO | 全部功能 ✅ | API 文档（只读）✅ |
| REJECTED | 全部功能 ✅ | ❌ |

**核心原则**：审核期间让商户在沙箱环境完成技术集成，审核通过后无缝切换生产。

## 6. 审核进度追踪

提交后替代表单显示审核状态页面：

### 6.1 审核进度时间线

```
✅ 申请已提交               2026-03-25 14:30
│
🔵 材料审核中               预计 2026-03-28 前完成
│   合规团队正在审核您的公司资质和文件
│
⚪ 审核完成
```

### 6.2 审核期间引导

审核等待页面展示：
- 审核进度时间线
- "审核期间您可以"快速操作提示（沙箱测试、Webhook 配置、邀请团队成员）
- 已提交信息摘要（可展开/收起）
- 联系邮箱：compliance@osl-pay.com

### 6.3 需补充信息处理

当状态变为 NEED_MORE_INFO 时：
- 醒目展示需要补充的具体项目列表（由审核人员填写）
- 提供"修改并重新提交"按钮
- 点击后进入表单编辑模式，需补充的字段高亮标注
- 其他无需修改的字段保持只读

### 6.4 被拒绝处理

当状态变为 REJECTED 时：
- 展示拒绝原因
- 提供"修改并重新提交"按钮
- 点击后所有字段均可编辑（全表单重新开放）

## 7. 数据模型

### 7.1 统一入驻申请表 `t_merchant_application`

```sql
CREATE TABLE t_merchant_application (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,

    -- 状态管理
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    current_step INT NOT NULL DEFAULT 1,

    -- Step 1: 公司基本信息
    company_name VARCHAR(200),
    company_name_en VARCHAR(200),
    reg_country VARCHAR(100),
    reg_number VARCHAR(100),
    business_license_no VARCHAR(100),
    company_type VARCHAR(50),
    incorporation_date DATE,
    address_line1 VARCHAR(300),
    address_line2 VARCHAR(300),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    contact_name VARCHAR(100),
    contact_title VARCHAR(100),
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),

    -- Step 2: 法定代表人 (JSON)
    legal_rep JSON COMMENT '{ name, nationality, idType, idNumber, dateOfBirth }',

    -- Step 2: UBO (JSON Array)
    ubos JSON COMMENT '[{ name, nationality, idType, idNumber, dateOfBirth, sharePercentage, isLegalRep }]',
    no_ubo_declaration TINYINT(1) NOT NULL DEFAULT 0,
    control_structure_desc TEXT,

    -- Step 3: 业务信息
    business_type VARCHAR(50),
    website VARCHAR(300),
    monthly_volume VARCHAR(50),
    monthly_tx_count VARCHAR(50),
    supported_fiat VARCHAR(500),
    supported_crypto VARCHAR(500),
    use_cases VARCHAR(500),
    business_desc TEXT,

    -- Step 5: 合规声明
    info_accuracy_confirmed TINYINT(1) NOT NULL DEFAULT 0,
    sanctions_declared TINYINT(1) NOT NULL DEFAULT 0,
    terms_accepted TINYINT(1) NOT NULL DEFAULT 0,

    -- 审核信息
    reject_reason TEXT,
    need_info_details JSON COMMENT '需要补充的具体项目列表',
    reviewer_notes TEXT COMMENT '内部审核备注，不对外展示',
    reviewed_at DATETIME,
    reviewed_by VARCHAR(100),

    -- 时间戳
    submitted_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7.2 申请文件表 `t_application_document`

```sql
CREATE TABLE t_application_document (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    application_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,

    doc_type VARCHAR(50) NOT NULL COMMENT 'BUSINESS_LICENSE, ARTICLES, LEGAL_REP_ID_FRONT, LEGAL_REP_ID_BACK, UBO_ID_FRONT, UBO_ID_BACK, BANK_STATEMENT, SHARE_STRUCTURE, OTHER',
    doc_name VARCHAR(200),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(50),
    ubo_index INT COMMENT '关联 UBO 索引（0-based），公司/法人文件为 NULL',

    status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED' COMMENT 'UPLOADED, ACCEPTED, REJECTED',
    reject_reason VARCHAR(300),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_application_id (application_id),
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (application_id) REFERENCES t_merchant_application(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7.3 与 `t_merchant` 的关系

`t_merchant` 表保留 `kyb_status` 字段，作为商户整体入驻状态的冗余字段（快速查询用）。当 `t_merchant_application.status` 变更为 `APPROVED` 时，同步更新 `t_merchant.kyb_status = 'APPROVED'`。

## 8. 后端 API 设计

| 端点 | 方法 | 说明 | 认证 | 角色 |
|------|------|------|:----:|------|
| `/api/v1/application/current` | GET | 获取当前申请（草稿或已提交） | ✅ | ADMIN, BUSINESS |
| `/api/v1/application/save-draft` | POST | 保存草稿（部分数据） | ✅ | ADMIN, BUSINESS |
| `/api/v1/application/submit` | POST | 提交申请（完整校验） | ✅ | ADMIN, BUSINESS |
| `/api/v1/application/resubmit` | POST | 修改后重新提交 | ✅ | ADMIN, BUSINESS |
| `/api/v1/application/documents` | POST | 上传文件 | ✅ | ADMIN, BUSINESS |
| `/api/v1/application/documents/{id}` | DELETE | 删除已上传文件 | ✅ | ADMIN, BUSINESS |

## 9. 迁移策略

### 9.1 方案：渐进替换

1. **新建** `t_merchant_application` 和 `t_application_document` 表
2. **新建** 统一入驻流程的前后端代码
3. **保留** 旧 KYB 和 Onboarding 代码但在菜单中隐藏
4. 旧数据可通过迁移脚本合并到新表（如果已有测试数据）
5. 验证稳定后删除旧表和代码

### 9.2 前端路由变更

| 当前 | 新路由 | 说明 |
|------|--------|------|
| `/organization/kyb` | 废弃 | 合并到统一入驻 |
| `/organization/onboarding` | `/organization/application` | 统一入驻申请 |

菜单配置中"组织管理"下的"KYB 认证"和"入驻申请"合并为一个"入驻申请"菜单项。

## 10. 验收标准

- [ ] 生产环境展示 5 步流程，沙箱环境展示 4 步流程（跳过文件上传）
- [ ] 每步"下一步"自动保存草稿，支持多次会话完成
- [ ] UBO 支持动态添加/删除（最多 10 人），持股比例总和 ≤ 100%
- [ ] "无 UBO 声明"选项可用，勾选后 UBO 列表隐藏，控制结构说明必填
- [ ] 文件上传支持拖拽，显示进度，支持删除重传
- [ ] 合规声明三项全勾选后才能提交
- [ ] 沙箱环境提交后自动通过
- [ ] 生产环境提交后进入 SUBMITTED 状态，展示审核进度
- [ ] NEED_MORE_INFO 状态下只能修改指定字段
- [ ] REJECTED 状态下可修改全部字段并重新提交
- [ ] 审核期间沙箱环境全功能可用
- [ ] 所有操作记录审计日志
- [ ] 文件存储按 merchant_id/application_id 组织
- [ ] 所有 UI 文本使用 i18n
