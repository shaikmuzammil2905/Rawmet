import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCmsMap } from "@/lib/data";
import { syncDbFromS3 } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rawmet.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RAWMAT MART | Online Real-time Industrial B2B Business Portal",
    template: "%s | RAWMAT MART",
  },
  description:
    "India's trusted multi-vendor B2B industrial marketplace by Sirrinidhi Enterprises for Rubber, Plastic, Metals, Bio Petro Chemical products, industry, turnkey plants, and business services.",
  keywords: [
    "RAWMAT MART",
    "RAWMAT",
    "Sirrinidhi Enterprises",
    "B2B industrial marketplace India",
    "rubber raw materials",
    "plastic granules HDPE PP",
    "stainless steel pipes metals",
    "bio petro chemical",
    "industry",
    "real-time business portal",
  ],
  openGraph: {
    type: "website",
    siteName: "RAWMAT MART",
    title: "RAWMAT MART — Your Trusted Platform for Industrial Business Solutions",
    description:
      "Products | Industry | Services — Connect with GST-verified industrial vendors and real-time business opportunities.",
    images: [{ url: "/images/hero-desktop-1.png", width: 2048, height: 768, alt: "RAWMAT MART Industrial Portal" }],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await syncDbFromS3(true);
  const { contactSettings } = getCmsMap();

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RAWMAT MART — Sirrinidhi Enterprises",
    url: siteUrl,
    logo: `${siteUrl}/images/rawmet-logo.png`,
    telephone: contactSettings.mobile,
    email: contactSettings.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressCountry: "IN",
    },
  };

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased bg-[#f6f8fc] text-slate-900 w-full max-w-full overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <ToastProvider>
          <Navbar mobileNumber={contactSettings.mobile} />
          <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
          <Footer
            mobile={contactSettings.mobile}
            whatsapp={contactSettings.whatsapp}
            email={contactSettings.email}
          />
        </ToastProvider>
      </body>
    </html>
  );
}

