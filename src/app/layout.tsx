import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCmsMap } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rawmet.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RAWMET.com | Online Real-time Industrial B2B Business Portal",
    template: "%s | RAWMET.com",
  },
  description:
    "India's trusted multi-vendor B2B industrial marketplace by Sriñidhi Enterprises for Rubber, Plastic, Metals, Bio Petro Chemical products, industrial machineries, turnkey plants, and business services.",
  keywords: [
    "RAWMET",
    "Sriñidhi Enterprises",
    "B2B industrial marketplace India",
    "rubber raw materials",
    "plastic granules HDPE PP",
    "stainless steel pipes metals",
    "bio petro chemical",
    "industrial machineries",
    "real-time business portal",
  ],
  openGraph: {
    type: "website",
    siteName: "RAWMET.com",
    title: "RAWMET.com — Your Trusted Platform for Industrial Business Solutions",
    description:
      "Products | Machineries | Services — Connect with GST-verified industrial vendors and real-time business opportunities.",
    images: [{ url: "/images/hero-desktop-1.png", width: 2048, height: 768, alt: "RAWMET Industrial Portal" }],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { contactSettings } = getCmsMap();

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RAWMET.com — Sriñidhi Enterprises",
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
      <body className="min-h-screen flex flex-col antialiased bg-[#f6f8fc] text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <ToastProvider>
          <Navbar mobileNumber={contactSettings.mobile} />
          <main className="flex-1">{children}</main>
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

