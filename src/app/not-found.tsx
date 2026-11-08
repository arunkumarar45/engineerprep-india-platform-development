import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Brandmark } from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-5">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <Brandmark />
        </div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <Compass className="size-8" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-500">
          The page you are looking for doesn&apos;t exist or has been moved. Try
          one of the shortcuts below.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
          >
            <Home className="size-4" /> Go home
          </Link>
          <Link
            href="/placements"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
          >
            <Search className="size-4" /> Explore placements
          </Link>
        </div>
        <div className="mt-8 grid gap-2 sm:grid-cols-3">
          {[
            { label: "VTU Notes", href: "/vtu" },
            { label: "DSA Sheets", href: "/placements/dsa-sheets" },
            { label: "Jobs", href: "/jobs" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-line bg-white px-3 py-2.5 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
