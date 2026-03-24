"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Environment = "production" | "sandbox";

interface EnvironmentContextValue {
  environment: Environment;
  isSandbox: boolean;
  toggleEnvironment: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = useState<Environment>("sandbox");

  const toggleEnvironment = useCallback(() => {
    setEnvironment((prev) => (prev === "production" ? "sandbox" : "production"));
  }, []);

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        isSandbox: environment === "sandbox",
        toggleEnvironment,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment(): EnvironmentContextValue {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return context;
}
