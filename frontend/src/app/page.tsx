import { StatsCards } from "@/components/Dashboard/StatsCards";
import { SentimentChart } from "@/components/Dashboard/SentimentChart";
import { TopStocksTable } from "@/components/Dashboard/TopStocksTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Market Overview
        </h1>
        <p className="text-gray-400">
          Real-time analysis of stock market sentiment and trends
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SentimentChart />
        </div>
        <div className="h-full">
          <TopStocksTable />
        </div>
      </div>
    </DashboardLayout>
  );
}
