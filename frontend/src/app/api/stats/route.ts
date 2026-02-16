import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const assetsCount = await query("SELECT COUNT(*) FROM assets");
    const mentionsCount = await query("SELECT COUNT(*) FROM asset_mentions");
    const avgSentiment = await query(
      "SELECT AVG(sentiment_score) FROM asset_mentions",
    );

    return NextResponse.json({
      totalAssets: parseInt(assetsCount.rows[0].count),
      totalMentions: parseInt(mentionsCount.rows[0].count),
      averageSentiment: parseFloat(avgSentiment.rows[0].avg || "0").toFixed(2),
    });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
