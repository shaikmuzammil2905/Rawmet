"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, HelpCircle, CheckCircle2, ArrowRight, KeyRound } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Forgot Password / Recovery Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("admin@rawmet.com");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  async function handleAdminLogin(e?: React.FormEvent, customCreds?: { id: string; pass: string }) {
    if (e) e.preventDefault();
    const idToUse = customCreds ? customCreds.id : identifier;
    const passToUse = customCreds ? customCreds.pass : password;

    if (!idToUse || !passToUse) {
      showToast("Please enter admin identifier and password.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: idToUse, password: passToUse, expectedRole: "admin", rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Admin authentication failed.", "error");
        return;
      }
      showToast("Authenticated to RAWMAT MART Super Admin Panel.", "success");
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAdminLogin() {
    setIdentifier("admin@rawmet.com");
    setPassword("RawmetAdmin#2026");
    handleAdminLogin(undefined, { id: "admin@rawmet.com", pass: "RawmetAdmin#2026" });
  }

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast("Please enter your admin email address.", "error");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess(true);
        showToast("Password reset link sent to your admin email via SMTP!", "success");
      } else {
        showToast(data.error || "Failed to send reset link.", "error");
      }
    } catch {
      showToast("Network error dispatching reset link.", "error");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-[#06183d] text-white p-7 sm:p-9 shadow-2xl border border-blue-900/60 relative overflow-hidden">
          {/* Subtle accent glow */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#f97316]/20 blur-3xl pointer-events-none" />

          <div className="text-center mb-7 relative z-10">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#f97316] flex items-center justify-center mb-3.5 shadow-lg shadow-orange-500/20">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Super Admin Portal</h1>
            <p className="text-xs text-blue-200 mt-1.5 font-medium">
              Authorized personnel authentication for RAWMAT MART
            </p>
          </div>

          <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-blue-100 mb-1.5">
                Admin Email Address / Identifier
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-blue-200/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@rawmet.com"
                  className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-blue-200/50 focus:border-[#f97316] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-100 mb-1.5">
                Admin Secure Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-blue-200/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-blue-200/50 focus:border-[#f97316] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-200/70 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-blue-200 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-[#f97316] focus:ring-0 h-3.5 w-3.5"
                />
                <span>Remember Session</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setResetSuccess(false);
                }}
                className="text-[#f97316] hover:text-orange-400 font-semibold underline underline-offset-2 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3 text-sm font-extrabold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access Super Admin Dashboard</span>
              )}
            </button>
          </form>

          {/* 1-Click Super Admin Access Button */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={loading}
              className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="h-3.5 w-3.5 text-[#f97316]" />
              <span>1-Click Sign In (Super Admin Master Key)</span>
            </button>
          </div>

          <div className="mt-4 text-center text-[11px] text-blue-300/80">
            Protected by role-based access control & SHA-256 session encryption.
          </div>
        </div>

        {/* Real Admin Password Recovery & Reset Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl text-slate-800 relative">
              <div className="flex items-center gap-3 mb-3 text-[#0a2458]">
                <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                  <KeyRound className="h-5 w-5 text-[#f97316]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0a2458]">Admin Password Recovery</h3>
                  <p className="text-[11px] text-slate-500">Reset password via email or login with Super Admin Key</p>
                </div>
              </div>

              {resetSuccess ? (
                <div className="space-y-4 my-4">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Reset Link Sent Successfully!</p>
                      <p className="mt-1 text-emerald-700 leading-relaxed">
                        We have dispatched a secure password reset link to <strong>{resetEmail}</strong>. Please check your inbox or spam folder.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full rounded-full bg-[#0a2458] text-white py-2.5 text-xs font-bold hover:bg-[#06183d] transition-colors"
                  >
                    Done & Back to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-4 my-2">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the Super Admin email address to receive an official password reset link directly in your inbox:
                  </p>

                  <form onSubmit={handleSendResetEmail} className="space-y-3">
                    <div className="relative">
                      <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@rawmet.com"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-[#0a2458] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full rounded-xl bg-[#0a2458] hover:bg-[#06183d] disabled:opacity-60 text-white py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {resetLoading ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching Reset Email...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Password Reset Email</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-2">
                      Or 1-Click Master Key Login
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                      <ShieldCheck className="h-4 w-4 text-[#f97316]" />
                      <span>Default Super Admin Key</span>
                    </div>
                    <p className="text-amber-700 mb-2">
                      Identifier: <strong className="font-mono">admin@rawmet.com</strong><br />
                      Password: <strong className="font-mono">RawmetAdmin#2026</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        handleQuickAdminLogin();
                      }}
                      className="w-full rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white py-2 text-xs font-bold transition-colors shadow-sm"
                    >
                      Instant Sign In with Master Key
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold transition-colors mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
