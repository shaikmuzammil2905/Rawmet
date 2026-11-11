"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Lock, Phone, ShieldCheck, Store, UserPlus } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "";
  const { showToast } = useToast();

  const [tab, setTab] = useState<"otp" | "password" | "register">("otp");
  const [loading, setLoading] = useState(false);

  // OTP state
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  // Password state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not send OTP", "error");
        return;
      }
      setOtpSent(true);
      setDemoOtpHint(data.demoOtp || null);
      showToast(data.message, "success");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Invalid OTP", "error");
        return;
      }
      showToast("Login successful!", "success");
      const dest =
        nextUrl ||
        (data.user?.role === "vendor" ? "/vendor/dashboard" : "/dashboard");
      router.push(dest);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Login failed", "error");
        return;
      }
      showToast(`Welcome back, ${data.user.name}!`, "success");
      const dest =
        nextUrl ||
        (data.user.role === "admin"
          ? "/admin"
          : data.user.role === "vendor"
            ? "/vendor/dashboard"
            : "/dashboard");
      router.push(dest);
      router.refresh();
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
        showToast(data.error || "Registration failed", "error");
        return;
      }
      showToast("Account created! Welcome to RAWMET.com.", "success");
      router.push(nextUrl || "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <img src="/images/rawmet-logo.png" alt="RAWMET.com" className="h-11 mx-auto mb-2 object-contain" />
          <h1 className="text-2xl font-extrabold text-[#0a2458]">Customer &amp; Vendor Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Secure access via Mobile OTP or Password
          </p>
        </div>

        {/* Mode Switch */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("otp")}
            className={`rounded-xl py-2 transition-all ${
              tab === "otp" ? "bg-[#0a2458] text-white shadow" : "text-slate-600"
            }`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={`rounded-xl py-2 transition-all ${
              tab === "password" ? "bg-[#0a2458] text-white shadow" : "text-slate-600"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`rounded-xl py-2 transition-all ${
              tab === "register" ? "bg-[#f97316] text-white shadow" : "text-slate-600"
            }`}
          >
            New User
          </button>
        </div>

        {tab === "otp" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    10-Digit Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9811223344"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white py-3 text-sm font-bold shadow"
                >
                  {loading ? "Sending OTP..." : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {demoOtpHint && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-[#0a2458]">
                    Sandbox Verification OTP: <strong className="text-base tracking-widest">{demoOtpHint}</strong>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit OTP sent to +91 {mobile}
                  </label>
                  <div className="relative">
                    <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm tracking-widest focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 text-sm font-bold shadow"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className="w-full text-xs font-semibold text-slate-500 hover:text-[#0a2458]"
                >
                  Change mobile number
                </button>
              </form>
            )}
          </div>
        )}

        {tab === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email or Mobile</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@company.com or 10-digit mobile"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
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
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white py-3 text-sm font-bold shadow"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="text"
              required
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="Full Name *"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
            <input
              type="email"
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="Email Address *"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="tel"
                required
                value={regMobile}
                onChange={(e) => setRegMobile(e.target.value)}
                placeholder="Mobile (10 digits) *"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
              <input
                type="tel"
                value={regWhatsapp}
                onChange={(e) => setRegWhatsapp(e.target.value)}
                placeholder="WhatsApp Number"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Create Password (min 6 chars) *"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 text-sm font-bold shadow"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? "Creating Account..." : "Register Customer Account"}</span>
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link href="/vendor/register" className="inline-flex items-center gap-1 font-bold text-[#f97316] hover:underline">
            <Store className="h-3.5 w-3.5" />
            Register as Vendor
          </Link>
          <Link href="/admin/login" className="inline-flex items-center gap-1 font-bold text-[#0a2458] hover:underline">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-slate-500">Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}

