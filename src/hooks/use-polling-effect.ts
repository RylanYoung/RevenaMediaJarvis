"use client";

import { useEffect, useRef } from "react";

// Runs `fn` immediately, then again every `intervalMs` — so an already-open
// tab (or a second screen) picks up changes from a webhook, cron sync, or
// another device without a manual refresh. Pauses while the tab is hidden
// so a background tab doesn't burn requests for nothing.
export function usePollingEffect(fn: () => void, intervalMs = 15000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    fnRef.current();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fnRef.current();
      }
    }, intervalMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);
}
