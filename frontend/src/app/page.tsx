"use client";

import { StatsCards } from "@/components/Dashboard/StatsCards";
import { SentimentChart } from "@/components/Dashboard/SentimentChart";
import { TopStocksTable } from "@/components/Dashboard/TopStocksTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold tracking-tight mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Market Overview
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Real-time AI analysis of stock market sentiment and social trends
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8">
        <StatsCards />
      </div>

      {/* Main content — chart + table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SentimentChart className="h-full" />
        </div>
        <div>
          <TopStocksTable className="h-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
