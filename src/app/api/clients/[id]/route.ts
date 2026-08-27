import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.notes === "string") update.notes = body.notes.trim() || null;
    if (typeof body.leads_purchased !== "undefined") update.leads_purchased = Number(body.leads_purchased) || 0;
    if (body.status === "active" || body.status === "past") {
      update.status = body.status;
      update.churned_at = body.status === "past" ? new Date().toISOString() : null;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("clients").update(update).eq("id", id).select().single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, client: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
