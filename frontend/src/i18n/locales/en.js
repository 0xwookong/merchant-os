/** @type {Record<string, string>} */
const en = {
  // common
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.loading": "Loading...",
  "common.error": "An error occurred",

  // auth - register
  "auth.register.title": "Merchant Registration",
  "auth.register.subtitle": "Create your OSLPay merchant account",
  "auth.register.email": "Email",
  "auth.register.email.placeholder": "your@company.com",
  "auth.register.password": "Password",
  "auth.register.password.placeholder": "At least 8 chars, with upper/lower and digits",
  "auth.register.confirmPassword": "Confirm Password",
  "auth.register.confirmPassword.placeholder": "Re-enter password",
  "auth.register.companyName": "Company Name",
  "auth.register.companyName.placeholder": "Your company full name",
  "auth.register.contactName": "Contact Name",
  "auth.register.contactName.placeholder": "Primary contact name",
  "auth.register.submit": "Register",
  "auth.register.submitting": "Registering...",
  "auth.register.hasAccount": "Already have an account?",
  "auth.register.goLogin": "Sign in",
  "auth.register.success.title": "Verification email sent",
  "auth.register.success.message": "We've sent a verification email to {email}. Please check and click the link to complete registration.",
  "auth.register.goLoginLink": "Back to login →",

  // auth - verify email
  "auth.verifyEmail.loading": "Verifying email...",
  "auth.verifyEmail.success.title": "Email verified",
  "auth.verifyEmail.success.message": "Your email has been verified. You can now sign in.",
  "auth.verifyEmail.success.goLogin": "Sign in",
  "auth.verifyEmail.error.title": "Verification failed",
  "auth.verifyEmail.error.noToken": "Invalid link: missing token",
  "auth.verifyEmail.error.goRegister": "Register again →",

  // auth - validation
  "auth.validation.emailRequired": "Email is required",
  "auth.validation.emailInvalid": "Please enter a valid email",
  "auth.validation.passwordRequired": "Password is required",
  "auth.validation.passwordMinLength": "Password must be at least 8 characters",
  "auth.validation.passwordComplexity": "Password must contain at least 2 of: uppercase, lowercase, digits",
  "auth.validation.passwordSameAsEmail": "Password cannot be the same as email",
  "auth.validation.confirmPasswordRequired": "Please confirm password",
  "auth.validation.confirmPasswordMismatch": "Passwords do not match",
  "auth.validation.companyNameRequired": "Company name is required",
  "auth.validation.contactNameRequired": "Contact name is required",
};

export default en;
