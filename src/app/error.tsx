"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Brandmark } from "@/components/layout/Navbar";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error telemetry without exposing sensitive internals
    console.error("Application error boundary triggered:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Brandmark />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-500 shadow-xs mb-5">
            <AlertTriangle className="size-8" />
          </span>

          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-xs text-ink-500 leading-relaxed">
            An unexpected error occurred while processing this request. Our engineering team has been notified.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-xs font-bold text-white transition-colors hover:bg-brand-600"
            >
              <RefreshCw className="size-3.5" /> Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-xs font-bold text-ink-900 transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              <Home className="size-3.5" /> Return Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-line bg-white py-4 text-center text-xs text-ink-400">
        EngineerPrep India · Need assistance? Reach us at{" "}
        <a href="mailto:support@engineerprep.in" className="text-brand-600 hover:underline">
          support@engineerprep.in
        </a>
      </footer>
    </div>
  );
}

