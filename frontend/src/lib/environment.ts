/**
 * Module-level environment state.
 * Synced from EnvironmentProvider (React context) so that non-React modules
 * (like api.ts) can read the current environment.
 */
let currentEnvironment: "production" | "sandbox" = "sandbox";

export function getEnvironment(): "production" | "sandbox" {
  return currentEnvironment;
}

export function setEnvironment(env: "production" | "sandbox"): void {
  currentEnvironment = env;
}
