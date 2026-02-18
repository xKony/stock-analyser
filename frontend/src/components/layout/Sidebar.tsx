"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart2,
  Globe,
  Settings,
  LogOut,
  PieChart,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: BarChart2, label: "Analytics", href: "/analytics" },
  { icon: Globe, label: "Market News", href: "/news" },
  { icon: PieChart, label: "Portfolio", href: "/portfolio" },
  { icon: HelpCircle, label: "FAQ", href: "/faq" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-screen sticky top-0 left-0 hidden lg:flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl p-6"
    >
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <div className="size-4 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Stockify
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "text-white bg-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  "transition-transform group-hover:scale-110",
                  isActive && "text-primary",
                )}
              />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/5 rounded-xl border border-white/5"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 w-full transition-colors hover:bg-red-500/10">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}
