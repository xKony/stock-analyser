"use client";

import { Search, Bell, Menu } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/5 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="lg:hidden">
        <button className="p-2 text-gray-400">
          <Menu />
        </button>
      </div>

      <div className="flex-1 max-w-md mx-auto hidden lg:block">
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search stocks, crypto, news..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <Bell size={20} />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-black shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-full transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            Log In
          </button>
        </div>
      </div>
    </motion.header>
  );
}
