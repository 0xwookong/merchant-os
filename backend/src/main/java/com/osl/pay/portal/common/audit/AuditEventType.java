package com.osl.pay.portal.common.audit;

public final class AuditEventType {
    private AuditEventType() {}

    public static final String REGISTER = "REGISTER";
    public static final String EMAIL_VERIFIED = "EMAIL_VERIFIED";
    public static final String LOGIN_SUCCESS = "LOGIN_SUCCESS";
    public static final String LOGIN_FAILED = "LOGIN_FAILED";
    public static final String LOGIN_LOCKED = "LOGIN_LOCKED";
    public static final String LOGOUT = "LOGOUT";
    public static final String TOKEN_REFRESH = "TOKEN_REFRESH";
    public static final String PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST";
    public static final String PASSWORD_RESET = "PASSWORD_RESET";
    public static final String PASSWORD_CHANGE = "PASSWORD_CHANGE";
    public static final String LOGIN_OTP_REQUIRED = "LOGIN_OTP_REQUIRED";
    public static final String RATE_LIMITED = "RATE_LIMITED";
    public static final String CREDENTIAL_GENERATED = "CREDENTIAL_GENERATED";
    public static final String CREDENTIAL_ROTATED = "CREDENTIAL_ROTATED";
    public static final String PROFILE_UPDATED = "PROFILE_UPDATED";
}
