import type { Metadata } from "next";
import { getCategories, getRequirements } from "@/lib/data";
import { RequirementsClient } from "@/components/RequirementsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Real-Time Business Opportunities & Requirements",
  description:
    "Find live industrial business requirements or post your requirement on RAWMET.com to trigger automatic WhatsApp alerts to verified vendors.",
};

export default function RequirementsPage() {
  const requirements = getRequirements({ limit: 40 });
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] via-[#123983] to-[#0a2458] p-6 sm:p-8 text-white shadow-lg mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
          RAWMET.com Real-Time Business Portal
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">Real-Time Business Opportunities</h1>
        <p className="mt-1 text-sm text-blue-100">
          Find Requirements • Post Requirements • Connect with Verified Businesses via Instant WhatsApp Workflow
        </p>
      </div>

      <RequirementsClient initialRequirements={requirements} categories={categories} />
    </div>
  );
}

