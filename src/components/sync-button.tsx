"use client";

import { useState } from "react";
import { notifyDataChanged } from "@/lib/sync-bus";

type SyncState = "idle" | "loading" | "success" | "error";

export function SyncButton({
  endpoint,
  body,
  resultField,
  unitLabel,
  label = "Sync now",
}: {
  endpoint: string;
  body?: Record<string, unknown>;
  /** Key to read the synced count from in the JSON response, e.g. "leadsSynced". */
  resultField: string;
  /** Singular unit name, e.g. "lead" or "day" — pluralized automatically. */
  unitLabel: string;
  label?: string;
}) {
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setState("loading");
    setMessage(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Sync failed");
      }
      setState("success");
      const count = Number(json[resultField] ?? 0);
      setMessage(`${count} ${unitLabel}${count === 1 ? "" : "s"} synced`);
      notifyDataChanged();
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
        {state === "loading" ? "Syncing…" : label}
      </button>
    </div>
  );
}
