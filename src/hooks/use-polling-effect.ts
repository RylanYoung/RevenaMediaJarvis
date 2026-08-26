"use client";

import { useEffect, useRef } from "react";
import { onDataChanged } from "@/lib/sync-bus";

// Runs `fn` immediately, then again every `intervalMs` — so an already-open
// tab (or a second screen) picks up changes from a webhook, cron sync, or
// another device without a manual refresh. Pauses while the tab is hidden
// so a background tab doesn't burn requests for nothing.
//
// Also re-runs instantly the moment anything on the SAME page calls
// notifyDataChanged() (see lib/sync-bus.ts) — e.g. adding an expense in
// one card updates the totals in another card immediately, not on the
// next poll tick.
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
    const unsubscribe = onDataChanged(() => fnRef.current());
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);
}
