"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Filter,
  BrainCircuit,
  HelpCircle,
  ChevronDown,
  Server,
  Code2,
} from "lucide-react";
import { useState } from "react";

const pipelineSteps = [
  {
    icon: <Database className="w-5 h-5 text-ink" />,
    title: "1. Data Gathering",
    desc: "An asynchronous Python pipeline scrapes 7 top finance subreddits (e.g., r/wallstreetbets) via Reddit API. It strictly filters out noise, keeping only posts/comments with a minimum score (e.g., 10+) to ensure quality signal.",
  },
  {
    icon: <Filter className="w-5 h-5 text-ink" />,
    title: "2. Noise Reduction",
    desc: "Raw JSON data is deduplicated. We optionally strip non-ASCII characters and emojis to optimize the token context window for the AI, keeping the actual financial discussion intact.",
  },
  {
    icon: <BrainCircuit className="w-5 h-5 text-ink" />,
    title: "3. AI Sentiment Engine",
    desc: "Structured data feeds directly into strictly prompted LLMs (Mistral/Gemini). The AI scans for tickers, understands retail slang ('diamond hands', 'calls printing'), and assigns a sentiment (-1.0 to 1.0) and confidence score.",
  },
  {
    icon: <Server className="w-5 h-5 text-ink" />,
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
      <div className="mb-16 pb-8 border-b border-rule/20">
        <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter mb-6 text-ink uppercase leading-none">
          How It Works
        </h1>
        <p className="text-xl md:text-2xl max-w-3xl text-ink-muted font-serif italic leading-snug">
          Full transparency into our data pipeline. No black boxes, no
          sugarcoated metrics. Just pure community sentiment, extracted by AI,
          and rendered in real-time.
        </p>
      </div>

      {/* Pipeline Section */}
      <h2 className="text-sm font-mono uppercase tracking-widest font-bold mb-8 text-ink flex items-center gap-3">
        <Code2 className="w-5 h-5 text-signal" />
        The Pipeline Architecture
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-24 relative">
        {/* Connection line for desktop */}
        <div className="hidden xl:block absolute top-[2.5rem] left-0 w-full h-px bg-rule/20 border-t border-dashed border-rule/40 z-0" />

        {pipelineSteps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.5, ease: "easeOut" }}
            className="z-10"
          >
            <EditorialPanel className="h-full flex flex-col p-6 hover:bg-highlight/10 transition-colors">
              <div className="mb-6 p-4 bg-paper inline-block border border-rule">
                {step.icon}
              </div>
              <h3 className="text-xl font-serif font-bold mb-4 text-ink uppercase">
                {step.title}
              </h3>
              <p className="text-base font-serif text-ink-muted leading-relaxed">
                {step.desc}
              </p>
            </EditorialPanel>
          </motion.div>
        ))}
      </div>

      {/* FAQ Accordion Section */}
      <h2 className="text-sm font-mono uppercase tracking-widest font-bold mb-8 text-ink flex items-center gap-3 pt-12 border-t border-rule/20">
        <HelpCircle className="w-5 h-5 text-signal" />
        Frequently Asked Questions
      </h2>

      <div className="space-y-4 max-w-4xl mb-16">
        {faqs.map((faq, i) => {
          const isOpen = openFaq === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.3 }}
            >
              <div
                className={`cursor-pointer transition-all duration-300 border bg-white ${
                  isOpen
                    ? "border-signal shadow-sm"
                    : "border-rule/20 hover:border-rule"
                }`}
                onClick={() => setOpenFaq(isOpen ? null : i)}
              >
                <div className="p-6 flex items-center justify-between gap-6">
                  <h3
                    className={`text-xl font-serif font-bold transition-colors ${isOpen ? "text-signal" : "text-ink"}`}
                  >
                    {faq.q}
                  </h3>
                  <div
                    className={`p-2 border transition-transform duration-300 ${isOpen ? "rotate-180 border-signal text-signal" : "border-rule/20 text-ink"}`}
                  >
                    <ChevronDown size={20} />
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
                      <div className="px-6 pb-8 text-lg font-serif italic leading-relaxed text-ink border-t border-rule/10 pt-6">
                        {faq.a}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
