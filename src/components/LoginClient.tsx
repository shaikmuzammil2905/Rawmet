"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface SessionUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: string;
}

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nextUrl, setNextUrl] = useState("");

  const { showToast } = useToast();

  // Active Session state
  const [currentSession, setCurrentSession] = useState<{
    authenticated: boolean;
    user: SessionUser | null;
  } | null>(null);

  // Tabs: "otp" (default) | "password" | "register"
  const [tab, setTab] = useState<"otp" | "password" | "register">("otp");
  const [loading, setLoading] = useState(false);

  // EMAIL OTP Login state (NO instant OTP display, NO auto-fill)
  const [otpEmail, setOtpEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(0);

  // Password Login credentials
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Register credentials
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  useEffect(() => {
    if (searchParams) {
      const n = searchParams.get("next");
      if (n) setNextUrl(n);
    }
    // Check if user is already logged in
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentSession({ authenticated: true, user: data.user });
        } else {
          setCurrentSession({ authenticated: false, user: null });
        }
      })
      .catch(() => setCurrentSession({ authenticated: false, user: null }));
  }, [searchParams]);

  // Countdown timer effect for OTP resend (60s cooldown)
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  function getDestination(role?: string) {
    if (nextUrl) return nextUrl;
    if (role === "admin") return "/admin/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/dashboard";
  }

  // 1. Send OTP to Real Email via Nodemailer SMTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = otpEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to send verification email.", "error");
        return;
      }
      setOtpSent(true);
      setTimer(60);
      setOtpCode(""); // User must manually retrieve from email!
      setMaskedEmail(data.maskedEmail || cleanEmail);
      showToast(
        data.message || "Verification code sent successfully to your email. Please check your inbox.",
        "success"
      );
    } catch {
      showToast("Unable to send verification code. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 2. Verify OTP Entered by User
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = otpEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      showToast("Please enter the 6-digit verification code.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Incorrect verification code. Please check your email.", "error");
        return;
      }
      showToast(`Welcome back, ${data.user?.name || "User"}!`, "success");
      const dest = getDestination(data.user?.role);
      router.push(dest);
      router.refresh();
    } catch {
      showToast("Verification failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 3. Email/Mobile + Password Login
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast("Please enter both email/mobile and password.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Login failed. Please check your credentials.", "error");
        return;
      }
      showToast(`Welcome back, ${data.user?.name || "User"}!`, "success");
      const dest = getDestination(data.user?.role);
      router.push(dest);
      router.refresh();
    } catch {
      showToast("Unable to complete login. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 4. Send Forgot Password Reset Link
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showToast("Please enter a valid registered email address.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      setForgotSubmitted(true);
      showToast(
        data.message || "If an account exists, a password reset link has been sent to your email.",
        "success"
      );
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 5. Register New Account
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regMobile.trim() || !regPassword) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          mobile: regMobile.trim(),
          whatsapp: regWhatsapp.trim() || regMobile.trim(),
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

  // Logout handler if already signed in
  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentSession({ authenticated: false, user: null });
    setLoading(false);
    showToast("Signed out successfully.", "info");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/images/rawmet-logo.png" alt="RAWMAT MART" className="h-11 mx-auto mb-2 object-contain" />
          </Link>
          <h1 className="text-2xl font-black text-[#0a2458]">User Login</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to access your Buyer & Seller account on RAWMAT MART
          </p>
        </div>

        {/* ALREADY LOGGED IN ALERT CARD */}
        {currentSession?.authenticated && currentSession.user && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">You are currently signed in as</p>
              <h3 className="text-base font-extrabold text-[#0a2458] mt-0.5">{currentSession.user.name}</h3>
              <p className="text-[11px] text-slate-500 font-semibold">{currentSession.user.email} • {String(currentSession.user.role).toUpperCase()}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link
                href={getDestination(currentSession.user.role)}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold shadow transition-all text-white ${
                  (currentSession.user.role || "").toLowerCase() === "admin"
                    ? "bg-[#0a2458] hover:bg-[#06183d]"
                    : (currentSession.user.role || "").toLowerCase() === "vendor"
                    ? "bg-[#f97316] hover:bg-[#ea580c]"
                    : "bg-[#0a2458] hover:bg-[#06183d]"
                }`}
              >
                <span>
                  {(currentSession.user.role || "").toLowerCase() === "admin"
                    ? "Go to Dashboard"
                    : (currentSession.user.role || "").toLowerCase() === "vendor"
                    ? "Go to Seller Dashboard"
                    : "Go to Dashboard"}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 py-2.5 px-3 text-xs font-bold transition-all"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                <span>Switch Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Toggle: Email OTP vs Password vs New User */}
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 mb-6 text-[11px] sm:text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab("otp");
              setOtpSent(false);
              setShowForgot(false);
            }}
            className={`rounded-xl py-2 transition-all flex items-center justify-center gap-1 ${
              tab === "otp" && !showForgot ? "bg-[#0a2458] text-white shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail className="h-3 w-3" />
            <span>Email OTP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("password");
              setShowForgot(false);
            }}
            className={`rounded-xl py-2 transition-all flex items-center justify-center gap-1 ${
              tab === "password" || showForgot ? "bg-[#0a2458] text-white shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="h-3 w-3" />
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setShowForgot(false);
            }}
            className={`rounded-xl py-2 transition-all flex items-center justify-center gap-1 ${
              tab === "register" ? "bg-[#f97316] text-white shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="h-3 w-3" />
            <span>New User</span>
          </button>
        </div>

        {/* TAB 1: REAL EMAIL OTP LOGIN */}
        {tab === "otp" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="e.g. name@company.com"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold tracking-wide focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter your email. A 6-digit verification code will be sent directly to your inbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otpEmail.includes("@")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] disabled:opacity-50 text-white py-3 text-sm font-bold shadow transition-all active:scale-[0.99]"
                >
                  <Mail className="h-4 w-4 text-[#f97316]" />
                  <span>{loading ? "Sending Email OTP..." : "Send OTP to Email"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-3.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[11px] text-slate-500 block">Verification code sent to:</span>
                    <strong className="text-sm font-bold text-[#0a2458] truncate block">
                      {maskedEmail || otpEmail}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="text-xs font-bold text-[#1652b8] hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Please check your email inbox or spam folder for the 6-digit code.
                </p>

                {/* Secure Manual OTP Input (No on-screen code display, No auto-fill) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-slate-300 text-center font-mono text-xl font-bold tracking-[0.4em] py-3 focus:border-[#1652b8] focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    Code expires in 5 minutes
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white py-3 text-sm font-bold shadow transition-all active:scale-[0.99]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{loading ? "Verifying..." : "Verify OTP & Sign In"}</span>
                </button>

                <div className="text-center pt-1">
                  {timer > 0 ? (
                    <span className="text-xs text-slate-500 font-medium">Resend OTP in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1652b8] hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: PASSWORD LOGIN + FORGOT PASSWORD */}
        {tab === "password" && (
          <div>
            {showForgot ? (
              /* Integrated Forgot Password Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-[#0a2458]">Forgot Password</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(false);
                      setForgotSubmitted(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1652b8] hover:underline"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to Sign In</span>
                  </button>
                </div>

                {forgotSubmitted ? (
                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-center space-y-3">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                    <p className="text-xs text-slate-700 leading-relaxed">
                      If an account exists with <strong>{forgotEmail}</strong>, a password reset link has been sent. Please check your inbox and spam folder.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(false);
                        setForgotSubmitted(false);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0a2458] text-white px-5 py-2 text-xs font-bold shadow"
                    >
                      <span>Return to Password Login</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Enter your registered email address and we will send you a secure password reset link valid for 30 minutes.
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Registered Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. name@company.com"
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !forgotEmail.includes("@")}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white py-3 text-sm font-bold shadow transition-all active:scale-[0.99]"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{loading ? "Sending Reset Link..." : "Send Password Reset Link"}</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Standard Password Login */
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email or Mobile Number</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@company.com or 10-digit mobile"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(identifier.includes("@") ? identifier : "");
                        setShowForgot(true);
                      }}
                      className="text-[11px] font-semibold text-[#1652b8] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white py-3 text-sm font-bold shadow transition-all active:scale-[0.99]"
                >
                  <KeyRound className="h-4 w-4 text-[#f97316]" />
                  <span>{loading ? "Signing In..." : "Sign In with Password"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: REGISTER NEW USER */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
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
                  maxLength={10}
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9820112233"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp (Optional)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="For trade alerts"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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

        {/* Dedicated Seller Portal Callout */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Are you an Industrial Seller / Vendor?</p>
            <Link
              href="/seller/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0a2458] hover:bg-blue-100 px-5 py-2 text-xs font-extrabold transition-all shadow-xs"
            >
              <span>Access Dedicated Seller Login →</span>
            </Link>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/admin/login"
              className="text-[11px] font-bold text-slate-500 hover:text-[#0a2458] transition-colors"
            >
              Platform Administrator? Access Super Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
