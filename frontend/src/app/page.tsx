"use client";

import { StatsCards } from "@/components/Dashboard/StatsCards/index";
import { SentimentChart } from "@/components/Dashboard/SentimentChart";
import { TopStocksTable } from "@/components/Dashboard/TopStocksTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout>
      {/* 00 / Top Metadata Rule */}
      <div className="flex items-center justify-between border-b border-rule pb-6 mb-12">
        <div className="flex items-center gap-6 font-mono text-[10px] text-ink uppercase tracking-widest">
          <span className="font-bold">EDITION: {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}</span>
          <span className="text-ink/30">/</span>
          <span>MARKET INTELLIGENCE TERMINAL</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 font-mono text-[10px] text-ink uppercase tracking-widest">
          <span>CONNECTIVITY: STABLE</span>
          <span className="text-ink/30">/</span>
          <span>LATENCY: 24MS</span>
        </div>
      </div>

      {/* Main Sections with numbered labels */}
      <div className="space-y-20">
        <section>
          <div className="flex items-center gap-4 mb-8">
            <span className="font-serif text-2xl italic text-signal">01</span>
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] font-bold">Vital Statistics</h2>
            <div className="flex-1 h-px bg-rule/10" />
          </div>
          <StatsCards />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <span className="font-serif text-2xl italic text-signal">02</span>
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] font-bold">Sentiment Velocity</h2>
              <div className="flex-1 h-px bg-rule/10" />
            </div>
            <SentimentChart className="h-[550px]" />
          </div>
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="font-serif text-2xl italic text-signal">03</span>
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] font-bold">Market Mentions</h2>
              <div className="flex-1 h-px bg-rule/10" />
            </div>
            <TopStocksTable className="h-full" />
          </div>
        </section>

        {/* HERO/BRANDING - Moved to Bottom */}
        <section className="pt-12 border-t-2 border-rule">
          <div className="flex items-center gap-4 mb-10">
            <span className="font-serif text-2xl italic text-signal">04</span>
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] font-bold">Intelligence Profile</h2>
            <div className="flex-1 h-px bg-rule/10" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h1 className="text-7xl lg:text-9xl font-serif font-black tracking-tighter text-ink mb-10 leading-[0.8] uppercase">
                Stock <br />
                <span className="italic font-normal lowercase">Analyser</span>
              </h1>
              <p className="text-2xl font-serif text-ink italic leading-snug max-w-xl">
                Real-time analysis of social patterns and linguistic trends across global financial markets. Our neural engines process data points to deliver quantified sentiment.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-12 border-l border-rule/10 pl-12">
              <div className="space-y-4">
                <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">About the Engine</p>
                <p className="text-lg font-serif text-ink leading-relaxed">
                  Utilizing multi-stage ingestion from various social aggregators, the Stock Analyser quantifies public conviction into actionable intelligence. No marketing fluff—just the data as it happens.
                </p>
              </div>
              <div className="flex items-center gap-12 font-mono text-[10px] text-ink uppercase tracking-widest pt-8 border-t border-rule/10">
                <div>
                  <p className="text-ink-muted mb-1">DATA SOURCE</p>
                  <p className="font-bold tracking-wider">Reddit / PRAW</p>
                </div>
                <div>
                  <p className="text-ink-muted mb-1">PROCESSING</p>
                  <p className="font-bold tracking-wider">Gemini / Mistral</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
