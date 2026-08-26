import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { PipelineBoard } from "@/components/pipeline-board";

const STAGES = [
  { label: "Cost per Lead (CPL)", hint: "B2B ad spend ÷ leads — Meta" },
  { label: "Leads", hint: "In from Meta / Lead Distro" },
  { label: "Qualified Calls Booked", hint: "Conversion from Leads" },
  { label: "Closed", hint: "Conversion from Qualified" },
  { label: "Avg. Deal Size", hint: "Revenue per closed client" },
];

export default function B2BPipelinePage() {
  return (
    <>
      <PageHeader
        title="B2B Pipeline"
        description="Leads land automatically from Meta / Lead Distro once connected. You move them by hand through Qualified Call and Closed."
      />

      <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage) => (
          <StatTile key={stage.label} label={stage.label} value="—" hint={stage.hint} />
        ))}
      </div>

      <div className="mt-6">
        <PipelineBoard />
      </div>

      <div className="mt-8">
        <SectionLabel>Churn</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Monthly Churn Rate" value="—" hint="Clients cancelled ÷ active clients" />
          <StatTile label="Clients Churned (this month)" value="—" hint="Not connected yet" />
          <StatTile label="Avg. Leads Bought Before Churn" value="—" hint="Not connected yet" />
        </div>
      </div>
    </>
  );
}
