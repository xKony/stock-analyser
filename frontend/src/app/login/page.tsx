"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { Button } from "@/components/ui/Button";

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-paper selection:bg-highlight selection:text-ink">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <EditorialPanel className="p-10 bg-white">
          {/* Header Metadata */}
          <div className="flex justify-between items-center border-b border-rule/10 pb-4 mb-10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Authentication Terminal
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-ink">
              Stock Analyser
            </span>
          </div>

          <h1 className="text-4xl font-serif font-black tracking-tighter text-ink mb-2 leading-none uppercase">
            {authMode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-ink-muted font-serif italic text-lg mb-8 leading-snug">
            {authMode === "login"
              ? "Sign in to access your intelligence dashboard."
              : "Sign up to track market sentiment."}
          </p>

          {(error || formError) && (
            <div className="mb-6 px-4 py-3 border border-signal bg-signal/10 text-signal font-mono text-[10px] uppercase tracking-wider font-bold">
              {error === "unauthorized"
                ? "You must be an admin to access that page."
                : formError || "Authentication failed. Please try again."}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 px-4 py-3 border border-green-800 bg-green-100 text-green-900 font-mono text-[10px] uppercase tracking-wider font-bold">
              {successMsg}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-paper border border-rule/20 rounded-none px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">
                Access Code / Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper border border-rule/20 rounded-none px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:border-ink transition-colors placeholder:text-ink/30"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <Button
              disabled={loading}
              type="submit"
              variant="primary"
              className="w-full mt-4"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mx-auto text-paper" />
              ) : authMode === "login" ? (
                "Authenticate"
              ) : (
                "Register"
              )}
            </Button>
          </form>

          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-rule/10"></div>
            <span className="flex-shrink-0 mx-4 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Alternative Method
            </span>
            <div className="flex-grow border-t border-rule/10"></div>
          </div>

          {/* Google OAuth Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="ghost"
            className="w-full flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-ink" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="currentColor"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="currentColor"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="currentColor"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="currentColor"
                />
              </svg>
            )}
            {loading ? "Redirecting..." : "Continue with Google"}
          </Button>

          <p className="text-center font-serif text-ink-muted mt-8 mb-4">
            {authMode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
              className="font-bold text-ink hover:text-signal transition-colors italic"
            >
              {authMode === "login" ? "Register here." : "Sign in here."}
            </button>
          </p>

          <p className="text-center font-mono text-[9px] uppercase tracking-widest text-ink-muted/50">
            By authenticating, you agree to our terms.
          </p>
        </EditorialPanel>
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
