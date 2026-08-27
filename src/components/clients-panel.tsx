"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, inputClass, primaryButtonClass } from "@/components/ui/form-field";
import { StatTile } from "@/components/ui/stat-tile";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { usePollingEffect } from "@/hooks/use-polling-effect";
import { notifyDataChanged } from "@/lib/sync-bus";

type Client = {
  id: string;
  name: string;
  status: "active" | "past";
  leads_purchased: number;
  total_revenue: number;
  notes: string | null;
  source: "manual" | "lead-distro";
  started_at: string;
  churned_at: string | null;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ClientsSummary() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePollingEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setClients(json.clients);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  });

  const na = clients ? undefined : error ? "—" : "…";
  const active = clients?.filter((c) => c.status === "active").length ?? 0;
  const past = clients?.filter((c) => c.status === "past").length ?? 0;
  const totalLeads = clients?.reduce((sum, c) => sum + c.leads_purchased, 0) ?? 0;
  const totalRevenue = clients?.reduce((sum, c) => sum + Number(c.total_revenue), 0) ?? 0;

  return (
    <div className="reveal-group grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile label="Active Clients" value={na ?? <AnimatedNumber value={active} format={(n) => String(Math.round(n))} />} tone="positive" />
      <StatTile label="Past Clients" value={na ?? <AnimatedNumber value={past} format={(n) => String(Math.round(n))} />} tone="negative" />
      <StatTile
        label="Total Leads Purchased"
        value={na ?? <AnimatedNumber value={totalLeads} format={(n) => String(Math.round(n))} />}
        hint="All clients, all-time"
      />
      <StatTile label="Total Client Revenue" value={na ?? <AnimatedNumber value={totalRevenue} format={currency} />} tone="accent" />
    </div>
  );
}

export function ClientsPanel() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [leadsPurchased, setLeadsPurchased] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setClients(json.clients);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  usePollingEffect(load);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), leads_purchased: leadsPurchased || 0 }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to add client");
      setClients((prev) => [json.client, ...(prev ?? [])]);
      setName("");
      setLeadsPurchased("");
      notifyDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(client: Client) {
    const nextStatus = client.status === "active" ? "past" : "active";
    setClients((prev) => (prev ?? []).map((c) => (c.id === client.id ? { ...c, status: nextStatus } : c)));
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);
      notifyDataChanged();
    } catch {
      load();
    }
  }

  async function remove(id: string) {
    setClients((prev) => (prev ?? []).filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);
      notifyDataChanged();
    } catch {
      load();
    }
  }

  return (
    <div>
      <form onSubmit={addClient} className="grid grid-cols-1 gap-4 border-b border-border p-6 sm:grid-cols-[2fr_1fr_auto]">
        <FormField label="Client name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunny Coast Solar"
            className={inputClass}
          />
        </FormField>
        <FormField label="Leads purchased">
          <input
            type="number"
            value={leadsPurchased}
            onChange={(e) => setLeadsPurchased(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </FormField>
        <div className="flex items-end">
          <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full sm:w-auto`}>
            + Add client
          </button>
        </div>
      </form>
      {error && clients !== null && <p className="px-6 pt-3 text-sm text-negative">{error}</p>}

      {clients === null ? (
        <div className="p-6">
          {error ? (
            <EmptyState
              title="Not connected yet"
              description="Add Supabase keys in Settings, then run supabase/schema.sql, to start tracking clients here."
            />
          ) : (
            <EmptyState title="Loading…" description="Fetching your client roster." />
          )}
        </div>
      ) : clients.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No clients yet"
            description="Hit Sync Lead Distro above to pull in your real buyer roster, or add one manually."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {clients.map((client) => (
            <div key={client.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 rounded-full ${client.status === "active" ? "bg-positive" : "bg-negative"}`}
                  />
                  <span className="text-base font-medium text-foreground">{client.name}</span>
                  <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[11px] uppercase text-muted">
                    {client.source === "lead-distro" ? "Lead Distro" : "Manual"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  Client since {formatDate(client.started_at)}
                  {client.churned_at ? ` — churned ${formatDate(client.churned_at)}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="font-mono text-lg text-foreground">{client.leads_purchased}</p>
                  <p className="text-xs text-muted">leads bought</p>
                </div>
                {client.total_revenue > 0 && (
                  <div className="text-right">
                    <p className="font-mono text-lg text-foreground">{currency(client.total_revenue)}</p>
                    <p className="text-xs text-muted">revenue</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(client)}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    {client.status === "active" ? "Mark past" : "Reactivate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(client.id)}
                    aria-label="Remove client"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-muted transition-colors hover:bg-negative/10 hover:text-negative"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
