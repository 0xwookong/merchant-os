"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { merchantService, type MerchantProgressResponse } from "@/services/merchantService";

/**
 * Shared hook for merchant progress — avoids duplicate API calls from sidebar + kyb-banner.
 * Uses a module-level cache so multiple consumers share the same in-flight request.
 * Aborts previous in-flight request when a new one starts (prevents connection pool starvation).
 */

let cachedProgress: MerchantProgressResponse | null = null;
let cachedTimestamp = 0;
let inflightPromise: Promise<MerchantProgressResponse | null> | null = null;
let inflightAbort: AbortController | null = null;

const CACHE_TTL_MS = 3000;

function fetchProgress(): Promise<MerchantProgressResponse | null> {
  const now = Date.now();
  if (cachedProgress !== null && now - cachedTimestamp < CACHE_TTL_MS) {
    return Promise.resolve(cachedProgress);
  }
  if (inflightPromise) return inflightPromise;

  // Abort any stale in-flight request
  if (inflightAbort) inflightAbort.abort();
  const controller = new AbortController();
  inflightAbort = controller;

  inflightPromise = merchantService.getProgress(controller.signal)
    .then((res) => {
      cachedProgress = res;
      cachedTimestamp = Date.now();
      inflightPromise = null;
      inflightAbort = null;
      return cachedProgress;
    })
    .catch((e) => {
      inflightPromise = null;
      inflightAbort = null;
      // Swallow AbortError silently
      if (e instanceof DOMException && e.name === "AbortError") return cachedProgress;
      return cachedProgress;
    });

  return inflightPromise;
}

/** Invalidate the cache so the next call will hit the server */
export function invalidateProgressCache() {
  cachedProgress = null;
  cachedTimestamp = 0;
}

export function useApplicationStatus() {
  const [progress, setProgress] = useState<MerchantProgressResponse | null>(cachedProgress);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    fetchProgress().then(setProgress);
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  const applicationStatus = progress?.applicationStatus ?? null;

  const onboardingComplete = applicationStatus === "APPROVED"
    && !!progress?.hasCredentials
    && !!progress?.hasWebhooks
    && !!progress?.hasDomains;

  return { applicationStatus, progress, onboardingComplete, refreshStatus: refresh };
}
