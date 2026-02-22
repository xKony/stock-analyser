"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { motion } from "framer-motion";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg-app)",
        color: "var(--text-secondary)",
      }}
    >
      {/* Revamp 3.0: Atmosphere - Animated Mesh Gradient & Noise Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated Aurora Orbs */}
        <motion.div
          animate={{
            transform: [
              "translate(0%, 0%) scale(1)",
              "translate(5%, -5%) scale(1.1)",
              "translate(-5%, 5%) scale(0.9)",
              "translate(0%, 0%) scale(1)",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[140px] opacity-[0.15]"
          style={{
            background: "radial-gradient(circle, #6C63FF 0%, transparent 60%)",
          }}
        />
        <motion.div
          animate={{
            transform: [
              "translate(0%, 0%) scale(1)",
              "translate(-5%, 5%) scale(1.15)",
              "translate(5%, -5%) scale(0.85)",
              "translate(0%, 0%) scale(1)",
            ],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 2,
          }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, #4F46E5 0%, transparent 60%)",
          }}
        />
        {/* SVG Film Grain Noise Overlay (pointer-events-none ensures clicks pass through) */}
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
          style={{ backgroundColor: "var(--bg-overlay)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 lg:ml-[260px] transition-[margin] duration-300">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 px-6 pb-6 pt-24 lg:px-8 lg:pt-28 overflow-y-auto"
        >
          <div className="max-w-[1600px] mx-auto space-y-8">{children}</div>
        </motion.main>
      </div>
    </div>
  );
}
