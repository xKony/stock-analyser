"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { motion } from "framer-motion";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen relative bg-paper selection:bg-highlight selection:text-ink">
      {/* Editorial Grain Texture */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-noise mix-blend-multiply" />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 lg:hidden bg-ink/20 backdrop-blur-[2px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Bordered and Paper-colored */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 lg:ml-[280px]">
        {/* Header with bottom rule */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 px-6 pb-12 pt-28 lg:px-12 lg:pt-32"
        >
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </motion.main>
      </div>
    </div>
  );
}
