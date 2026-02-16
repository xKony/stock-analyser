import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        a.ticker,
        COUNT(am.mention_id) as mentions,
        AVG(am.sentiment_score) as avg_sentiment
      FROM assets a
      JOIN asset_mentions am ON a.asset_id = am.asset_id
      GROUP BY a.asset_id, a.ticker
      ORDER BY mentions DESC
      LIMIT 5
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
