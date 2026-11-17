"use client";

import React, { useState } from "react";
import { CheckCircle2, ClipboardList, Send, X } from "lucide-react";
import { useToast } from "./ToastProvider";

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlanName?: string;
  defaultAmount?: number;
}

export function SubscriptionFormModal({
  isOpen,
  onClose,
  defaultPlanName = "Subscription Form (₹1,500)",
  defaultAmount = 1500,
}: SubscriptionFormModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"seller" | "buyer">("seller");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscription-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          business_name: businessName,
          mobile,
          email,
          user_type: userType,
          plan_name: defaultPlanName,
          amount_inr: defaultAmount,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to submit form.", "error");
        return;
      }

      setSubmitted(true);
      showToast("Subscription form submitted successfully!", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-800 border border-slate-200 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-[#0a2458]">Application Submitted!</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Thank you, <strong>{name}</strong>. Your subscription request for <strong>{defaultPlanName}</strong> has been forwarded to RAWMAT MART administration.
            </p>
            <p className="text-xs text-orange-600 font-semibold bg-orange-50 p-3 rounded-xl border border-orange-200">
              Note: Exact plan validity & promotional features are subject to client terms confirmation upon administrative review.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-8 py-2.5 text-sm font-bold shadow transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#0a2458]">Custom Subscription Form</h3>
                <p className="text-xs text-slate-500">{defaultPlanName} • ₹{defaultAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed bg-blue-50 border border-blue-200 rounded-xl p-3">
              Fill out this application to request custom onboarding or enterprise portal packages. An admin will verify your business and activate the subscription.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#1652b8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">User Role *</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as "seller" | "buyer")}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#1652b8] focus:outline-none"
                  >
                    <option value="seller">Seller / Vendor</option>
                    <option value="buyer">Buyer / Corporate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business / Company Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Bharat Polymers Pvt Ltd"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#1652b8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#1652b8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#1652b8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Requirements / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify any special category requirements, expected listings count, or billing details..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-[#1652b8] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3 text-sm font-bold shadow transition-all flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Subscription Form (₹{defaultAmount.toLocaleString("en-IN")})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
