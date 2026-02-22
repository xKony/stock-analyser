import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: assets, error } = await supabase
      .from("assets")
      .select("ticker")
      .order("ticker", { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return array of strings
    const tickers = assets?.map((row) => row.ticker) || [];
    return NextResponse.json(tickers);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
