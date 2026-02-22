"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "What data sources does Stockify use?",
    a: "Stockify aggregates posts from Reddit (r/wallstreetbets, r/stocks, r/investing) and other social platforms, running AI sentiment analysis on each mention.",
  },
  {
    q: "How is the sentiment score calculated?",
    a: "Each post is analyzed by a large language model and assigned a score from -1 (very negative) to +1 (very positive). Daily scores are averaged across all mentions for a ticker.",
  },
  {
    q: "How often is the data refreshed?",
    a: "The pipeline runs on a scheduled basis, ingesting and analyzing new posts. The exact frequency depends on the backend configuration.",
  },
  {
    q: "Can I track custom tickers?",
    a: "Currently the platform tracks tickers that appear in monitored communities. Custom watchlist support is planned for a future release.",
  },
];

export default function FAQPage() {
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold tracking-tight mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          FAQ
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Common questions about the Stockify platform
        </p>
      </div>

      {/* FAQ list */}
      <div className="grid grid-cols-1 gap-4 max-w-3xl">
        {faqs.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
          >
            <GlassPanel
              delay={0}
              className="group hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-[var(--radius-btn)] flex-shrink-0 bg-white/5 text-[var(--brand-primary)]">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.q}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
}
