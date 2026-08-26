// Meta Marketing API (Graph API) client — this one's a stable, publicly
// documented endpoint, unlike the Lead Distro read paths in lead-distro.ts.

const GRAPH_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

function requireEnv() {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!adAccountId || !accessToken) {
    throw new Error("META_AD_ACCOUNT_ID / META_ACCESS_TOKEN are not set — add them in Settings / .env.local.");
  }
  return { adAccountId, accessToken };
}

export type MetaDailySpend = {
  date: string; // YYYY-MM-DD
  spend: number;
};

export async function fetchAccountName(): Promise<string> {
  const { adAccountId, accessToken } = requireEnv();
  const url = new URL(`${BASE_URL}/${adAccountId}`);
  url.searchParams.set("fields", "name");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url);
  if (!res.ok) return "Meta B2B Ads";
  const json = await res.json();
  return json.name ?? "Meta B2B Ads";
}

export async function fetchDailySpend(params: { dateFrom: string; dateTo: string }): Promise<MetaDailySpend[]> {
  const { adAccountId, accessToken } = requireEnv();
  const url = new URL(`${BASE_URL}/${adAccountId}/insights`);
  url.searchParams.set("fields", "spend,date_start,date_stop");
  url.searchParams.set("time_range", JSON.stringify({ since: params.dateFrom, until: params.dateTo }));
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Meta Marketing API insights failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const rows: Array<{ spend?: string; date_start: string }> = json.data ?? [];
  return rows.map((row) => ({
    date: row.date_start,
    spend: Number(row.spend ?? 0),
  }));
}
