import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("leads_purchased", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, clients: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Manual add — for a client not (yet) in Lead Distro.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ ok: false, error: "Client name is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        status: body.status === "past" ? "past" : "active",
        leads_purchased: Number(body.leads_purchased) || 0,
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        source: "manual",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, client: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
