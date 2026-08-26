import { NextResponse } from "next/server";
import { fetchAccountName, fetchDailySpend } from "@/lib/meta-ads";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 30;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function runSync(days: number) {
  const today = new Date();
  const dateFrom = new Date(today);
  dateFrom.setDate(dateFrom.getDate() - (days - 1));

  const [accountName, dailySpend] = await Promise.all([
    fetchAccountName(),
    fetchDailySpend({ dateFrom: isoDate(dateFrom), dateTo: isoDate(today) }),
  ]);

  const adAccountId = process.env.META_AD_ACCOUNT_ID!;
  const supabase = getSupabaseAdmin();

  const rows = dailySpend.map((day) => ({
    funnel: "b2b" as const,
    campaign_id: adAccountId,
    campaign_name: accountName,
    spend_date: day.date,
    cost: day.spend,
    synced_at: new Date().toISOString(),
  }));

  let spendSynced = 0;
  if (rows.length > 0) {
    const { error } = await supabase
      .from("ad_spend")
      .upsert(rows, { onConflict: "funnel,campaign_id,spend_date" });
    if (error) throw new Error(`Supabase ad_spend upsert failed: ${error.message}`);
    spendSynced = rows.length;
  }

  return { spendSynced, syncedAt: new Date().toISOString() };
}

// Manual trigger — the "Sync now" button on B2B Pipeline.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Meta's insights endpoint returns one row per day in a single call
    // (time_increment=1), so unlike the Lead Distro sync there's no need
    // to loop day-by-day — a wider default range is cheap here.
    const days = Math.min(Math.max(Number(body.days) || 7, 1), 90);
    const result = await runSync(days);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Automatic trigger — Vercel Cron (see vercel.json) calls this daily via
// GET with an Authorization header Vercel sets from CRON_SECRET.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSync(2);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
