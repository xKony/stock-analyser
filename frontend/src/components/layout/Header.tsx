"use client";

import { Search, Bell, LogOut, Loader2, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] z-30 bg-paper/80 backdrop-blur-md border-b border-rule h-20 flex items-center px-6 lg:px-10">
      <div className="flex items-center justify-between w-full">
        {/* Mobile Menu Trigger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-ink hover:text-signal transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar - Editorial Style */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 group-focus-within:text-signal transition-colors" />
            <input
              type="text"
              placeholder="SEARCH THE INTELLIGENCE..."
              className="w-full bg-transparent border-none py-2 pl-8 pr-12 text-xs font-mono text-ink placeholder:text-ink/30 focus:outline-none transition-all uppercase"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
              <kbd className="text-[10px] font-mono border border-rule px-1.5 py-0.5">⌘K</kbd>
            </div>
          </div>
        </div>

        <div className="flex-1 sm:hidden"></div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <button className="relative p-2 text-ink hover:text-signal transition-colors group">
            <Bell size={20} strokeWidth={1.5} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-signal" />
          </button>

          <div className="h-4 w-px bg-rule/20" />

          {/* Profile / Login */}
          {loading ? (
            <div className="w-8 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-ink-muted" />
            </div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 text-xs font-mono text-ink hover:text-signal transition-all uppercase"
              >
                <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center font-bold text-xs">
                  {user.email?.[0] || "U"}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate">
                  {user.email?.split("@")[0]}
                </span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-4 w-56 bg-white border border-rule shadow-xl py-2"
                  >
                    <div className="px-4 py-3 border-b border-rule/10 mb-2">
                      <p className="text-[10px] font-mono text-ink-muted uppercase">IDENTITY</p>
                      <p className="text-sm font-serif font-bold text-ink truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/admin"
                      className="block w-full text-left px-4 py-2 text-xs font-mono text-ink hover:bg-highlight transition-colors uppercase"
                      onClick={() => setMenuOpen(false)}
                    >
                      Control Center
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-xs font-mono text-signal hover:bg-highlight flex items-center gap-2 transition-colors border-t border-rule/10 mt-2 uppercase"
                    >
                      <LogOut size={14} />
                      <span>Terminate Session</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-mono bg-ink text-paper px-6 py-2.5 hover:bg-signal transition-colors uppercase tracking-widest"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
