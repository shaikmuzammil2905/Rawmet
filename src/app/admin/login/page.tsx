"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, expectedRole: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Admin authentication failed.", "error");
        return;
      }
      showToast("Authenticated to RAWMET Admin Control Panel.", "success");
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl bg-[#06183d] text-white p-7 sm:p-9 shadow-2xl border border-blue-900">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#f97316] flex items-center justify-center mb-3 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">Admin Portal Authentication</h1>
          <p className="text-xs text-blue-200 mt-1">
            Restricted access for authorized RAWMET.com administrators
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-blue-100 mb-1">Admin Email / Mobile</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@rawmet.com"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-blue-200/50 focus:border-[#f97316] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-100 mb-1">Admin Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-blue-200/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-blue-200/50 focus:border-[#f97316] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 text-sm font-bold shadow transition-all"
          >
            {loading ? "Authenticating..." : "Access Admin Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}

