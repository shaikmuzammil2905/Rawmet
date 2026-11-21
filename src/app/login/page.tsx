import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginClient } from "@/components/LoginClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Login | RAWMAT MART",
  description: "Sign in with your registered email and password to access your RAWMAT MART account.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="h-9 w-9 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#0a2458]">Loading Login...</p>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
