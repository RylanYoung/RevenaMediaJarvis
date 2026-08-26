"use client";

import { useState } from "react";

type SyncState = "idle" | "loading" | "success" | "error";

export function LeadDistroSync() {
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/sync/lead-distro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Sync failed");
      }
      setState("success");
      setMessage(`${json.leadsSynced} lead${json.leadsSynced === 1 ? "" : "s"} synced`);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Sync failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className={`text-[11px] ${state === "error" ? "text-negative" : "text-muted"}`}>
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={sync}
        disabled={state === "loading"}
        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "loading" && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {state === "loading" ? "Syncing…" : "Sync now"}
      </button>
    </div>
  );
}
