"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Filter,
  BrainCircuit,
  Activity,
  HelpCircle,
  ChevronDown,
  Server,
  Code2,
} from "lucide-react";
import { useState } from "react";

const pipelineSteps = [
  {
    icon: <Database className="w-6 h-6 text-blue-400" />,
    title: "1. Data Gathering",
    desc: "An asynchronous Python pipeline scrapes 7 top finance subreddits (e.g., r/wallstreetbets) via Reddit API. It strictly filters out noise, keeping only posts/comments with a minimum score (e.g., 10+) to ensure quality signal.",
  },
  {
    icon: <Filter className="w-6 h-6 text-purple-400" />,
    title: "2. Noise Reduction",
    desc: "Raw JSON data is deduplicated. We optionally strip non-ASCII characters and emojis to optimize the token context window for the AI, keeping the actual financial discussion intact.",
  },
  {
    icon: <BrainCircuit className="w-6 h-6 text-emerald-400" />,
    title: "3. AI Sentiment Engine",
    desc: "Structured data feeds directly into strictly prompted LLMs (Mistral/Gemini). The AI scans for tickers, understands retail slang ('diamond hands', 'calls printing'), and assigns a sentiment (-1.0 to 1.0) and confidence score.",
  },
  {
    icon: <Server className="w-6 h-6 text-orange-400" />,
    title: "4. Aggregation & Storage",
    desc: "The parsed JSON output from the LLM is upserted into our Supabase PostgreSQL database. The data is normalized into a 3-table schema mapping platforms, assets, and raw mentions.",
  },
];

const faqs = [
  {
    q: "How exactly is the sentiment score calculated?",
    a: "We don't use simple keyword matching. We feed the raw, context-rich paragraphs into an LLM (Large Language Model). The LLM evaluates the contextual tone of the mention—accounting for financial slang, sarcasm, and intent. It returns a specific float value from -1.0 (extreme bearish) to 1.0 (extreme bullish), alongside a confidence rating.",
  },
  {
    q: "Why do you use Reddit data?",
    a: "Reddit, specifically communities like r/wallstreetbets and r/stocks, acts as a high-frequency aggregator of retail sentiment. While noisy, our strict pre-LLM filtering (minimum upvotes, minimum comment length) ensures we only extract sentiment from discussions that the community itself deemed valuable.",
  },
  {
    q: "Is the AI always right?",
    a: "No. While the LLM is explicitly prompted to understand retail trading slang, deep sarcasm or highly ambiguous phrasing can occasionally result in misclassification. To combat this, we rely on the law of large numbers: aggregating sentiment across hundreds of posts smooths out individual errors. We also track a 'confidence' score for each mention.",
  },
  {
    q: "How are the dashboard scores determined?",
    a: "The dashboard queries Supabase and calculates the moving averages of the sentiment scores for each asset across standard timeframes. There is no hidden math here: it's purely the mean average of all LLM-scored mentions for that ticker.",
  },
  {
    q: "What tickers are tracked?",
    a: "We don't use a rigid, pre-defined whitelist. If a valid stock or crypto ticker is organically mentioned in a popular post on our target subreddits, the LLM will identify and track it automatically.",
  },
  {
    q: "How often is the data refreshed?",
    a: "The system is a decoupled, batched pipeline. The dashboard updates whenever the backend Python script runs its collection and processing cycle, effectively pushing fresh data into the database.",
  },
];

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
          How It Works
        </h1>
        <p className="text-base md:text-lg max-w-2xl text-[var(--text-secondary)] leading-relaxed">
          Full transparency into our data pipeline. No black boxes, no
          sugarcoated metrics. Just pure community sentiment, extracted by AI,
          and rendered in real-time.
        </p>
      </div>

      {/* Pipeline Section */}
      <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] flex items-center gap-2">
        <Code2 className="w-6 h-6 text-[var(--brand-primary)]" />
        The Pipeline Architecture
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-16 relative">
        {/* Connection line for desktop */}
        <div className="hidden xl:block absolute top-[4.5rem] left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-orange-500/20 z-0" />

        {pipelineSteps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.5, ease: "easeOut" }}
            className="z-10"
          >
            <GlassPanel className="h-full relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl group-hover:bg-white/[0.04] transition-colors" />
              <div className="mb-4 p-3 rounded-2xl bg-[#0F1117]/80 inline-block border border-white/5 shadow-inner">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.desc}
              </p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {/* FAQ Accordion Section */}
      <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)] flex items-center gap-2">
        <HelpCircle className="w-6 h-6 text-[var(--brand-primary)]" />
        Frequently Asked Questions
      </h2>

      <div className="space-y-3 max-w-3xl mb-12">
        {faqs.map((faq, i) => {
          const isOpen = openFaq === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.3 }}
            >
              <GlassPanel
                className={`cursor-pointer transition-all duration-300 ${
                  isOpen
                    ? "border-[var(--brand-primary)]/30 bg-white/[0.03]"
                    : "hover:bg-[var(--bg-card-hover)]"
                }`}
                onClick={() => setOpenFaq(isOpen ? null : i)}
              >
                <div className="p-5 flex items-center justify-between gap-4">
                  <h3
                    className={`text-base font-medium transition-colors ${isOpen ? "text-white" : "text-[var(--text-primary)]"}`}
                  >
                    {faq.q}
                  </h3>
                  <div
                    className={`p-1 rounded-full bg-white/5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <ChevronDown
                      size={18}
                      className="text-[var(--text-secondary)]"
                    />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.section
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 },
                      }}
                      transition={{
                        duration: 0.3,
                        ease: [0.04, 0.62, 0.23, 0.98],
                      }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 text-sm leading-relaxed text-[var(--text-secondary)] border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
