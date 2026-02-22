import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platforms")
    .select("platform_id, name")
    .order("name");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();
  const { data, error } = await supabase
    .from("platforms")
    .insert(body)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { platform_id, ...fields } = await req.json();
  const { data, error } = await supabase
    .from("platforms")
    .update(fields)
    .eq("platform_id", platform_id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { platform_id } = await req.json();
  const { error } = await supabase
    .from("platforms")
    .delete()
    .eq("platform_id", platform_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
