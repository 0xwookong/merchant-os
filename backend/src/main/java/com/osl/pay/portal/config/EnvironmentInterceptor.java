package com.osl.pay.portal.config;

import com.osl.pay.portal.common.context.EnvironmentContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Reads X-Environment header from each request and sets EnvironmentContext.
 * Clears ThreadLocal after request completes to prevent thread pool leaks.
 */
@Component
public class EnvironmentInterceptor implements HandlerInterceptor {

    private static final String HEADER_NAME = "X-Environment";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        String env = request.getHeader(HEADER_NAME);
        EnvironmentContext.set(env);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        EnvironmentContext.clear();
    }
}
