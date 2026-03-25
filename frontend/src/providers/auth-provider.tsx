"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAccessToken, setAccessToken, clearAccessToken, getRefreshToken, setRefreshToken, clearRefreshToken } from "@/lib/auth";
import { authService, type LoginResponse } from "@/services/authService";

interface AuthUser {
  userId: number;
  merchantId: number;
  email: string;
  role: string;
  companyName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (response: LoginResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from sessionStorage (fast) or refresh token (network)
  useEffect(() => {
    // 1. Try to restore from sessionStorage (covers page refresh without network call)
    const existingToken = getAccessToken();
    const cachedUser = typeof window !== "undefined" ? sessionStorage.getItem("oslpay_user") : null;
    if (existingToken && cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setIsLoading(false);
        return;
      } catch { /* fall through to refresh */ }
    }

    // 2. Try refresh token (covers new tab, expired access token)
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) {
      setIsLoading(false);
      return;
    }
    authService
      .refresh(storedRefreshToken)
      .then((res) => {
        if (res.authenticated && res.accessToken) {
          setAccessToken(res.accessToken);
          if (res.refreshToken) setRefreshToken(res.refreshToken);
          const u: AuthUser = {
            userId: res.userId!,
            merchantId: res.merchantId!,
            email: res.email!,
            role: res.role!,
            companyName: res.companyName!,
          };
          setUser(u);
          sessionStorage.setItem("oslpay_user", JSON.stringify(u));
        } else {
          clearRefreshToken();
          sessionStorage.removeItem("oslpay_user");
        }
      })
      .catch(() => {
        clearRefreshToken();
        sessionStorage.removeItem("oslpay_user");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback((response: LoginResponse) => {
    if (response.authenticated && response.accessToken) {
      setAccessToken(response.accessToken);
      if (response.refreshToken) setRefreshToken(response.refreshToken);
      const u: AuthUser = {
        userId: response.userId!,
        merchantId: response.merchantId!,
        email: response.email!,
        role: response.role!,
        companyName: response.companyName!,
      };
      setUser(u);
      sessionStorage.setItem("oslpay_user", JSON.stringify(u));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout API failure should not block local cleanup
    }
    clearAccessToken();
    clearRefreshToken();
    sessionStorage.removeItem("oslpay_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
