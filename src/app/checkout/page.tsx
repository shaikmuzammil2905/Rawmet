import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentSession, getSubscriptionPlans } from "@/lib/data";
import { CheckoutClient } from "@/components/CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription Checkout",
  description: "Complete your RAWMET.com subscription payment with GST invoice.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const { planId } = await searchParams;
  const plans = getSubscriptionPlans();
  const plan = plans.find((p) => p.id === Number(planId)) || plans[plans.length - 1];
  if (!plan) notFound();

  const session = await getCurrentSession();

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2458] mb-6">
        Complete Your RAWMET Subscription
      </h1>
      <CheckoutClient plan={plan} user={session?.user || null} />
    </div>
  );
}

