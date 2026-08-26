import { NextResponse } from "next/server";
import { fetchCharges, upsertCharges } from "@/lib/stripe";

export const maxDuration = 30;

async function runSync(days: number) {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setDate(dateFrom.getDate() - (days - 1));

  const charges = await fetchCharges({ dateFrom, dateTo });
  const paymentsSynced = await upsertCharges(charges);

  return { paymentsSynced, syncedAt: new Date().toISOString() };
}

// Manual trigger — the "Sync Stripe" button on Financials. Mostly a
// backstop now that the webhook (see /api/webhooks/stripe) handles new
// payments instantly — useful for a one-off historical backfill.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const days = Math.min(Math.max(Number(body.days) || 30, 1), 365);
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
// GET with an Authorization header Vercel sets from CRON_SECRET. Acts as
// a safety net in case a webhook delivery ever gets missed.
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
