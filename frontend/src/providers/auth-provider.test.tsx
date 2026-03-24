import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./auth-provider";

// Mock authService
const mockRefresh = vi.fn();
const mockLogout = vi.fn();
vi.mock("@/services/authService", () => ({
  authService: {
    refresh: (...args: unknown[]) => mockRefresh(...args),
    logout: (...args: unknown[]) => mockLogout(...args),
  },
}));

// Mock auth token store
const mockSetAccessToken = vi.fn();
const mockClearAccessToken = vi.fn();
vi.mock("@/lib/auth", () => ({
  setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
  clearAccessToken: (...args: unknown[]) => mockClearAccessToken(...args),
  getAccessToken: () => null,
  getRefreshToken: () => null,
  setRefreshToken: vi.fn(),
  clearRefreshToken: vi.fn(),
}));

/** 测试用消费者组件：展示 AuthContext 的状态 */
function AuthConsumer() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? "null"}</span>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("初始化时调用 refresh 成功 → isAuthenticated=true，user 包含用户信息", async () => {
    mockRefresh.mockResolvedValue({
      authenticated: true,
      accessToken: "test-token",
      userId: 1,
      merchantId: 1,
      email: "test@example.com",
      role: "ADMIN",
      companyName: "Test Corp",
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // 初始为 loading
    expect(screen.getByTestId("loading").textContent).toBe("true");

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("email").textContent).toBe("test@example.com");
    expect(mockSetAccessToken).toHaveBeenCalledWith("test-token");
  });

  it("初始化时 refresh 失败（无 cookie）→ isAuthenticated=false，user=null", async () => {
    mockRefresh.mockRejectedValue(new Error("no token"));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("email").textContent).toBe("null");
  });

  it("调用 logout → clearAccessToken，调用后端 logout，user 变为 null", async () => {
    mockRefresh.mockResolvedValue({
      authenticated: true,
      accessToken: "test-token",
      userId: 1,
      merchantId: 1,
      email: "test@example.com",
      role: "ADMIN",
      companyName: "Test Corp",
    });
    mockLogout.mockResolvedValue("ok");

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    // 执行登出
    await act(async () => {
      screen.getByRole("button", { name: "logout" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
    });

    expect(mockClearAccessToken).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
  });

  it("useAuth 在 AuthProvider 外部使用 → 抛出错误", () => {
    // 捕获 React 错误边界
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
    consoleSpy.mockRestore();
  });
});
