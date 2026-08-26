import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SyncStatus } from "@/components/ui/sync-status";
import { OverviewHero } from "@/components/overview-hero";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="B2C and B2B are tracked completely separately — no shared or blended ad spend numbers."
      />

      <OverviewHero />

      <div className="mb-6">
        <SectionLabel>B2C — SolarSavings.au (light visibility)</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile label="Cost per Lead (CPL)" value="—" hint="Lead Distro — not connected" />
          <StatTile label="Leads Sent" value="—" hint="Lead Distro — not connected" />
        </div>
      </div>

      <div className="mb-6">
        <SectionLabel>B2B — Installer Clients (full visibility)</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Installer CAC" value="—" hint="Not connected yet" tone="accent" />
          <StatTile label="Installer LTV" value="—" hint="Not connected yet" tone="accent" />
          <StatTile label="LTV : CAC ratio" value="—" hint="Not connected yet" />
          <StatTile label="Monthly Churn Rate" value="—" hint="Not connected yet" />
          <StatTile label="Active Installer Clients" value="—" hint="Not connected yet" />
          <StatTile label="B2B Ad Spend" value="—" hint="Meta — not connected" />
        </div>
      </div>

      <div className="reveal-group grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Revenue vs. Ad Spend vs. Margin"
            subtitle="Monthly trend — Financials"
            action={<SyncStatus />}
          />
          <div className="p-5">
            <EmptyState
              title="No data yet"
              description="Populates once Lead Distro, Meta, and manual financial entries are wired up."
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="B2B Pipeline Snapshot"
            subtitle="Leads → Qualified Call → Closed"
            action={<SyncStatus />}
          />
          <div className="p-5">
            <EmptyState
              title="No pipeline entries yet"
              description="Add or move leads on the B2B Pipeline page to see them here."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
