"use client";

/**
 * Client-side auth nav button on the public homepage.
 * Reads a lightweight cookie so the page itself stays statically cacheable.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

export function AuthNavButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Check session by calling the lightweight /api/auth/me endpoint
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => setIsLoggedIn(r.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  if (isLoggedIn === null) {
    // Render a placeholder the same size to avoid layout shift
    return <div className="h-8 w-24 animate-pulse rounded-xl bg-brand-100" />;
  }

  if (isLoggedIn) {
    return (
      <Link
        href="/dashboard"
        className="rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-600"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-xs font-bold text-ink-700 transition-colors hover:text-brand-600"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-600"
      >
        Sign Up
      </Link>
    </>
  );
}
