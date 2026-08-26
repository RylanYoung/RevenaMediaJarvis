import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Manual entries reuse the same ad_spend table synced rows live in — each
// gets a synthetic campaign_id ("manual-<uuid>") so it never collides with
// a real Lead Distro/Meta campaign_id, and so multiple manual entries on
// the same day and funnel don't overwrite each other via the sync upsert.
const MANUAL_PREFIX = "manual-";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ad_spend")
      .select("*")
      .like("campaign_id", `${MANUAL_PREFIX}%`)
      .order("spend_date", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, entries: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const funnel = body.funnel === "b2b" ? "b2b" : body.funnel === "b2c" ? "b2c" : null;
    const cost = Number(body.cost);
    if (!funnel || !isFinite(cost) || cost <= 0) {
      return NextResponse.json({ ok: false, error: "Funnel and a valid amount are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ad_spend")
      .insert({
        funnel,
        campaign_id: `${MANUAL_PREFIX}${crypto.randomUUID()}`,
        campaign_name: typeof body.label === "string" && body.label.trim() ? body.label.trim() : "Manual entry",
        spend_date: body.spend_date || new Date().toISOString().slice(0, 10),
        cost,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, entry: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
