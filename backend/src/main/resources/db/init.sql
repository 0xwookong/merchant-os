-- OSLPay Merchant Portal - Database Initialization
-- Run this script to create the database and base tables
-- Temporary auth state (tokens, fail counts, locks) is stored in Redis, not here

CREATE DATABASE IF NOT EXISTS oslpay_portal
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE oslpay_portal;

-- Merchant table (tenant entity)
CREATE TABLE IF NOT EXISTS t_merchant (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(200) NOT NULL,
    status ENUM('ACTIVE','SUSPENDED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
    kyb_status ENUM('NOT_STARTED','PENDING','APPROVED','REJECTED','NEED_MORE_INFO') NOT NULL DEFAULT 'NOT_STARTED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_company_name (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Merchant user table (belongs to a merchant)
-- Note: verify_token, reset_token, failed_login_count, locked_until are in Redis
CREATE TABLE IF NOT EXISTS t_merchant_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    email VARCHAR(200) NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN','BUSINESS','TECH') NOT NULL DEFAULT 'ADMIN',
    status ENUM('ACTIVE','LOCKED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_merchant_email (merchant_id, email),
    INDEX idx_email (email),
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- KYB application table (Know Your Business)
CREATE TABLE IF NOT EXISTS t_kyb_application (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    company_reg_country VARCHAR(100) NOT NULL COMMENT '公司注册地',
    company_reg_number VARCHAR(100) NOT NULL COMMENT '公司注册号',
    business_license_no VARCHAR(100) NOT NULL COMMENT '营业执照号',
    company_type VARCHAR(50) NOT NULL COMMENT 'LIMITED/PARTNERSHIP/SOLE_PROPRIETORSHIP/OTHER',
    legal_rep_name VARCHAR(100) NOT NULL COMMENT '法人姓名',
    legal_rep_nationality VARCHAR(100) NOT NULL COMMENT '法人国籍',
    legal_rep_id_type VARCHAR(50) NOT NULL COMMENT 'ID_CARD/PASSPORT/OTHER',
    legal_rep_id_number VARCHAR(100) NOT NULL COMMENT '证件号码',
    legal_rep_share_pct DECIMAL(5,2) COMMENT '持股比例',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED/NEED_MORE_INFO',
    reject_reason VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order table (payment orders)
CREATE TABLE IF NOT EXISTS t_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    order_no VARCHAR(50) NOT NULL COMMENT 'e.g. ORD20240303001',
    fiat_amount DECIMAL(18,2) NOT NULL,
    fiat_currency VARCHAR(10) NOT NULL COMMENT 'USD/EUR/GBP',
    crypto_amount DECIMAL(18,8),
    crypto_currency VARCHAR(10) COMMENT 'BTC/ETH/USDT',
    crypto_network VARCHAR(20) COMMENT 'ERC20/TRC20/BEP20',
    wallet_address VARCHAR(200) COMMENT '目标钱包地址',
    payment_method VARCHAR(20) NOT NULL COMMENT 'CARD/GOOGLEPAY/APPLEPAY',
    status VARCHAR(20) NOT NULL COMMENT 'CREATED/PROCESSING/SUCCESSED/COMPLETED/FAILED',
    tx_hash VARCHAR(100),
    block_height BIGINT,
    confirmations INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_order_no (order_no),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Onboarding application table (merchant onboarding)
CREATE TABLE IF NOT EXISTS t_onboarding_application (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED',
    current_step INT NOT NULL DEFAULT 1,
    company_name VARCHAR(200),
    company_address VARCHAR(500),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(200),
    business_type VARCHAR(50),
    monthly_volume VARCHAR(50),
    supported_fiat VARCHAR(200) COMMENT 'comma separated',
    supported_crypto VARCHAR(200) COMMENT 'comma separated',
    business_desc VARCHAR(2000),
    reject_reason VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API credential table (merchant API keys)
CREATE TABLE IF NOT EXISTS t_api_credential (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    app_id VARCHAR(64) NOT NULL COMMENT '应用唯一标识 osl_app_UUID',
    api_public_key TEXT NOT NULL COMMENT 'RSA 2048 公钥 PEM',
    api_private_key TEXT NOT NULL COMMENT 'RSA 2048 私钥 PEM',
    webhook_public_key TEXT NOT NULL COMMENT 'Webhook RSA 2048 公钥 PEM',
    webhook_private_key TEXT NOT NULL COMMENT 'Webhook RSA 2048 私钥 PEM',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_merchant_id (merchant_id),
    UNIQUE KEY uk_app_id (app_id),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook config table
CREATE TABLE IF NOT EXISTS t_webhook_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL COMMENT 'Webhook 目标 URL',
    secret VARCHAR(100) NOT NULL COMMENT '签名密钥',
    events VARCHAR(1000) NOT NULL COMMENT '订阅事件，逗号分隔',
    status ENUM('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API request log table
CREATE TABLE IF NOT EXISTS t_api_request_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status_code INT NOT NULL,
    duration_ms INT NOT NULL,
    request_body TEXT,
    response_body TEXT,
    environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_merchant_env (merchant_id, environment),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Domain whitelist table
CREATE TABLE IF NOT EXISTS t_domain_whitelist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    domain VARCHAR(500) NOT NULL COMMENT '含协议的完整域名',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_merchant_domain (merchant_id, domain),
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook push log table
CREATE TABLE IF NOT EXISTS t_webhook_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    webhook_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL COMMENT '事件类型',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/success/retry_pending/final_failed',
    http_status INT COMMENT '响应状态码',
    retry_count INT NOT NULL DEFAULT 0 COMMENT '已重试次数',
    request_body TEXT COMMENT '请求内容',
    response_body VARCHAR(2000) COMMENT '响应内容',
    error_message VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webhook_id (webhook_id),
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (webhook_id) REFERENCES t_webhook_config(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email template table (data-driven email content)
CREATE TABLE IF NOT EXISTS t_email_template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL COMMENT 'Template code: VERIFY_EMAIL, PASSWORD_RESET, INVITATION, etc.',
    locale VARCHAR(10) NOT NULL DEFAULT 'en' COMMENT 'Language: en, zh',
    subject VARCHAR(200) NOT NULL COMMENT 'Email subject (supports {var} placeholders)',
    body_html TEXT NOT NULL COMMENT 'HTML body content (supports {var} placeholders, wrapped in brand layout)',
    description VARCHAR(200) COMMENT 'What this template is for',
    status ENUM('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_code_locale (code, locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default email templates
INSERT INTO t_email_template (code, locale, subject, body_html, description) VALUES
-- Verification email
('VERIFY_EMAIL', 'en', 'Verify your email — OSL Pay',
'<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px">Thank you for registering with OSL Pay. Please click the button below to verify your email address.</p>
<div style="text-align:center;margin:32px 0"><a href="{verifyLink}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px">Verify Email</a></div>
<p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0">If the button doesn\'t work, copy and paste this link:<br/><a href="{verifyLink}" style="color:#2563eb;word-break:break-all">{verifyLink}</a></p>
<p style="color:#9ca3af;font-size:13px;margin:16px 0 0">This link expires in 30 minutes.</p>',
'Email verification for new registrations'),

('VERIFY_EMAIL', 'zh', '验证您的邮箱 — OSL Pay',
'<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px">感谢您注册 OSL Pay。请点击下方按钮验证您的邮箱地址。</p>
<div style="text-align:center;margin:32px 0"><a href="{verifyLink}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px">验证邮箱</a></div>
<p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0">如果按钮无法点击，请复制以下链接到浏览器：<br/><a href="{verifyLink}" style="color:#2563eb;word-break:break-all">{verifyLink}</a></p>
<p style="color:#9ca3af;font-size:13px;margin:16px 0 0">此链接 30 分钟内有效。</p>',
'新用户注册邮箱验证'),

-- Password reset email (single merchant)
('PASSWORD_RESET', 'en', 'Reset your password — OSL Pay',
'<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px">We received a request to reset your password. Click the button below to set a new password.</p>
{resetLinksHtml}
<p style="color:#9ca3af;font-size:13px;margin:16px 0 0">If you didn\'t request this, you can safely ignore this email. The link expires in 30 minutes.</p>',
'Password reset email'),

('PASSWORD_RESET', 'zh', '重置您的密码 — OSL Pay',
'<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px">我们收到了重置您密码的请求。请点击下方按钮设置新密码。</p>
{resetLinksHtml}
<p style="color:#9ca3af;font-size:13px;margin:16px 0 0">如果这不是您本人操作，请忽略此邮件。链接 30 分钟内有效。</p>',
'密码重置邮件'),

-- Invitation email (with account activation link)
('INVITATION', 'en', 'You''ve been invited to OSL Pay',
'<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px">Hi {contactName},<br/><br/>You''ve been invited to join the OSL Pay Merchant Portal. Click the button below to set your password and activate your account.</p>
<div style="text-align:center;margin:32px 0"><a href="{activateLink}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px">Set Password &amp; Activate</a></div>
<p style="color:#9ca3af;font-size:13px;margin:0">This link expires in 30 minutes. If you weren''t expecting this invitation, please ignore this email.</p>',
'Team member invitation'),

('INVITATION', 'zh', '您已被邀请加入 OSL Pay',
'<p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px">您好 {contactName}，<br/><br/>您已被邀请加入 OSL Pay 商户平台。请点击下方按钮设置密码并激活您的账户。</p>
<div style="text-align:center;margin:32px 0"><a href="{activateLink}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:8px">设置密码并激活</a></div>
<p style="color:#9ca3af;font-size:13px;margin:0">链接 30 分钟内有效。如果您不知道为何收到此邮件，请忽略。</p>',
'团队成员邀请');

-- Audit log table (security events)
-- Note: rate limit events, login attempts, password resets all recorded here
CREATE TABLE IF NOT EXISTS t_audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL COMMENT 'REGISTER, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc',
    user_id BIGINT COMMENT 'User ID (NULL if unauthenticated)',
    merchant_id BIGINT COMMENT 'Merchant ID (NULL if unauthenticated)',
    email VARCHAR(200) COMMENT 'Masked email',
    ip_address VARCHAR(45) NOT NULL COMMENT 'Client IP (supports IPv6)',
    user_agent VARCHAR(500),
    detail VARCHAR(1000) COMMENT 'Event details (no sensitive data)',
    success TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
