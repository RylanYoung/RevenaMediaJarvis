import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const STAGES = [
  { label: "Leads", hint: "Installer prospects entered" },
  { label: "Called", hint: "Conversion from Leads" },
  { label: "Booked", hint: "Conversion from Called" },
  { label: "Closed", hint: "Conversion from Booked" },
];

export default function B2BPipelinePage() {
  return (
    <>
      <PageHeader
        title="B2B Pipeline"
        description="Installer client sales funnel — logged manually (low volume). Lead → Called → Booked → Closed."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage) => (
          <StatTile key={stage.label} label={stage.label} value="—" hint={stage.hint} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Stage Conversion %" subtitle="Lead → Called → Booked → Closed" />
          <div className="p-5">
            <EmptyState
              title="No pipeline entries yet"
              description="Conversion rates will appear once entries are logged below."
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Pipeline Entries" subtitle="Manual entry" action={
            <button
              type="button"
              className="rounded-md border border-border bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              + Add entry
            </button>
          } />
          <div className="p-5">
            <EmptyState
              title="No entries yet"
              description="Manual pipeline entry form will live here once wired to storage."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
