"use client";

import { LanguageProvider } from "./language-provider";

/**
 * Root-level client providers.
 * Wraps all pages with LanguageProvider for i18n support.
 * Additional global providers can be added here.
 */
export function RootProviders({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
