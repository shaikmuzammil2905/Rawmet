"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, expectedRole: "admin", rememberMe }),
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

          <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
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
                onClick={() => setShowForgotModal(true)}
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

          <div className="mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-blue-300/80">
            Protected by role-based access control & SHA-256 session encryption.
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-800">
              <div className="flex items-center gap-3 mb-3 text-[#0a2458]">
                <HelpCircle className="h-6 w-6 text-[#f97316]" />
                <h3 className="font-extrabold text-base">Admin Password Recovery</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                To reset the Super Admin credential, access your secure server environment or EC2 instance terminal directly to run the reset CLI command, or contact the primary server owner.
              </p>
              <div className="rounded-xl bg-slate-100 p-3 text-[11px] font-mono text-slate-700 mb-4 break-all">
                admin@rawmet.com • Seed Key Protected
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white py-2 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
