import { StatsCards } from "@/components/Dashboard/StatsCards";
import { SentimentChart } from "@/components/Dashboard/SentimentChart";
import { TopStocksTable } from "@/components/Dashboard/TopStocksTable";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Stock Sentiment Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time analysis of stock market sentiment
          </p>
        </header>

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SentimentChart />
          </div>
          <div>
            <TopStocksTable />
          </div>
        </div>
      </div>
    </main>
  );
}
