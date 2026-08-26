import { NextResponse } from "next/server";
import { fetchCharges } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 30;

async function runSync(days: number) {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setDate(dateFrom.getDate() - (days - 1));

  const charges = await fetchCharges({ dateFrom, dateTo });
  const supabase = getSupabaseAdmin();

  let paymentsSynced = 0;
  if (charges.length > 0) {
    const rows = charges
      .filter((c) => c.paid) // only money that actually landed
      .map((c) => ({
        id: c.id,
        amount: c.amount / 100,
        currency: c.currency,
        customer_id: c.customer,
        description: c.description,
        status: c.status,
        refunded: c.refunded,
        paid_at: new Date(c.created * 1000).toISOString(),
        synced_at: new Date().toISOString(),
      }));

    const { error } = await supabase.from("stripe_payments").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Supabase stripe_payments upsert failed: ${error.message}`);
    paymentsSynced = rows.length;
  }

  return { paymentsSynced, syncedAt: new Date().toISOString() };
}

// Manual trigger — the "Sync Stripe" button on Financials.
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
// GET with an Authorization header Vercel sets from CRON_SECRET.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2-day lookback so a delayed/missed run the day before doesn't leave a gap.
    const result = await runSync(2);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
