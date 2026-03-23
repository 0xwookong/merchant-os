-- OSLPay Merchant Portal - Database Initialization
-- Run this script to create the database and base tables

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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Merchant user table (belongs to a merchant)
CREATE TABLE IF NOT EXISTS t_merchant_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    merchant_id BIGINT NOT NULL,
    email VARCHAR(200) NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN','BUSINESS','TECH') NOT NULL DEFAULT 'ADMIN',
    status ENUM('ACTIVE','LOCKED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    verify_token VARCHAR(100),
    verify_token_expire DATETIME,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_merchant_email (merchant_id, email),
    INDEX idx_email (email),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_verify_token (verify_token),
    FOREIGN KEY (merchant_id) REFERENCES t_merchant(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
