"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { motion } from "framer-motion";

export default function FAQPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-400">
          Find answers to common questions about the platform.
        </p>
      </div>

      <GlassPanel className="min-h-[400px]">
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">?</span>
            </div>
            <h3 className="text-xl font-medium text-white">No Questions Yet</h3>
            <p className="text-gray-400 max-w-md">
              The FAQ content is currently being updated. Please check back
              later or contact support.
            </p>
          </motion.div>
        </div>
      </GlassPanel>
    </DashboardLayout>
  );
}
