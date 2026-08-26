"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";

export type Integration = {
  name: string;
  description: string;
  envVars: { key: string; connected: boolean }[];
  poweredSections: string;
};

export function IntegrationsList({ integrations }: { integrations: Integration[] }) {
  return (
    <div className="reveal-group flex flex-col gap-4">
      {integrations.map((integration) => {
        const allConnected = integration.envVars.every((v) => v.connected);
        return (
          <Card key={integration.name}>
            <CardHeader
              title={integration.name}
              subtitle={integration.description}
              action={
                <span
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    allConnected
                      ? "border-positive/30 bg-positive/10 text-positive"
                      : "border-border bg-surface-hover text-muted"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${allConnected ? "bg-positive" : "bg-muted/50"}`} />
                  {allConnected ? "Connected" : "Not connected"}
                </span>
              }
            />
            <div className="divide-y divide-border">
              {integration.envVars.map((v) => (
                <EnvVarRow key={v.key} envKey={v.key} connected={v.connected} />
              ))}
            </div>
            <p className="border-t border-border px-5 py-3 text-[11px] text-muted">
              Powers: {integration.poweredSections}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

function EnvVarRow({ envKey, connected }: { envKey: string; connected: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(envKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-positive" : "bg-muted/50"}`} />
        <code className="font-mono text-xs text-foreground">{envKey}</code>
      </div>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-border bg-surface-hover px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-accent hover:text-accent"
      >
        {copied ? "Copied" : "Copy name"}
      </button>
    </div>
  );
}
