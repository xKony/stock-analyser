"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Loading stays true — page will navigate away
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setSuccessMsg("");

    const supabase = createSupabaseBrowserClient();

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setFormError(error.message);
      } else {
        setSuccessMsg("Check your email for the confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setFormError(error.message);
      } else {
        window.location.href = "/"; // Success, redirect to dash
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--bg-shell)" }}
    >
      {/* Background glow orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{
          background: "var(--brand-primary)",
          top: "-10%",
          left: "-10%",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{
          background: "var(--brand-secondary)",
          bottom: "-10%",
          right: "-5%",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div
          className="p-10 glass-card"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="size-10 relative opacity-90 hover:opacity-100 transition-opacity shadow-[0_0_15px_var(--brand-primary)] rounded-xl">
              <Image
                src="/logo.svg"
                alt="Stockify Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className="text-2xl font-bold tracking-tight text-glow"
              style={{ color: "var(--text-display)" }}
            >
              Stockify
            </span>
          </div>

          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text-display)" }}
          >
            {authMode === "login" ? "Welcome back" : "Create Account"}
          </h1>
          <p
            className="text-sm mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            {authMode === "login"
              ? "Sign in to access your market analytics dashboard."
              : "Sign up to start tracking market sentiment."}
          </p>

          {(error || formError) && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "var(--error)",
              }}
            >
              {error === "unauthorized"
                ? "You must be an admin to access that page."
                : formError || "Authentication failed. Please try again."}
            </div>
          )}

          {successMsg && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "var(--success)",
              }}
            >
              {successMsg}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-white/10 rounded-[var(--radius-btn)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--brand-primary)]/50 focus:ring-1 focus:ring-[var(--brand-primary)]/50 transition-all placeholder:text-[var(--text-muted)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-white/10 rounded-[var(--radius-btn)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--brand-primary)]/50 focus:ring-1 focus:ring-[var(--brand-primary)]/50 transition-all placeholder:text-[var(--text-muted)]"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full py-3 mt-2 font-semibold text-sm transition-all rounded-[var(--radius-btn)] disabled:opacity-60 disabled:cursor-not-allowed bg-[var(--brand-primary)] hover:bg-[#5a52d6] text-white shadow-[0_0_15px_var(--brand-glow)]"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mx-auto" />
              ) : authMode === "login" ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </motion.button>
          </form>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-[var(--text-muted)]">
              OR
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Google OAuth Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "var(--bg-card-raised)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--r-btn)",
              color: "var(--text-body)",
            }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? "Redirecting..." : "Continue with Google"}
          </motion.button>

          <p className="text-center text-sm mt-8 text-[var(--text-secondary)]">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
              className="text-[var(--brand-primary)] hover:underline font-medium"
            >
              {authMode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p
            className="text-center text-xs mt-6"
            style={{ color: "var(--text-muted)" }}
          >
            By signing in, you agree to our terms and privacy policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
