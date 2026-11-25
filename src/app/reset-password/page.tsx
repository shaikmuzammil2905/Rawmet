import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordClient } from "@/components/ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your RAWMAT MART account password securely.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-xs font-semibold text-slate-500">
          Loading password reset portal...
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
