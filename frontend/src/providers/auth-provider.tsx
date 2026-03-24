"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setAccessToken, clearAccessToken } from "@/lib/auth";
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

  // On mount: try to restore session via refresh token (httpOnly cookie auto-sent)
  useEffect(() => {
    authService
      .refresh()
      .then((res) => {
        if (res.authenticated && res.accessToken) {
          setAccessToken(res.accessToken);
          setUser({
            userId: res.userId!,
            merchantId: res.merchantId!,
            email: res.email!,
            role: res.role!,
            companyName: res.companyName!,
          });
        }
      })
      .catch(() => {
        // No valid refresh token — user is not logged in
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback((response: LoginResponse) => {
    if (response.authenticated && response.accessToken) {
      setAccessToken(response.accessToken);
      setUser({
        userId: response.userId!,
        merchantId: response.merchantId!,
        email: response.email!,
        role: response.role!,
        companyName: response.companyName!,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout API failure should not block local cleanup
    }
    clearAccessToken();
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
