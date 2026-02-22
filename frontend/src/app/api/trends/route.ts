import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");
  const ticker = searchParams.get("ticker") || null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_sentiment_trends", {
    p_ticker: ticker,
    p_days: days,
  });

  if (error) {
    console.error("RPC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
