import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error) {
    console.error("RPC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RPC returns an array of rows, we expect one row
  const stats = Array.isArray(data) && data.length > 0 ? data[0] : null;

  if (!stats) {
    return NextResponse.json(
      { totalAssets: 0, totalMentions: 0, averageSentiment: 0 },
      { status: 200 },
    );
  }

  return NextResponse.json({
    totalAssets: Number(stats.total_assets),
    totalMentions: Number(stats.total_mentions),
    averageSentiment: Number(stats.average_sentiment),
  });
}
