import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Ticker parameter is required" },
      { status: 400 },
    );
  }

  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - days);

    const queryOptions = {
      period1: period1,
      interval: "1d" as const,
    };

    const result = await yahooFinance.chart(ticker, queryOptions);

    if (
      !result ||
      !("quotes" in result) ||
      !(result as { quotes?: unknown[] }).quotes ||
      (result as { quotes?: unknown[] }).quotes?.length === 0
    ) {
      return NextResponse.json(
        { error: `No historical data found for ${ticker}` },
        { status: 404 },
      );
    }

    // Format the response
    const formattedData = (
      result as { quotes: { date: Date; close: number }[] }
    ).quotes.map((item) => ({
      date: item.date.toISOString(),
      price: item.close,
    }));

    return NextResponse.json(formattedData);
  } catch (error: unknown) {
    console.error("Yahoo Finance Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch price data" },
      { status: 500 },
    );
  }
}
