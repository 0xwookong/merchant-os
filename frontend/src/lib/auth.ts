/**
 * Access token: in-memory only (never persisted).
 * Refresh token: localStorage for dev (HTTP), httpOnly cookie for production (HTTPS).
 *
 * TODO (TD-003): Before production, remove localStorage refresh token storage
 * and rely solely on httpOnly cookie.
 */

const REFRESH_TOKEN_KEY = "oslpay_refresh_token";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
