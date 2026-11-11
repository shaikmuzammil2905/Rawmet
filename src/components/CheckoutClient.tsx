"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, CreditCard, Lock, Printer, ShieldCheck } from "lucide-react";
import type { SubscriptionPlanRecord, UserRecord } from "@/lib/types";
import { useToast } from "./ToastProvider";

interface OrderState {
  orderId: string;
  orderToken: string;
  amountInr: number;
  gstAmountInr: number;
  baseAmountInr: number;
}

export function CheckoutClient({
  plan,
  user,
}: {
  plan: SubscriptionPlanRecord;
  user: UserRecord | null;
}) {
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("UPI / QR / Razorpay");
  const [order, setOrder] = useState<OrderState | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: "paid" | "failed" | "pending" | "cancelled";
    message: string;
    invoiceNumber?: string;
    paymentId?: string;
    startsAt?: string;
    endsAt?: string;
  } | null>(null);

  const gstAmount = Math.round(plan.price_inr - plan.price_inr / 1.18);
  const baseAmount = plan.price_inr - gstAmount;

  async function handleCreateOrder() {
    setCreatingOrder(true);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to initiate payment.", "error");
        return;
      }
      setOrder(data);
      setPaymentResult(null);
      showToast("Secure order created. Complete payment verification below.", "info");
    } finally {
      setCreatingOrder(false);
    }
  }

  async function handleVerify(outcome: "paid" | "failed" | "pending" | "cancelled") {
    if (!order) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          orderToken: order.orderToken,
          outcome,
          paymentMethod,
        }),
      });
      const data = await res.json();
      setPaymentResult({
        status: data.status || outcome,
        message: data.message || data.error || "Processed",
        invoiceNumber: data.invoiceNumber,
        paymentId: data.paymentId,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      });
      if (data.status === "paid") {
        showToast(data.message, "success");
      } else {
        showToast(data.message || "Payment not completed", "error");
      }
    } finally {
      setVerifying(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-white border border-slate-200 p-8 text-center shadow-lg">
        <Lock className="h-10 w-10 text-[#f97316] mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold text-[#0a2458]">Login Required to Subscribe</h2>
        <p className="mt-2 text-sm text-slate-600">
          Please login or register your customer/vendor account to link the{" "}
          <strong>{plan.name}</strong> subscription and GST tax invoice to your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/login?next=${encodeURIComponent(`/checkout?planId=${plan.id}`)}`}
            className="rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-sm font-bold"
          >
            Customer Login / OTP
          </Link>
          <Link
            href="/vendor/register"
            className="rounded-full bg-[#f97316] text-white px-6 py-2.5 text-sm font-bold"
          >
            Vendor Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Order Summary */}
      <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <span className="inline-block rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 px-3 py-1 text-xs font-bold">
          {plan.badge_text}
        </span>
        <h2 className="text-2xl font-extrabold text-[#0a2458]">{plan.name}</h2>
        <p className="text-xs text-slate-600">{plan.highlight_text}</p>

        <div className="pt-4 border-t border-slate-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Account Holder</span>
            <span className="font-bold text-[#0a2458]">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Mobile</span>
            <span className="font-semibold">{user.mobile}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total Validity</span>
            <span className="font-bold text-emerald-700">
              {plan.duration_months + plan.bonus_months} Months
              {plan.bonus_months > 0 ? ` (incl. ${plan.bonus_months}M FREE)` : ""}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-600">Base Subscription Amount</span>
            <span>₹{baseAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">GST (18% Included)</span>
            <span>₹{gstAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-slate-200 text-lg font-extrabold text-[#0a2458]">
            <span>Total Payable</span>
            <span className="text-[#f97316]">₹{plan.price_inr.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Payment Gateway & Verification */}
      <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="text-lg font-extrabold text-[#0a2458]">Server-Verified Payment Gateway</h2>
              <p className="text-xs text-slate-500">HMAC-SHA256 backend signature verification &amp; duplicate protection</p>
            </div>
          </div>
        </div>

        {paymentResult?.status === "paid" ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-emerald-950">Payment Verified &amp; Subscription Active!</h3>
                <p className="text-sm text-emerald-800 mt-0.5">{paymentResult.message}</p>
              </div>
            </div>

            {/* Printable GST Tax Invoice */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/70 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <p className="font-extrabold text-[#0a2458]">RAWMET.com — Sriñidhi Enterprises</p>
                  <p className="text-xs text-slate-500">GST Tax Invoice / Subscription Receipt</p>
                </div>
                <span className="font-extrabold text-[#f97316]">{paymentResult.invoiceNumber}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Order ID:</span> <strong>{order?.orderId}</strong></div>
                <div><span className="text-slate-500">Payment ID:</span> <strong>{paymentResult.paymentId}</strong></div>
                <div><span className="text-slate-500">Subscriber:</span> <strong>{user.name}</strong></div>
                <div><span className="text-slate-500">Plan:</span> <strong>{plan.name}</strong></div>
                <div><span className="text-slate-500">Amount Paid (incl. 18% GST):</span> <strong>₹{plan.price_inr.toLocaleString("en-IN")}</strong></div>
                <div><span className="text-slate-500">Status:</span> <strong className="text-emerald-700">PAID &amp; VERIFIED</strong></div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-[#0a2458] hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                <span>Print GST Invoice</span>
              </button>
              <Link
                href={user.role === "vendor" ? "/vendor/dashboard" : "/dashboard"}
                className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-sm font-bold"
              >
                Go to My Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {paymentResult && (
              <div
                className={`rounded-2xl border p-4 flex items-start gap-3 text-sm ${
                  paymentResult.status === "pending"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                {paymentResult.status === "pending" ? (
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold uppercase text-xs">{paymentResult.status} Payment State</p>
                  <p className="mt-0.5">{paymentResult.message}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {["UPI / QR / Razorpay", "Corporate Card", "NetBanking / NEFT"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${
                      paymentMethod === m
                        ? "border-[#0a2458] bg-blue-50 text-[#0a2458]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {!order ? (
              <button
                type="button"
                disabled={creatingOrder}
                onClick={handleCreateOrder}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3.5 px-6 text-sm font-bold shadow transition-all"
              >
                <CreditCard className="h-4 w-4" />
                <span>
                  {creatingOrder
                    ? "Creating Secure Order..."
                    : `Proceed to Pay ₹${plan.price_inr.toLocaleString("en-IN")}`}
                </span>
              </button>
            ) : (
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0a2458]">Gateway Checkout Session Ready</span>
                  <span className="font-mono text-slate-600">{order.orderId}</span>
                </div>
                <p className="text-xs text-slate-600">
                  Complete payment authorization. Backend cryptographic HMAC verification validates every status before activation:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={() => handleVerify("paid")}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 text-sm font-bold shadow"
                  >
                    {verifying ? "Verifying..." : "Authorize & Pay ₹" + plan.price_inr.toLocaleString("en-IN")}
                  </button>
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={() => handleVerify("pending")}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 text-xs font-bold"
                  >
                    Simulate Pending UPI
                  </button>
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={() => handleVerify("failed")}
                    className="rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-700 py-2.5 px-4 text-xs font-bold"
                  >
                    Simulate Failed Payment
                  </button>
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={() => handleVerify("cancelled")}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-4 text-xs font-bold"
                  >
                    Cancel Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

