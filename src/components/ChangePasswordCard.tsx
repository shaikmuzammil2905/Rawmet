"use client";

import React, { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "./ToastProvider";

export function ChangePasswordCard() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update password.", "error");
        return;
      }
      showToast(data.message || "Your password has been updated successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Network error updating password.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#0a2458] flex items-center justify-center">
            <KeyRound className="h-4 w-4 text-[#f97316]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#0a2458]">Account Security & Change Password</h3>
            <p className="text-[11px] text-slate-500">Update your common Buyer & Seller login password</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPasswords((p) => !p)}
          className="text-xs font-bold text-slate-500 hover:text-[#0a2458] flex items-center gap-1"
        >
          {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span>{showPasswords ? "Hide" : "Show"}</span>
        </button>
      </div>

      <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Password *</label>
          <div className="relative">
            <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPasswords ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs focus:border-[#0a2458] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">New Password (min 6) *</label>
          <input
            type={showPasswords ? "text" : "password"}
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0a2458] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirm New Password *</label>
          <input
            type={showPasswords ? "text" : "password"}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#0a2458] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-3 flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0a2458] hover:bg-[#1652b8] disabled:opacity-50 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#f97316]" />
            <span>{saving ? "Updating..." : "Update Password"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
