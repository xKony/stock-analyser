"use client";

import { useEffect, useState } from "react";

interface Stock {
  ticker: string;
  mentions: number;
  avg_sentiment: number;
}

export function TopStocksTable() {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    fetch("/api/top-stocks")
      .then((res) => res.json())
      .then((data: Stock[] | { error: string }) => {
        if (Array.isArray(data)) {
          setStocks(data);
        } else {
          console.error("Failed to fetch top stocks:", data);
          setStocks([]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Top Stocks by Mentions
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ticker
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mentions
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Avg Sentiment
              </th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.ticker}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span className="font-bold text-gray-900">
                    {stock.ticker}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {stock.mentions}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span
                    className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                      stock.avg_sentiment > 0
                        ? "text-green-900"
                        : stock.avg_sentiment < 0
                          ? "text-red-900"
                          : "text-gray-900"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`absolute inset-0 opacity-50 rounded-full ${
                        stock.avg_sentiment > 0
                          ? "bg-green-200"
                          : stock.avg_sentiment < 0
                            ? "bg-red-200"
                            : "bg-gray-200"
                      }`}
                    ></span>
                    <span className="relative">
                      {parseFloat(stock.avg_sentiment.toString()).toFixed(2)}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
