"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, User, UserPlus } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nextUrl, setNextUrl] = useState("");

  useEffect(() => {
    if (searchParams) {
      const n = searchParams.get("next");
      if (n) setNextUrl(n);
    }
  }, [searchParams]);

  const { showToast } = useToast();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  // Login credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register credentials
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Login failed. Please check your credentials.", "error");
        return;
      }
      showToast(`Welcome back, ${data.user.name}!`, "success");
      const dest =
        nextUrl ||
        (data.user.role === "admin"
          ? "/admin/dashboard"
          : data.user.role === "vendor"
            ? "/vendor/dashboard"
            : "/dashboard");
      router.push(dest);
      router.refresh();
    } catch {
      showToast("Unable to complete login. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          mobile: regMobile,
          whatsapp: regWhatsapp || regMobile,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Registration failed.", "error");
        return;
      }
      showToast("Account created successfully! Welcome to RAWMAT MART.", "success");
      router.push(nextUrl || "/dashboard");
      router.refresh();
    } catch {
      showToast("Registration error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/images/rawmet-logo.png" alt="RAWMAT MART" className="h-11 mx-auto mb-2 object-contain" />
          </Link>
          <h1 className="text-2xl font-black text-[#0a2458]">User Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your registered Email and Password
          </p>
        </div>

        {/* Tab Toggle: Sign In vs New User */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`rounded-xl py-2.5 transition-all ${
              tab === "login" ? "bg-[#0a2458] text-white shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`rounded-xl py-2.5 transition-all ${
              tab === "register" ? "bg-[#f97316] text-white shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            New User
          </button>
        </div>

        {tab === "login" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white py-3 text-sm font-bold shadow transition-all active:scale-[0.99]"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. ramesh@company.com"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (10 digits) *</label>
                <input
                  type="tel"
                  required
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  placeholder="9820112233"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp (Optional)</label>
                <input
                  type="tel"
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="For trade updates"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 text-sm font-bold shadow transition-all active:scale-[0.99]"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
            </button>
          </form>
        )}

        {/* Seller Portal Callout */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2">Are you an Industrial Seller / Vendor?</p>
          <Link
            href="/seller/login"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0a2458] hover:bg-blue-100 px-5 py-2 text-xs font-extrabold transition-all shadow-xs"
          >
            <span>Access Dedicated Seller Login →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
