import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 50;
  const ticker = searchParams.get("ticker");

  let query = supabase
    .from("asset_mentions")
    .select(
      `
      mention_id,
      asset_id,
      platform_id,
      sentiment_score,
      confidence_level,
      created_at,
      assets (ticker),
      platforms (name)
    `,
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (ticker) {
    query = query.eq("assets.ticker", ticker);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { mention_id, ...fields } = await req.json();
  const { data, error } = await supabase
    .from("asset_mentions")
    .update(fields)
    .eq("mention_id", mention_id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { mention_id } = await req.json();
  const { error } = await supabase
    .from("asset_mentions")
    .delete()
    .eq("mention_id", mention_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
