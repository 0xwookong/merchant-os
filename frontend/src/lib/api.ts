import { getAccessToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // TODO: Task-005 will add X-Environment header from environment context

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
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
    throw new ApiError(res.status, `请求失败 (HTTP ${res.status})`, res.status);
  }

  if (body.code !== 0) {
    throw new ApiError(body.code, body.message, res.status);
  }

  return body.data;
}

export const api = {
  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<T>(path + query, { method: "GET" });
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
};

export { ApiError };
export type { ApiResponse };
