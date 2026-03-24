package com.osl.pay.portal.common.context;

/**
 * ThreadLocal-based storage for the current request's environment (production/sandbox).
 * Set by EnvironmentInterceptor, read by Service layer.
 * MUST be cleared after each request to prevent thread pool leaks.
 */
public final class EnvironmentContext {

    private EnvironmentContext() {}

    public static final String PRODUCTION = "production";
    public static final String SANDBOX = "sandbox";

    private static final ThreadLocal<String> CURRENT = ThreadLocal.withInitial(() -> SANDBOX);

    public static String current() {
        return CURRENT.get();
    }

    public static boolean isProduction() {
        return PRODUCTION.equals(CURRENT.get());
    }

    public static boolean isSandbox() {
        return SANDBOX.equals(CURRENT.get());
    }

    public static void set(String environment) {
        if (PRODUCTION.equals(environment)) {
            CURRENT.set(PRODUCTION);
        } else {
            // Safety default: anything that's not explicitly "production" → sandbox
            CURRENT.set(SANDBOX);
        }
    }

    public static void clear() {
        CURRENT.remove();
    }
}
