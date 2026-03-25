import { getAccessToken, clearAccessToken, clearRefreshToken } from "./auth";
import { getEnvironment } from "./environment";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Emit a global event when the session expires (401).
 * AuthProvider listens for this and triggers logout + redirect.
 */
function handleSessionExpired() {
  // Clear tokens immediately to prevent further requests with expired token
  clearAccessToken();
  clearRefreshToken();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("oslpay_user");
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

class ApiError extends Error {
  code: number;
  httpStatus: number;
  constructor(code: number, message: string, httpStatus: number = 0) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  headers["X-Environment"] = getEnvironment();

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (e) {
    // AbortError = request was cancelled (e.g., user navigated away) — don't show error
    if (e instanceof DOMException && e.name === "AbortError") {
      throw e; // Re-throw so callers can detect cancellation
    }
    // Network error (no response at all — server down, CORS blocked, etc)
    throw new ApiError(0, "网络连接失败，请检查网络后重试");
  }

  // Try to parse JSON body for all responses (including 4xx)
  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    // Response is not JSON (e.g., HTML error page from gateway)
    if (res.status >= 500) {
      throw new ApiError(50000, "服务器错误，请稍后重试", res.status);
    }
    if (res.status === 401 || res.status === 403) {
      handleSessionExpired();
      throw new ApiError(res.status, "登录已过期，请重新登录", res.status);
    }
    throw new ApiError(res.status, `请求失败 (HTTP ${res.status})`, res.status);
  }

  if (body.code !== 0) {
    // Backend returns JSON 401/403 (e.g., expired JWT parsed by Spring Security)
    if (res.status === 401 || res.status === 403) {
      handleSessionExpired();
    }
    throw new ApiError(body.code, body.message, res.status);
  }

  return body.data;
}

export const api = {
  get<T>(path: string, params?: Record<string, string>, signal?: AbortSignal): Promise<T> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<T>(path + query, { method: "GET", signal });
  },

  post<T>(path: string, data?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(path: string, data?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },

  upload<T>(path: string, formData: FormData): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: formData,
    });
  },
};

export { ApiError };
export type { ApiResponse };
