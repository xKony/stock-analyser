"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LineChart,
  PieChart,
  Settings,
  LogOut,
  X,
  HelpCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { icon: LayoutDashboard, label: "Market Overview", href: "/" },
  { icon: LineChart, label: "Sentiment Index", href: "/sentiment" },
  { icon: PieChart, label: "Asset Allocation", href: "/assets" },
  { icon: HelpCircle, label: "Intelligence FAQ", href: "/faq" },
  { icon: Settings, label: "System Config", href: "/settings" },
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
          "fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-rule bg-paper",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        {/* Brand Identity */}
        <div className="h-24 flex items-center px-10 border-b border-rule">
          <Link href="/" className="group">
            <h1 className="text-2xl font-serif font-black tracking-tighter leading-[0.8] text-ink group-hover:text-signal transition-colors uppercase">
              Stock <br /><span className="italic font-normal lowercase">Analyser</span>
            </h1>
          </Link>
          
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-2 text-ink"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation - Monospaced & Authoritative */}
        <nav className="flex-1 px-6 py-10 space-y-1">
          <div className="px-4 mb-4">
            <p className="text-[10px] font-mono text-ink-muted uppercase tracking-[0.2em]">TERMINAL</p>
          </div>
          
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    "relative flex items-center gap-4 px-4 py-3 transition-all duration-200 group overflow-hidden",
                    isActive
                      ? "bg-highlight text-ink"
                      : "text-ink/60 hover:text-ink hover:bg-ink/5",
                  )}
                >
                  <item.icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={cn(
                      "relative z-10 transition-colors",
                      isActive ? "text-ink" : "group-hover:text-ink",
                    )}
                  />
                  <span className="relative z-10 font-mono text-[11px] uppercase tracking-widest">
                    {item.label}
                  </span>

                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System Status / Footer */}
        <div className="p-8 border-t border-rule">
          <button className="flex items-center gap-3 w-full px-6 py-3 text-[10px] font-mono bg-ink text-paper hover:bg-signal transition-all uppercase tracking-widest">
            <LogOut size={16} />
            <span>Exit Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
