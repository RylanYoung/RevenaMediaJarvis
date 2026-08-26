"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";

type RevenueEntry = {
  id: string;
  amount: number;
  description: string | null;
  entry_date: string;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function RevenuePanel() {
  const [entries, setEntries] = useState<RevenueEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/financials/revenue")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setEntries(json.entries);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(load, []);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/financials/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description, entry_date: entryDate }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to add entry");
      setEntries((prev) => [json.entry, ...(prev ?? [])]);
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/financials/revenue/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);
    } catch {
      load();
    }
  }

  return (
    <div>
      <form onSubmit={addEntry} className="flex flex-wrap items-end gap-3 border-b border-border p-5">
        <label className="flex w-32 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Amount (AUD)</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Description</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Invoice — Excelled Electrical"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex w-40 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Date</span>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          + Add
        </button>
      </form>

      {entries === null && !error && (
        <div className="p-5">
          <EmptyState title="Loading…" description="Fetching revenue entries." />
        </div>
      )}
      {error && (
        <div className="p-5">
          <EmptyState
            title="Not connected yet"
            description="Add Supabase keys in Settings, then run supabase/schema.sql, to start logging revenue here."
          />
        </div>
      )}
      {entries !== null && entries.length === 0 && !error && (
        <div className="p-5">
          <EmptyState
            title="No manual entries yet"
            description="Stripe and Lead Distro revenue is added automatically once synced (see the breakdown above) — this form is for anything else, like cash or bank transfer payments."
          />
        </div>
      )}
      {entries !== null && entries.length > 0 && (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <span className="text-foreground">{entry.description || "Revenue entry"}</span>
                <span className="ml-2 text-xs text-muted">{formatDate(entry.entry_date)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-foreground">{currency(entry.amount)}</span>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  aria-label="Remove entry"
                  className="text-muted transition-colors hover:text-negative"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
