# Task-037: 入驻审批通过后同步公司名称 + 去掉公司名唯一约束

## Status: Verifying

## 改动总结

### 1. DB schema (`init.sql`)
- `t_merchant.company_name`: `UNIQUE KEY uk_company_name` → `INDEX idx_company_name`（保留索引提升查询性能，去掉唯一约束）

### 2. AuthServiceImpl（注册）
- 删除 lines 84-92 的公司名唯一性校验（`selectCount` + `BizException`）
- 注册时即使提供了与已有商户相同的公司名，也允许注册

### 3. MerchantApplicationServiceImpl（审批）
- `review()` 方法 `APPROVED` 分支：读取 `t_merchant_application.company_name`，更新到 `t_merchant.company_name`
- 新增 `MerchantMapper` 依赖注入 + `Merchant` 实体导入

### 4. 测试
- `should_returnGenericError_when_companyNameExists` → `should_allowDuplicateCompanyName_when_differentEmail`（断言注册成功）
- `should_returnSameGenericError_when_emailExists` → `should_returnGenericError_when_emailExists`（简化命名和注释）

## 待用户操作
运行环境数据库需执行：
```sql
ALTER TABLE t_merchant DROP INDEX uk_company_name;
CREATE INDEX idx_company_name ON t_merchant(company_name);
```

## Next Step
继续技术债务清理或其他功能开发
