import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { siteConfig } from "@/lib/site-config";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
});

export const runtime = "edge";

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "EngineerPrep India | VTU Resources, DSA & Placement Preparation",
    template: "%s | EngineerPrep India",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "VTU notes",
    "VTU previous year question papers",
    "VTU syllabus 2022 scheme",
    "DSA sheets",
    "Striver A2Z DSA sheet",
    "Love Babbar DSA sheet",
    "NeetCode 150",
    "developer roadmaps",
    "campus placement preparation",
    "engineering jobs India",
    "mock tests",
  ],
  authors: [{ name: "EngineerPrep India" }],
  creator: "EngineerPrep India",
  publisher: "EngineerPrep India",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "EngineerPrep India | VTU Resources, DSA & Placement Preparation",
    description: siteConfig.description,
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "EngineerPrep India — Learn. Practice. Prepare. Get Hired.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EngineerPrep India | VTU Resources, DSA & Placement Preparation",
    description: siteConfig.description,
    images: ["/images/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-surface font-sans text-ink-900 antialiased">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
