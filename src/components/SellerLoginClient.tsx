"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Store,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export function SellerLoginClient() {
  const router = useRouter();
  const { showToast } = useToast();

  // Mode: "login" or "forgot"
  const [viewMode, setViewMode] = useState<"login" | "forgot">("login");
  // Login Tab: "password" or "otp"
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Login state
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);

  // Status banners
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<string | null>(null);
  const [rejectedMessage, setRejectedMessage] = useState<string | null>(null);

  // Start OTP countdown timer
  function startOtpTimer(seconds = 60) {
    setOtpTimer(seconds);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // 1. Password Login
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPendingApproval(null);
    setRejectedMessage(null);

    try {
      const res = await fetch("/api/auth/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password_login",
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === "pending") {
          setPendingApproval(data.error);
          showToast("Seller registration is under admin review.", "info");
        } else if (data.status === "rejected") {
          setRejectedMessage(data.error);
          showToast("Registration rejected. Contact support.", "error");
        } else {
          showToast(data.error || "Login failed. Please check credentials.", "error");
        }
        return;
      }

      showToast(data.message || "Login successful! Redirecting to dashboard...", "success");
      router.push(data.redirect || "/vendor/dashboard");
      router.refresh();
    } catch {
      showToast("Unable to complete login. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 2. Request OTP for Login
  async function handleRequestLoginOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      showToast("Please enter your registered business email.", "error");
      return;
    }
    setLoading(true);
    setPendingApproval(null);
    setRejectedMessage(null);

    try {
      const res = await fetch("/api/auth/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_otp",
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === "pending") {
          setPendingApproval(data.error);
        } else if (data.status === "rejected") {
          setRejectedMessage(data.error);
        } else {
          showToast(data.error || "Failed to send OTP.", "error");
        }
        return;
      }

      setOtpSent(true);
      startOtpTimer(60);
      showToast(data.message || "OTP sent to your email!", "success");
    } catch {
      showToast("Error sending OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 3. Verify OTP & Login
  async function handleVerifyLoginOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!loginOtp || loginOtp.length < 4) {
      showToast("Please enter the verification code sent to your email.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          email: email.trim(),
          otp: loginOtp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Invalid OTP code.", "error");
        return;
      }

      showToast("OTP verified! Redirecting to dashboard...", "success");
      router.push(data.redirect || "/vendor/dashboard");
      router.refresh();
    } catch {
      showToast("Login verification failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 4. Unified Forgot Password - Send Real Reset Link
  async function handleForgotRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) {
      showToast("Please enter your registered email address.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to send password reset link.", "error");
        return;
      }

      setForgotOtpSent(true);
      showToast(data.message || "Password reset link sent to your email!", "success");
    } catch {
      showToast("Unable to send password reset link. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // 5. Forgot Password - Reset with OTP
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotOtp) {
      showToast("Please enter the verification OTP.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to reset password.", "error");
        return;
      }

      showToast(data.message || "Password updated successfully! Please login.", "success");
      // Pre-fill email and switch back to password login
      setEmail(forgotEmail);
      setPassword(newPassword);
      setViewMode("login");
      setLoginMethod("password");
      setForgotOtpSent(false);
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Failed to reset password. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      {/* Container Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-9 shadow-xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0a2458] via-[#1652b8] to-[#f97316]" />

        {/* Brand Logo & Header */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-block transition-transform hover:scale-102">
            <img
              src="/images/rawmet-logo.png"
              alt="RAWMAT MART"
              className="h-10 sm:h-12 w-auto mx-auto object-contain"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0a2458] text-xs font-bold">
            <Store className="h-3.5 w-3.5 text-[#f97316]" />
            <span>Seller & Vendor Access</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-[#0a2458] tracking-tight">
            {viewMode === "login" ? "Seller Login" : "Reset Seller Password"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {viewMode === "login"
              ? "Sign in to your registered seller account to manage your business."
              : "Enter your registered email to receive a password reset link and 6-digit OTP."}
          </p>
        </div>

        {/* Status Alert Banners */}
        {pendingApproval && (
          <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-300 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs animate-fadeIn">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950 mb-0.5">Verification in Progress</p>
              <p className="leading-relaxed">{pendingApproval}</p>
              <div className="mt-2 pt-2 border-t border-amber-200/70 flex items-center gap-2">
                <span className="font-semibold text-amber-800">Need urgent approval?</span>
                <a
                  href="tel:+917382177653"
                  className="font-bold underline text-amber-900 hover:text-amber-950"
                >
                  Contact Support (+91 7382177653)
                </a>
              </div>
            </div>
          </div>
        )}

        {rejectedMessage && (
          <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-300 p-4 text-xs text-rose-900 flex items-start gap-3 shadow-xs animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-rose-950 mb-0.5">Registration Status: Rejected</p>
              <p className="leading-relaxed">{rejectedMessage}</p>
            </div>
          </div>
        )}

        {/* VIEW MODE: LOGIN */}
        {viewMode === "login" && (
          <>
            {/* Method Tabs (Password vs OTP) */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("password");
                  setOtpSent(false);
                }}
                className={`rounded-lg py-2 text-xs font-bold transition-all ${
                  loginMethod === "password"
                    ? "bg-white text-[#0a2458] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("otp")}
                className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === "otp"
                    ? "bg-white text-[#0a2458] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#f97316]" />
                <span>Login with OTP</span>
              </button>
            </div>

            {/* TAB 1: PASSWORD LOGIN */}
            {loginMethod === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registered Business Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sales@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-3 text-sm focus:border-[#0a2458] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Account Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setViewMode("forgot");
                      }}
                      className="text-xs font-bold text-[#1652b8] hover:text-[#0a2458] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm focus:border-[#0a2458] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0a2458]"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#0a2458] hover:bg-[#1652b8] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-[#f97316]" />
                      <span>Sign In to Seller Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: OTP LOGIN */}
            {loginMethod === "otp" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleRequestLoginOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Registered Business Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. sales@company.com"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-3 text-sm focus:border-[#0a2458] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        We will send a 6-digit One-Time Password (OTP) to this email address.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>Send Login OTP to Email</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 text-xs text-blue-900 flex items-center justify-between">
                      <span className="truncate">
                        OTP sent to: <strong>{email}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="font-bold underline text-[#0a2458] hover:text-[#1652b8] ml-2 shrink-0"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Enter 6-Digit Email OTP *
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={loginOtp}
                          onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-3 text-lg font-mono tracking-widest text-center text-[#0a2458] font-bold focus:border-[#0a2458] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      {otpTimer > 0 ? (
                        <span>Resend OTP in {otpTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestLoginOtp}
                          disabled={loading}
                          className="font-bold text-[#1652b8] hover:underline"
                        >
                          Resend OTP Code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || loginOtp.length < 6}
                      className="w-full rounded-full bg-[#0a2458] hover:bg-[#1652b8] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Verify OTP & Sign In</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {/* VIEW MODE: FORGOT PASSWORD */}
        {viewMode === "forgot" && (
          <div className="space-y-4">
            {!forgotOtpSent ? (
              <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Registered Business Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. sales@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-3 text-sm focus:border-[#0a2458] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    We will send a clickable password reset link and a 6-digit verification OTP to this email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !forgotEmail}
                  className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Send Reset Link & OTP</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("login")}
                    className="text-xs font-bold text-slate-600 hover:text-[#0a2458] hover:underline"
                  >
                    ← Back to Seller Sign In
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-2">
                  <div className="font-extrabold flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Password Reset Email Dispatched!</span>
                  </div>
                  <p className="leading-relaxed text-emerald-800">
                    If an account exists for <strong>{forgotEmail}</strong>, we have sent an email valid for 30 minutes containing both a <strong>RESET MY PASSWORD</strong> link and a <strong>6-digit OTP</strong>. Click the link in your email or enter the 6-digit OTP below.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Email OTP *</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-mono tracking-widest text-center text-[#0a2458] font-bold focus:border-[#0a2458] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 6 chars) *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || forgotOtp.length < 6 || newPassword.length < 6}
                    className="w-full rounded-full bg-[#0a2458] hover:bg-[#1652b8] disabled:opacity-60 text-white py-3 text-sm font-extrabold transition-all"
                  >
                    {loading ? "Updating Password..." : "Verify OTP & Save New Password"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setForgotOtpSent(false);
                    setViewMode("login");
                  }}
                  className="w-full rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 text-xs font-bold transition-all"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Links & Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3 text-center">
          <p className="text-xs text-slate-600">
            Not registered as a Seller yet?{" "}
            <Link
              href="/vendor/register"
              className="font-extrabold text-[#f97316] hover:text-[#ea580c] hover:underline inline-flex items-center gap-1"
            >
              <span>Register Business Here</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </p>

          <p className="text-xs text-slate-500">
            Are you a Buyer / Regular Customer?{" "}
            <Link
              href="/login"
              className="font-bold text-[#0a2458] hover:underline"
            >
              Buyer / User Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
