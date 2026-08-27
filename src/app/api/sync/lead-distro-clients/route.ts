import { NextResponse } from "next/server";
import { listBuyers, getLeadBreakdownByBuyer } from "@/lib/lead-distro-mcp";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 30;

// Manual trigger — "Sync Lead Distro" on the Clients page. Pulls the real
// buyer roster and how many leads each has bought (all-time), upserted by
// lead_distro_buyer_id so re-syncing never creates duplicates.
export async function POST() {
  try {
    const [buyers, breakdown] = await Promise.all([
      listBuyers(),
      getLeadBreakdownByBuyer("2020-01-01", new Date().toISOString().slice(0, 10)),
    ]);

    // get_lead_breakdown groups by buyer *name*, not id — that's the only
    // join key it exposes — so match on exact name.
    const breakdownByName = new Map(breakdown.map((row) => [row.label, row]));

    const supabase = getSupabaseAdmin();
    const rows = buyers.map((buyer) => {
      const stats = breakdownByName.get(buyer.name);
      return {
        lead_distro_buyer_id: buyer.id,
        name: buyer.name,
        status: buyer.status === "active" ? ("active" as const) : ("past" as const),
        leads_purchased: stats?.count ?? 0,
        total_revenue: stats?.revenue ?? 0,
        source: "lead-distro" as const,
        started_at: buyer.created_at.slice(0, 10),
        synced_at: new Date().toISOString(),
      };
    });

    let clientsSynced = 0;
    if (rows.length > 0) {
      const { error } = await supabase
        .from("clients")
        .upsert(rows, { onConflict: "lead_distro_buyer_id" });
      if (error) throw new Error(`Supabase clients upsert failed: ${error.message}`);
      clientsSynced = rows.length;
    }

    return NextResponse.json({ ok: true, clientsSynced, syncedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
