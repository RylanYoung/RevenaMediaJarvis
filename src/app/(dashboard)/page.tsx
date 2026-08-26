import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="B2C and B2B are tracked completely separately — no shared or blended ad spend numbers."
      />

      <div className="mb-8">
        <SectionLabel>B2C — SolarSavings.au (light visibility)</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile label="Cost per Lead (CPL)" value="—" hint="Lead Distro — not connected" />
          <StatTile label="Leads Sent (this month)" value="—" hint="Lead Distro — not connected" />
        </div>
      </div>

      <div className="mb-8">
        <SectionLabel>B2B — Installer Clients (full visibility)</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Installer CAC" value="—" hint="Not connected yet" tone="accent" />
          <StatTile label="Installer LTV" value="—" hint="Not connected yet" tone="accent" />
          <StatTile label="LTV : CAC ratio" value="—" hint="Not connected yet" />
          <StatTile label="Monthly Churn Rate" value="—" hint="Not connected yet" />
          <StatTile label="Active Installer Clients" value="—" hint="Not connected yet" />
          <StatTile label="B2B Ad Spend" value="—" hint="Meta — not connected" />
        </div>
      </div>

      <div className="mb-8">
        <SectionLabel>Business-wide</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Monthly Revenue" value="—" hint="Stripe — not connected" />
          <StatTile label="Monthly Expenses" value="—" hint="Ad spend + fixed costs" />
          <StatTile label="Net Profit" value="—" hint="Revenue − Expenses" />
          <StatTile label="All-in Margin %" value="—" hint="Net Profit ÷ Revenue" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Revenue vs. Ad Spend vs. Margin"
            subtitle="Monthly trend — Financials"
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
            subtitle="Leads → Calls → Qualified → Closed"
          />
          <div className="p-5">
            <EmptyState
              title="No pipeline entries yet"
              description="B2B pipeline is logged manually — add entries on the B2B Pipeline page."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
