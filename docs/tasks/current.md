# Task-027a: DD Form 对齐 — Schema 扩展 + 后端字段补全

## Status: In Progress

## PRD Reference
docs/onboarding/OSL Pay Due Diligence Form v2.1.pdf
docs/onboarding/Checklist of Documents Required for OSL Pay DD Form v2.1.pdf

## Scope
- DB: ALTER TABLE 新增列（TIN、counterpartyType）+ JSON 列（directors、authorizedPersons、licenceInfo）+ 业务新字段
- 后端: Entity/DTO/Service 补全新字段，文件类型扩展
- 后端: 提交校验更新

## New Fields Summary

### Section A — Company Info additions
- `tax_id_number` VARCHAR(100) — 纳税识别号/VAT
- `counterparty_type` VARCHAR(50) — MiCAR/CASP/VASP/Referral
- UBO JSON: 新增 placeOfBirth, residentialAddress
- `directors` JSON — [{name, idTypeNumber, placeOfBirth, dateOfBirth, nationality}]
- `authorized_persons` JSON — [{name, idTypeNumber, placeOfBirth, dateOfBirth, nationality, phone, email}]

### Section B — Business additions
- `purpose_of_account` VARCHAR(500) — 开户目的
- `source_of_income` VARCHAR(500) — 收入来源
- `est_amount_per_tx_from` VARCHAR(50) — 单笔交易金额下限
- `est_amount_per_tx_to` VARCHAR(50) — 单笔交易金额上限
- `est_tx_per_year` VARCHAR(50) — 年交易笔数

### Section C — Licence Info (new JSON)
- `licence_info` JSON — {regulated, jurisdiction, regulatorName, licenceType, licenceNumber, licenceDate, lastAuditDate}

### Document Types additions
- BUSINESS_PROFILE, SHAREHOLDER_LIST, DIRECTOR_LIST, ADDRESS_PROOF, REGULATORY_PERMIT, AML_POLICY, CDD_POLICY, SANCTIONS_POLICY

## Development Plan
- [ ] 1. ALTER TABLE + init.sql 更新
- [ ] 2. Entity 补全新字段
- [ ] 3. DTO (Request + Response) 补全
- [ ] 4. Service copyFields + validateForSubmit 更新
- [ ] 5. 文件类型白名单扩展
- [ ] 6. 运行全量测试

## Next Step
Task-027b: 前端表单重构 + 字段填写指南
