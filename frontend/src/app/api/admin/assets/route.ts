import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assets")
    .select("asset_id, ticker, asset_name, asset_type")
    .order("ticker");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();
  const { data, error } = await supabase
    .from("assets")
    .insert(body)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { asset_id, ...fields } = await req.json();
  const { data, error } = await supabase
    .from("assets")
    .update(fields)
    .eq("asset_id", asset_id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { asset_id } = await req.json();
  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("asset_id", asset_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
