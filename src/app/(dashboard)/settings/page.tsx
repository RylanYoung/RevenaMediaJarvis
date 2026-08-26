import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { Card, CardHeader } from "@/components/ui/card";
import { IntegrationsList, type Integration } from "@/components/integrations-list";

export default function SettingsPage() {
  const integrations: Integration[] = [
    {
      name: "Lead Distro",
      description: "B2C leads, campaign performance, and B2C ad spend.",
      poweredSections: "B2C Funnel, Overview, Financials",
      envVars: [{ key: "LEAD_DISTRO_API_KEY", connected: !!process.env.LEAD_DISTRO_API_KEY }],
    },
    {
      name: "Meta Marketing API",
      description: "B2B ad spend and B2B leads (separate ad account from B2C).",
      poweredSections: "B2B Pipeline, Overview, Financials, Growth Calculator",
      envVars: [
        { key: "META_AD_ACCOUNT_ID", connected: !!process.env.META_AD_ACCOUNT_ID },
        { key: "META_ACCESS_TOKEN", connected: !!process.env.META_ACCESS_TOKEN },
      ],
    },
    {
      name: "Stripe",
      description: "Installer client payments — the source of truth for Revenue.",
      poweredSections: "Overview, Financials",
      envVars: [{ key: "STRIPE_SECRET_KEY", connected: !!process.env.STRIPE_SECRET_KEY }],
    },
    {
      name: "Supabase",
      description: "Database for manual pipeline entries, fixed costs, and lead packages.",
      poweredSections: "B2B Pipeline, Financials (persistence across sessions)",
      envVars: [
        { key: "SUPABASE_URL", connected: !!process.env.SUPABASE_URL },
        { key: "SUPABASE_ANON_KEY", connected: !!process.env.SUPABASE_ANON_KEY },
      ],
    },
    {
      name: "Dashboard Login",
      description: "The shared username/password gate on every page except this one's status check.",
      poweredSections: "Whole app",
      envVars: [
        { key: "DASHBOARD_USERNAME", connected: !!process.env.DASHBOARD_USERNAME },
        { key: "DASHBOARD_PASSWORD", connected: !!process.env.DASHBOARD_PASSWORD },
      ],
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Connection status for every integration. Keys are never shown or stored here — only whether each one is set."
      />

      <div className="mb-6">
        <SectionLabel>Integrations</SectionLabel>
        <IntegrationsList integrations={integrations} />
      </div>

      <Card>
        <CardHeader title="How to set a key" subtitle="Same variable name, two places depending on where you're running" />
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
          <div className="bg-surface p-5">
            <p className="text-sm font-medium text-foreground">Local development</p>
            <p className="mt-1 text-xs text-muted">
              Open <code className="font-mono">.env.local</code> in the project root, paste the value after the
              `=`, save, and restart <code className="font-mono">npm run dev</code>.
            </p>
          </div>
          <div className="bg-surface p-5">
            <p className="text-sm font-medium text-foreground">Deployed on Vercel</p>
            <p className="mt-1 text-xs text-muted">
              Project → Settings → Environment Variables → add the same key/value → redeploy for it to take
              effect.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
