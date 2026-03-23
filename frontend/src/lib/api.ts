const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
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

  // TODO: Task-003 will add JWT token from auth context
  // TODO: Task-005 will add X-Environment header from environment context

  const res = await fetch(url, { ...options, headers });

  if (!res.ok && res.status >= 500) {
    throw new ApiError(50000, "服务器错误，请稍后重试");
  }

  const body: ApiResponse<T> = await res.json();

  if (body.code !== 0) {
    throw new ApiError(body.code, body.message);
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
