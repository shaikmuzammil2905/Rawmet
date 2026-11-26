"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "./ToastProvider";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const initialEmail = searchParams.get("email") || "";
  const { showToast } = useToast();

  const [checking, setChecking] = useState(Boolean(token));
  const [verifiedMode, setVerifiedMode] = useState<"token" | "otp" | null>(null);
  const [userEmail, setUserEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Auto-validate token when opened via email link
  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    if (token.length !== 64) {
      setChecking(false);
      setVerifiedMode(null);
      setErrorMessage("The password reset link is invalid or incomplete.");
      return;
    }

    async function checkToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setVerifiedMode("token");
          setUserEmail(data.email || initialEmail);
        } else {
          setVerifiedMode(null);
          setErrorMessage(
            data.error || "This password reset link is invalid, has expired, or has already been used."
          );
        }
      } catch {
        setVerifiedMode(null);
        setErrorMessage("Unable to verify reset link. Please check your network connection.");
      } finally {
        setChecking(false);
      }
    }

    checkToken();
  }, [token, initialEmail]);

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = userEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    if (!cleanEmail || !/^\d{6}$/.test(cleanOtp)) {
      showToast("Please enter your registered email and 6-digit OTP.", "error");
      return;
    }
    setVerifyingOtp(true);
    setErrorMessage("");
    try {
      const res = await fetch(
        `/api/auth/reset-password?email=${encodeURIComponent(cleanEmail)}&otp=${encodeURIComponent(cleanOtp)}`
      );
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifiedMode("otp");
        showToast("OTP verified! Please enter your new password.", "success");
      } else {
        setErrorMessage(data.error || "Invalid or expired OTP.");
        showToast(data.error || "Invalid or expired OTP.", "error");
      }
    } catch {
      showToast("Network error verifying OTP.", "error");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match. Please re-enter.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload =
        verifiedMode === "token"
          ? { token, password }
          : { email: userEmail.trim().toLowerCase(), otp: otpCode.trim(), password };

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResetSuccess(true);
        showToast(data.message || "Password reset successfully!", "success");
      } else {
        showToast(data.error || "Failed to reset password.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img
              src="/images/rawmet-logo.png"
              alt="RAWMAT MART"
              className="h-11 mx-auto mb-2 object-contain"
            />
          </Link>
          <h1 className="text-2xl font-black text-[#0a2458]">Reset Password</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create a secure new password for your RAWMAT MART account
          </p>
        </div>

        {checking ? (
          <div className="py-12 text-center space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-[#f97316] animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Verifying reset authorization link...</p>
          </div>
        ) : resetSuccess ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-black text-base text-[#0a2458]">Password Reset Successful!</h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white py-3 px-5 text-sm font-bold shadow transition-all active:scale-[0.98]"
              >
                <span>Go to Login</span>
                <ArrowRight className="h-4 w-4 text-[#f97316]" />
              </Link>
            </div>
          </div>
        ) : token && !verifiedMode ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 text-center space-y-3">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-rose-100 text-rose-600 mx-auto">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-rose-900">Reset Link Invalid</h3>
              <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0a2458] text-white px-5 py-2.5 text-xs font-bold shadow hover:bg-[#06183d] transition-all"
              >
                <span>Return to Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : !verifiedMode ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered email address and the 6-digit password reset OTP sent to your inbox:
            </p>
            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email *</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Reset OTP *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base font-mono tracking-widest text-center text-[#0a2458] font-bold focus:border-[#1652b8] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={verifyingOtp || otpCode.length !== 6 || !userEmail.includes("@")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] disabled:opacity-50 text-white py-3 text-sm font-bold shadow transition-all"
            >
              <ShieldCheck className="h-4 w-4 text-[#f97316]" />
              <span>{verifyingOtp ? "Verifying OTP..." : "Verify 6-Digit OTP"}</span>
            </button>
            <div className="text-center pt-2">
              <Link href="/login" className="text-xs font-bold text-[#1652b8] hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {userEmail && (
              <div className="rounded-xl bg-blue-50/70 border border-blue-200 px-3.5 py-2 text-xs text-[#0a2458] font-semibold flex items-center justify-between">
                <span>Account:</span>
                <strong className="truncate max-w-[200px]">{userEmail}</strong>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm font-semibold tracking-wide focus:border-[#1652b8] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm font-semibold tracking-wide focus:border-[#1652b8] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {password && confirmPassword && (
              <p
                className={`text-xs font-semibold ${
                  password === confirmPassword ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || password.length < 6 || password !== confirmPassword}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white py-3 text-sm font-bold shadow transition-all active:scale-[0.99]"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{submitting ? "Updating Password..." : "Reset Password"}</span>
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs font-bold text-[#1652b8] hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
