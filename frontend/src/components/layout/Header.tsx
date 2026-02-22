"use client";

import { Search, Bell, LogOut, Loader2 } from "lucide-react";
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
    router.refresh(); // Force a refresh to clear state
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 right-0 left-0 lg:left-[260px] z-30 px-6 py-4 pointer-events-none"
    >
      {/* Floating Glass Bar */}
      <div className="flex items-center justify-between pointer-events-auto h-16 px-6 rounded-[24px] border border-white/5 shadow-2xl backdrop-blur-xl bg-[var(--bg-app)]/70 relative">
        {/* Mobile Menu Trigger */}
        <div className="lg:hidden mr-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-[var(--text-secondary)]"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        {/* Search Bar with Command Hint */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
            <input
              type="text"
              placeholder="Search query or ticker..."
              className="w-full bg-[var(--bg-card)] border border-transparent focus:border-[var(--brand-primary)]/50 rounded-[var(--radius-btn)] py-2 pl-10 pr-12 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60">
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-app)] border border-white/10 rounded-[4px] shadow-sm">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>
        <div className="flex-1 sm:hidden"></div> {/* Spacer for mobile */}
        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-[var(--text-secondary)] hover:text-white">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--error)] border-2 border-[var(--bg-app)]" />
          </button>

          <div className="h-8 w-px bg-white/10 mx-1 sm:mx-2" />

          {/* Profile / Login */}
          {loading ? (
            <div className="w-24 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm font-medium text-white bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] px-3 sm:px-4 py-2 rounded-[var(--radius-btn)] border border-white/5 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-purple-400 flex items-center justify-center text-[10px] shadow-[0_0_10px_var(--brand-glow)] uppercase font-bold">
                  {user.email?.[0] || "U"}
                </div>
                <span className="hidden sm:inline-block max-w-[100px] truncate">
                  {user.email?.split("@")[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-[var(--radius-card)] bg-[var(--bg-card)] border border-white/10 shadow-2xl overflow-hidden py-1"
                  >
                    <div className="px-4 py-3 border-b border-white/5 mb-1">
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        Signed in as
                      </p>
                      <p className="text-sm font-medium text-white truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/admin"
                      className="block w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--error)] hover:bg-white/5 flex items-center gap-2 transition-colors border-t border-white/5 mt-1"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-white bg-[var(--brand-primary)] hover:bg-[#5a52d6] px-5 py-2 rounded-[var(--radius-btn)] transition-all shadow-[0_0_15px_var(--brand-glow)]"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
