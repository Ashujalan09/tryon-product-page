import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";

import "./globals.css";

import { BagProvider } from "@/components/site/bag-provider";
import { FeedbackProvider } from "@/components/site/feedback-provider";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Racer back mini dress — Lorem Ipsum",
    template: "%s | Lorem Ipsum",
  },
  description:
    "A minimalist A-line mini dress with a deeply scooped racerback, in a satin-matte black. Try it on with your own photo.",
  openGraph: {
    description:
      "A minimalist A-line mini dress with a deeply scooped racerback, in a satin-matte black. Try it on with your own photo.",
    images: [{ url: "/images/product/dress-front.jpeg", width: 1066, height: 1600 }],
    title: "Racer back mini dress — Lorem Ipsum",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${dmSans.variable} flex min-h-dvh flex-col font-sans antialiased`}>
        <a
          className="type-control sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-(--z-skip) focus:flex focus:h-9 focus:items-center focus:border focus:border-ink focus:bg-paper focus:px-5 focus:text-ink"
          href="#main-content"
        >
          Skip to content
        </a>
        <FeedbackProvider>
          <BagProvider>
            <SiteHeader />
            <main className="min-w-0 flex-1" id="main-content">
              {children}
            </main>
            <SiteFooter />
          </BagProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
