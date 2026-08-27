import { NextResponse } from "next/server";
import { getFinancialsSummary } from "@/lib/financials-summary";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 30;
    const summary = await getFinancialsSummary(days);
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
