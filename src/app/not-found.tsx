import Link from "next/link";
import { ArrowLeft, BookOpen, Compass, FileText, Home, Search, Sparkles } from "lucide-react";
import { Brandmark } from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top Simple Header */}
      <header className="border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Brandmark />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-600"
          >
            <ArrowLeft className="size-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl text-center">
          {/* Big 404 Indicator */}
          <div className="relative mx-auto mb-6 inline-block">
            <span className="text-[6rem] font-black tracking-tighter text-brand-500/15 sm:text-[8rem]">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-brand-500 text-white shadow-[0_10px_24px_rgba(255,90,0,0.35)]">
                <Compass className="size-8" />
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            Oops! This page couldn&apos;t be found.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink-500 leading-relaxed">
            The page may have moved, or the URL may be incorrect. Explore one of our main preparation sections below.
          </p>

          {/* Action Buttons */}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-600"
            >
              <Home className="size-4" /> Return Home
            </Link>
            <Link
              href="/vtu"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-xs font-bold text-ink-900 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              <BookOpen className="size-4 text-brand-500" /> Browse VTU Notes
            </Link>
            <Link
              href="/placements"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-xs font-bold text-ink-900 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              <Sparkles className="size-4 text-brand-500" /> Placement Guides
            </Link>
          </div>

          {/* Quick Navigation Cards */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3 text-left">
            <Link
              href="/vtu/notes"
              className="group rounded-xl border border-line bg-white p-4 shadow-xs transition-all hover:border-brand-400 hover:shadow-md"
            >
              <span className="text-xs font-bold text-ink-900 group-hover:text-brand-600">
                VTU Subject Notes →
              </span>
              <p className="mt-1 text-[0.7rem] text-ink-500">
                Module-wise study notes for 2022 and 2021 schemes.
              </p>
            </Link>

            <Link
              href="/placements/dsa-sheets"
              className="group rounded-xl border border-line bg-white p-4 shadow-xs transition-all hover:border-brand-400 hover:shadow-md"
            >
              <span className="text-xs font-bold text-ink-900 group-hover:text-brand-600">
                DSA Problem Sheets →
              </span>
              <p className="mt-1 text-[0.7rem] text-ink-500">
                Striver, Love Babbar, and NeetCode problem lists.
              </p>
            </Link>

            <Link
              href="/jobs"
              className="group rounded-xl border border-line bg-white p-4 shadow-xs transition-all hover:border-brand-400 hover:shadow-md"
            >
              <span className="text-xs font-bold text-ink-900 group-hover:text-brand-600">
                Jobs &amp; Internships →
              </span>
              <p className="mt-1 text-[0.7rem] text-ink-500">
                Fresher engineering openings and off-campus drives.
              </p>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="border-t border-line bg-white py-4 text-center text-xs text-ink-400">
        EngineerPrep India · Need help? Contact{" "}
        <a href="mailto:support@engineerprep.in" className="text-brand-600 hover:underline">
          support@engineerprep.in
        </a>
      </footer>
    </div>
  );
}
