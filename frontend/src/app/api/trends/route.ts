import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "7";
  const ticker = searchParams.get("ticker");

  try {
    // Supabase RPC parameters
    const rpcParams = {
      days: days === "all" ? null : parseInt(days),
      ticker_filter: ticker === "Global" ? null : ticker,
    };

    const { data, error } = await supabase.rpc(
      "get_sentiment_trends",
      rpcParams,
    );

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
