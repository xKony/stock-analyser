import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query("SELECT ticker FROM assets ORDER BY ticker ASC");
    // Return array of strings
    const tickers = result.rows.map((row: { ticker: string }) => row.ticker);
    return NextResponse.json(tickers);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
