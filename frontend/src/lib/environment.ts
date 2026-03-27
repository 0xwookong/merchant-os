/**
 * Module-level environment state.
 * Synced from EnvironmentProvider (React context) so that non-React modules
 * (like api.ts) can read the current environment.
 * Persisted to localStorage so it survives page refresh.
 */

const STORAGE_KEY = "oslpay_environment";

function readStored(): "production" | "sandbox" {
  if (typeof window === "undefined") return "sandbox";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "production" ? "production" : "sandbox";
}

let currentEnvironment: "production" | "sandbox" = readStored();

export function getEnvironment(): "production" | "sandbox" {
  return currentEnvironment;
}

export function setEnvironment(env: "production" | "sandbox"): void {
  currentEnvironment = env;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, env);
  }
}
