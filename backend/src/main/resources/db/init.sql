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
