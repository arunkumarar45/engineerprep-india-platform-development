"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Heart, Home } from "lucide-react";
import { sectionForPath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Navbar, type NotificationItem } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BrandIcon, Brandmark } from "@/components/brand/Logo";
import type { SessionUser } from "@/lib/auth";

/* ------------------------------- Shell ------------------------------ */

export function AppShell({
  user,
  notifications,
  children,
}: {
  user: SessionUser | null;
  notifications: NotificationItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const section = sectionForPath(pathname);

  useEffect(() => {
    const saved = window.localStorage.getItem("epi.sidebar.collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("epi.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar
        user={user}
        notifications={notifications}
        onMenuClick={() => setMobileOpen(true)}
      />
      <div className="mx-auto flex w-full max-w-[100rem] gap-0">
        <Sidebar
          section={section}
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-w-0 flex-1 px-4 py-5 lg:px-7 lg:py-6">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Breadcrumb --------------------------- */

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-[0.72rem] text-ink-500">
        <li className="flex items-center gap-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-semibold hover:text-brand-600"
          >
            <Home className="size-3" /> Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="size-3 text-ink-500/60" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="font-semibold hover:text-brand-600">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-ink-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ----------------------------- Page header -------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.35rem] font-extrabold tracking-tight text-ink-900 lg:text-[1.6rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Footer ----------------------------- */

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line bg-white px-4 py-6 lg:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <BrandIcon size={32} />
          <div>
            <p className="text-[0.8rem] font-bold text-ink-900">
              EngineerPrep India
            </p>
            <p className="text-[0.65rem] text-ink-500">
              Learn. Practice. Prepare. Get Hired.
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.72rem] font-semibold text-ink-500">
          <Link href="/vtu" className="hover:text-brand-600">VTU Notes</Link>
          <Link href="/placements" className="hover:text-brand-600">Placements</Link>
          <Link href="/jobs" className="hover:text-brand-600">Jobs</Link>
          <Link href="/placements/mock-tests" className="hover:text-brand-600">Mock Tests</Link>
          <Link href="/about" className="hover:text-brand-600">About</Link>
          <Link href="/contact" className="hover:text-brand-600">Contact</Link>
          <Link href="/privacy-policy" className="hover:text-brand-600">Privacy</Link>
          <Link href="/terms" className="hover:text-brand-600">Terms</Link>
          <a href="/sitemap.xml" className="hover:text-brand-600">Sitemap</a>
        </nav>
        <p className="flex items-center gap-1 text-[0.68rem] text-ink-500">
          Built with <Heart className="size-3 text-brand-500" /> for engineering
          students across Karnataka · © {new Date().getFullYear()} EngineerPrep India
        </p>
      </div>
    </footer>
  );
}

/* --------------------------- Auth layout ---------------------------- */

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex items-center justify-center bg-white px-5 py-8 sm:px-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <div
          className="absolute inset-0 opacity-95"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 10%, rgba(255,90,0,0.42), transparent 55%), radial-gradient(90% 80% at 90% 90%, rgba(255,122,26,0.28), transparent 60%), linear-gradient(160deg, #111B24 0%, #17212B 60%, #1D2A36 100%)",
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Brandmark tone="dark" />
          <div>
            <h2 className="max-w-md text-3xl font-extrabold leading-tight">
              Everything you need for your engineering journey.
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/70">
              VTU notes, DSA sheets, developer roadmaps, mock tests, jobs and
              internships — with progress tracking that keeps you accountable.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "VTU notes & study materials",
                "500+ curated DSA problems",
                "Verified syllabus & question papers",
                "Jobs & internship listings",
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/12 bg-white/6 px-3.5 py-2.5 text-[0.78rem] font-semibold backdrop-blur"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[0.68rem] text-white/45">
            Your data is secured with encrypted sessions and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
