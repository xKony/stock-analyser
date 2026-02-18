import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase.rpc("get_dashboard_stats");

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // The RPC returns a JSON object directly
    return NextResponse.json(data);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
