import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="The headline numbers across the business — installer CAC/LTV, churn, and blended margin."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Installer CAC" value="—" hint="Not connected yet" />
        <StatTile label="Installer LTV" value="—" hint="Not connected yet" />
        <StatTile label="LTV : CAC ratio" value="—" hint="Not connected yet" />
        <StatTile label="Monthly Churn" value="—" hint="Not connected yet" />
        <StatTile label="Active Installer Clients" value="—" hint="Not connected yet" />
        <StatTile label="Monthly Revenue" value="—" hint="Not connected yet" />
        <StatTile label="Total Ad Spend (B2C + B2B)" value="—" hint="Not connected yet" />
        <StatTile label="Blended Margin %" value="—" hint="Not connected yet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            subtitle="Lead → Called → Booked → Closed"
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
