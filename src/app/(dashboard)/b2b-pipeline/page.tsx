import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const STAGES = [
  { label: "Cost per Lead (CPL)", hint: "B2B ad spend ÷ leads — Meta" },
  { label: "Leads", hint: "Installer prospects entered" },
  { label: "Calls", hint: "Conversion from Leads" },
  { label: "Qualified", hint: "Conversion from Calls" },
  { label: "Closed", hint: "Conversion from Qualified" },
  { label: "Avg. Deal Size", hint: "Revenue per closed client" },
];

export default function B2BPipelinePage() {
  return (
    <>
      <PageHeader
        title="B2B Pipeline"
        description="The full installer sales CRM: Leads → Calls → Qualified → Closed. Logged by hand, imported for history — B2B ad spend stays separate from B2C throughout."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage) => (
          <StatTile key={stage.label} label={stage.label} value="—" hint={stage.hint} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Stage Conversion %" subtitle="Leads → Calls → Qualified → Closed" />
          <div className="p-5">
            <EmptyState
              title="No pipeline entries yet"
              description="Conversion rates will appear once entries are logged or imported."
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Pipeline Entries"
            subtitle="Leads, calls, qualified, closed, and deal size — per client or per month"
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-border bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  Import history
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  + Add entry
                </button>
              </div>
            }
          />
          <div className="p-5">
            <EmptyState
              title="No entries yet"
              description="Log new pipeline activity here, or import past leads/calls/closed data — including historical ad spend — once storage is wired up."
            />
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <SectionLabel>Churn</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Monthly Churn Rate" value="—" hint="Clients cancelled ÷ active clients" />
          <StatTile label="Clients Churned (this month)" value="—" hint="Not connected yet" />
          <StatTile label="Avg. Leads Bought Before Churn" value="—" hint="Not connected yet" />
        </div>
      </div>
    </>
  );
}
