// Lead Distro's real integration surface is MCP (JSON-RPC over HTTP), not a
// REST API — confirmed by testing every plausible REST path (all 404) and
// then testing this endpoint directly (works, stateless, no session
// handshake needed — Authorization header alone identifies the account).
// Response is SSE-formatted with a single "data: {...}" line; the actual
// tool payload is a JSON string nested inside result.content[0].text
// (Claude-facing tool-call convention), so it's double-JSON-encoded.

const MCP_URL = "https://mcp.leaddistro.ai/mcp";

function requireKey() {
  const key = process.env.LEAD_DISTRO_API_KEY;
  if (!key) {
    throw new Error("LEAD_DISTRO_API_KEY is not set — add it in Settings / .env.local.");
  }
  return key;
}

async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const key = requireKey();
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`Lead Distro MCP request failed: ${res.status} ${await res.text()}`);
  }

  const raw = await res.text();
  const dataLine = raw.split("\n").find((line) => line.startsWith("data: "));
  if (!dataLine) {
    throw new Error(`Lead Distro MCP: no data in response for ${name}: ${raw.slice(0, 200)}`);
  }

  const envelope = JSON.parse(dataLine.slice("data: ".length));
  if (envelope.error) {
    throw new Error(`Lead Distro MCP error calling ${name}: ${envelope.error.message}`);
  }

  const text = envelope.result?.content?.[0]?.text;
  if (!text) {
    throw new Error(`Lead Distro MCP: unexpected response shape for ${name}: ${JSON.stringify(envelope).slice(0, 200)}`);
  }

  const parsed = JSON.parse(text);
  if (!parsed.success) {
    throw new Error(`Lead Distro tool ${name} returned failure: ${JSON.stringify(parsed).slice(0, 200)}`);
  }
  return parsed.data as T;
}

export type LeadDistroBuyer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  location: string | null;
  created_at: string;
};

export async function listBuyers(): Promise<LeadDistroBuyer[]> {
  return callTool<LeadDistroBuyer[]>("list_buyers");
}

export type LeadBreakdownRow = {
  label: string;
  count: number;
  revenue: number;
  cost: number;
  profit: number;
};

export async function getLeadBreakdownByBuyer(dateFrom: string, dateTo: string): Promise<LeadBreakdownRow[]> {
  const result = await callTool<{ breakdown: LeadBreakdownRow[] }>("get_lead_breakdown", {
    date_from: dateFrom,
    date_to: dateTo,
    group_by: "buyer",
  });
  return result.breakdown;
}

export type LeadDistroLead = {
  id: string;
  campaign_id: string;
  supplier_id: string | null;
  buyer_id: string | null;
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

export async function getLeads(params: {
  campaignId: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<LeadDistroLead[]> {
  const result = await callTool<{ leads: LeadDistroLead[] }>("get_leads", {
    campaign_id: params.campaignId,
    date_from: params.dateFrom,
    date_to: params.dateTo,
    limit: params.limit ?? 100,
  });
  return result.leads;
}

export type CampaignPerformance = {
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

export async function getCampaignPerformance(params: {
  campaignId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<CampaignPerformance> {
  return callTool<CampaignPerformance>("get_campaign_performance", {
    campaign_id: params.campaignId,
    date_from: params.dateFrom,
    date_to: params.dateTo,
  });
}
