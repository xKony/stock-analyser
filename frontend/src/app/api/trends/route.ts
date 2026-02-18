import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "7";
  const ticker = searchParams.get("ticker");

  try {
    let queryText = `
      SELECT 
        DATE(created_at) as date,
        AVG(sentiment_score) as sentiment
      FROM asset_mentions
    `;

    const params: (string | number)[] = [];
    const conditions: string[] = [];

    if (ticker && ticker !== "Global") {
      // We need to join with assets table to filter by ticker
      queryText = `
        SELECT 
          DATE(am.created_at) as date,
          AVG(am.sentiment_score) as sentiment
        FROM asset_mentions am
        JOIN assets a ON am.asset_id = a.asset_id
      `;
      conditions.push(`a.ticker = $${params.length + 1}`);
      params.push(ticker);
    }

    if (days !== "all") {
      // Use a different alias if joined, or no alias if single table
      const dateCol =
        ticker && ticker !== "Global" ? "am.created_at" : "created_at";
      conditions.push(
        `${dateCol} >= NOW() - INTERVAL '${parseInt(days)} days'`,
      );
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Group by
    const dateCol =
      ticker && ticker !== "Global" ? "am.created_at" : "created_at";
    queryText += ` GROUP BY DATE(${dateCol}) ORDER BY DATE(${dateCol}) ASC`;

    const result = await query(queryText, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
