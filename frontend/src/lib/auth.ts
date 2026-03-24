/**
 * In-memory access token storage.
 * Access token is NEVER persisted to localStorage/sessionStorage (security requirement).
 * Refresh token is managed as httpOnly cookie by the backend.
 */
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
