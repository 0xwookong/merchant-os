package com.osl.pay.portal.service;

import com.osl.pay.portal.model.dto.RegisterRequest;
import com.osl.pay.portal.model.dto.RegisterResponse;

public interface AuthService {

    /**
     * Register a new merchant and its first admin user.
     */
    RegisterResponse register(RegisterRequest request);

    /**
     * Verify email address using the token sent during registration.
     */
    void verifyEmail(String token);
}
