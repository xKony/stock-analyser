"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  LineChart,
  PieChart,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: LineChart, label: "Market Sentiment", href: "/sentiment" },
  { icon: PieChart, label: "Top Assets", href: "/assets" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-white/5",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "bg-[var(--bg-app)]/80 backdrop-blur-xl", // Glass sidebar
        )}
      >
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] shadow-lg shadow-[var(--brand-glow)]">
              <Zap size={20} className="text-white" fill="currentColor" />
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Stockify
            </span>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-2 text-[var(--text-secondary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 text-sm font-medium py-6">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-[var(--radius-btn)] transition-all duration-200 group overflow-hidden",
                    isActive
                      ? "text-white shadow-lg shadow-[var(--brand-glow)]"
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5",
                  )}
                >
                  {/* Active Background (Glass) */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 rounded-[var(--radius-btn)]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}

                  <item.icon
                    size={20}
                    className={cn(
                      "relative z-10 transition-colors",
                      isActive
                        ? "text-[var(--brand-primary)]"
                        : "group-hover:text-white",
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile Placeholder */}
        <div className="p-6 border-t border-white/5">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded-[var(--radius-btn)] transition-colors">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
