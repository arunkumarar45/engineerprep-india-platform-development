import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";

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

export const metadata: Metadata = {
  title: {
    default: "EngineerPrep India — Learn. Practice. Prepare. Get Hired.",
    template: "%s · EngineerPrep India",
  },
  description:
    "VTU notes, placement preparation, DSA sheets, developer roadmaps, mock tests, jobs and internships — all in one platform for engineering students.",
  keywords: [
    "VTU notes",
    "placement preparation",
    "DSA sheets",
    "engineering jobs",
    "mock tests",
    "developer roadmaps",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-surface font-sans text-ink-900 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
