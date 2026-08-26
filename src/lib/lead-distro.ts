// Lead Distro REST client.
//
// CONFIRMED: the domain (https://www.leaddistro.ai/api/v1) and the
// `x-api-key` auth header, taken directly from Lead Distro's own
// campaign ingest spec for this account.
//
// NOT CONFIRMED: the exact paths below (`/leads`, `/campaigns/:id/performance`).
// Lead Distro's ingest spec only documents the *inbound* POST endpoint
// suppliers use to push leads in — there's no equivalent published spec
// for reading leads/performance back out. These paths are the most
// likely shape given their REST conventions, but verify against Lead
// Distro's API docs (or ask their support) and adjust here if they 404.

const BASE_URL = "https://www.leaddistro.ai/api/v1";

function headers() {
  const apiKey = process.env.LEAD_DISTRO_API_KEY;
  if (!apiKey) {
    throw new Error("LEAD_DISTRO_API_KEY is not set — add it in Settings / .env.local.");
  }
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };
}

export type LeadDistroLead = {
  id: string;
  campaign_id: string;
  supplier_id: string | null;
  status: string;
  outcome: string | null;
  state: string | null;
  zip_code: string | null;
  cost: number;
  revenue: number;
  price: number;
  quality_score: number | null;
  tags: string[];
  created_at: string;
  accepted_at: string | null;
  converted_at: string | null;
};

export async function fetchLeads(params: {
  campaignId: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<LeadDistroLead[]> {
  const url = new URL(`${BASE_URL}/leads`);
  url.searchParams.set("campaign_id", params.campaignId);
  if (params.dateFrom) url.searchParams.set("date_from", params.dateFrom);
  if (params.dateTo) url.searchParams.set("date_to", params.dateTo);
  url.searchParams.set("limit", "100");

  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Lead Distro get_leads failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.data?.leads ?? [];
}

export type LeadDistroCampaignPerformance = {
  campaign: {
    id: string;
    name: string;
    total_leads: number;
    accepted: number;
    converted: number;
    revenue: number;
    cost: number;
    profit: number;
    margin_pct: number;
  };
};

export async function fetchCampaignPerformance(params: {
  campaignId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<LeadDistroCampaignPerformance> {
  const url = new URL(`${BASE_URL}/campaigns/${params.campaignId}/performance`);
  url.searchParams.set("date_from", params.dateFrom);
  url.searchParams.set("date_to", params.dateTo);

  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Lead Distro get_campaign_performance failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
