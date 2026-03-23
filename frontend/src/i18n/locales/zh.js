/** @type {Record<string, string>} */
const zh = {
  // common
  "common.save": "保存",
  "common.cancel": "取消",
  "common.confirm": "确认",
  "common.delete": "删除",
  "common.edit": "编辑",
  "common.loading": "加载中...",
  "common.error": "发生错误",

  // auth - register
  "auth.register.title": "商户注册",
  "auth.register.subtitle": "创建您的 OSLPay 商户账户",
  "auth.register.email": "邮箱",
  "auth.register.email.placeholder": "your@company.com",
  "auth.register.password": "密码",
  "auth.register.password.placeholder": "至少 8 位，含大小写和数字",
  "auth.register.confirmPassword": "确认密码",
  "auth.register.confirmPassword.placeholder": "再次输入密码",
  "auth.register.companyName": "公司名称",
  "auth.register.companyName.placeholder": "您的公司全称",
  "auth.register.contactName": "联系人姓名",
  "auth.register.contactName.placeholder": "主联系人姓名",
  "auth.register.submit": "注册",
  "auth.register.submitting": "注册中...",
  "auth.register.hasAccount": "已有账号？",
  "auth.register.goLogin": "去登录",
  "auth.register.success.title": "验证邮件已发送",
  "auth.register.success.message": "我们已向 {email} 发送了一封验证邮件，请查收并点击验证链接完成注册。",
  "auth.register.goLoginLink": "返回登录 →",

  // auth - verify email
  "auth.verifyEmail.loading": "正在验证邮箱...",
  "auth.verifyEmail.success.title": "邮箱验证成功",
  "auth.verifyEmail.success.message": "您的邮箱已验证成功，现在可以登录平台了。",
  "auth.verifyEmail.success.goLogin": "去登录",
  "auth.verifyEmail.error.title": "验证失败",
  "auth.verifyEmail.error.noToken": "验证链接无效：缺少 token 参数",
  "auth.verifyEmail.error.goRegister": "重新注册 →",

  // auth - validation
  "auth.validation.emailRequired": "邮箱不能为空",
  "auth.validation.emailInvalid": "请输入有效的邮箱地址",
  "auth.validation.passwordRequired": "密码不能为空",
  "auth.validation.passwordMinLength": "密码至少 8 个字符",
  "auth.validation.passwordComplexity": "密码需包含大写字母、小写字母、数字中的至少两种",
  "auth.validation.passwordSameAsEmail": "密码不能与邮箱相同",
  "auth.validation.confirmPasswordRequired": "请确认密码",
  "auth.validation.confirmPasswordMismatch": "两次密码不一致",
  "auth.validation.companyNameRequired": "公司名称不能为空",
  "auth.validation.contactNameRequired": "联系人姓名不能为空",
};

export default zh;
