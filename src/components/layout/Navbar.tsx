"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  Code2,
  FileStack,
  LayoutDashboard,
  LogOut,
  Menu,
  Route,
  Search,
  Settings,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import { TOP_NAV } from "@/lib/nav";
import { cn, initials, relativeTime } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { Button, Modal } from "@/components/ui";
import { Brandmark, MobileHeaderBrandmark } from "@/components/brand/Logo";

// Re-export for backward compatibility
export { Brandmark, MobileHeaderBrandmark };

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: Date | string;
  type: string;
};

type SearchHit = {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  href: string;
};

export function Navbar({
  user,
  notifications,
  onMenuClick,
}: {
  user: SessionUser | null;
  notifications: NotificationItem[];
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target))
        setSearchOpen(false);
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(target)) {
        // don't close if search hits clicked
      }
      if (bellRef.current && !bellRef.current.contains(target))
        setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(target))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (mobileSearchVisible && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchVisible]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        setHits(json?.data ?? []);
        setSearchOpen(true);
      } catch {
        /* aborted */
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  async function performLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      /* demo-safe */
    }
    setLoggingOut(false);
    setLogoutOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[100rem] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-line text-ink-700 transition hover:border-brand-300 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-4.5" />
        </button>

        {/* Logo: Compact on mobile, Full on sm+ */}
        <div className="flex shrink-0 items-center">
          <div className="block sm:hidden">
            <MobileHeaderBrandmark />
          </div>
          <div className="hidden sm:block">
            <Brandmark />
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="ml-3 hidden items-center gap-0.5 xl:flex"
          aria-label="Primary"
        >
          {TOP_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-2.5 py-2 text-[0.82rem] font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer on mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Desktop search bar (sm and up) */}
        <div
          ref={searchRef}
          className="relative ml-auto hidden w-full max-w-xs sm:block sm:max-w-sm"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hits.length > 0 && setSearchOpen(true)}
            placeholder="Search notes, DSA, jobs…"
            aria-label="Search EngineerPrep India"
            className="epi-input h-9 w-full rounded-xl pl-9 pr-8 text-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setHits([]);
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
            >
              <X className="size-3.5" />
            </button>
          )}

          {searchOpen && (
            <div className="animate-fade-up absolute left-0 right-0 top-11 z-50 max-h-96 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-lift scroll-thin">
              {hits.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-ink-500">
                  No matches for “{query}”.
                </p>
              ) : (
                hits.map((hit) => (
                  <Link
                    key={`${hit.kind}-${hit.id}`}
                    href={hit.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2 transition hover:bg-brand-50"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-500">
                      {hit.kind === "Resource" && <FileStack className="size-3.5" />}
                      {hit.kind === "DSA Problem" && <Code2 className="size-3.5" />}
                      {hit.kind === "Opportunity" && <Briefcase className="size-3.5" />}
                      {hit.kind === "Roadmap" && <Route className="size-3.5" />}
                      {hit.kind === "Mock Test" && <LayoutDashboard className="size-3.5" />}
                      {hit.kind === "Subject" && <BookOpen className="size-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {hit.title}
                      </span>
                      <span className="block truncate text-[0.7rem] text-ink-500">
                        {hit.kind} · {hit.subtitle}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Mobile Search Toggle Button */}
        <button
          onClick={() => setMobileSearchVisible((v) => !v)}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl border border-line text-ink-700 transition hover:border-brand-300 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:hidden",
            mobileSearchVisible && "border-brand-500 bg-brand-50 text-brand-600",
          )}
          aria-label={mobileSearchVisible ? "Close search bar" : "Open search bar"}
        >
          {mobileSearchVisible ? <X className="size-4" /> : <Search className="size-4" />}
        </button>

        {/* Notifications */}
        <div ref={bellRef} className="relative shrink-0">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative grid size-9 place-items-center rounded-xl border border-line text-ink-700 transition hover:border-brand-300 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label={`Notifications (${unread} unread)`}
          >
            {unread > 0 ? (
              <BellRing className="size-4.5 text-brand-500" />
            ) : (
              <Bell className="size-4.5" />
            )}
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[0.6rem] font-bold text-white shadow-sm">
                {unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="animate-fade-up absolute -right-8 top-11 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-white shadow-lift sm:right-0">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-bold text-ink-900">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={async () => {
                      await fetch("/api/v1/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "read-all" }),
                      });
                      setBellOpen(false);
                      router.refresh();
                    }}
                    className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-brand-600 hover:underline"
                  >
                    <Check className="size-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scroll-thin">
                {notifications.length === 0 && (
                  <p className="px-4 py-8 text-center text-xs text-ink-500">
                    You are all caught up.
                  </p>
                )}
                {notifications.slice(0, 12).map((n) => (
                  <Link
                    key={n.id}
                    href={n.linkUrl ?? "/dashboard"}
                    onClick={() => setBellOpen(false)}
                    className={cn(
                      "block border-b border-line px-4 py-3 last:border-0 hover:bg-brand-50/60",
                      !n.isRead && "bg-brand-50/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[0.8rem] font-semibold text-ink-900">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-ink-500">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 text-[0.65rem] text-ink-500">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative shrink-0">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-line p-1 transition hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:gap-2 sm:py-1 sm:pl-1 sm:pr-2.5"
            aria-label="Open profile menu"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-navy-900 text-[0.7rem] font-bold text-white">
              {user ? initials(user.fullName) : "IN"}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[8rem] truncate text-[0.75rem] font-bold text-ink-900">
                {user?.fullName ?? "Guest"}
              </span>
              <span className="block text-[0.6rem] font-semibold uppercase tracking-wide text-ink-500">
                {user?.role === "ADMIN" ? "Administrator" : "Student"}
              </span>
            </span>
            <ChevronDown className="hidden size-3 text-ink-500 sm:block" />
          </button>

          {profileOpen && (
            <div className="animate-fade-up absolute right-0 top-11 z-50 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-white p-1.5 shadow-lift">
              {user ? (
                <>
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-ink-900">
                      {user.fullName}
                    </p>
                    <p className="truncate text-[0.7rem] text-ink-500">
                      {user.email}
                    </p>
                  </div>
                  <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <MenuLink href="/my-progress" icon={UserIcon} label="My Progress" />
                  <MenuLink href="/profile" icon={UserIcon} label="Profile" />
                  <MenuLink href="/settings" icon={Settings} label="Settings" />
                  {user.role === "ADMIN" && (
                    <MenuLink href="/admin" icon={Shield} label="Admin Console" />
                  )}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setLogoutOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[0.8rem] font-semibold text-error-500 hover:bg-error-500/10 focus:outline-none"
                  >
                    <LogOut className="size-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <MenuLink href="/login" icon={UserIcon} label="Login" />
                  <MenuLink href="/register" icon={Shield} label="Create account" />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Bar Overlay */}
      {mobileSearchVisible && (
        <div
          ref={mobileSearchRef}
          className="animate-fade-down border-t border-line bg-white px-3 py-2.5 sm:hidden"
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden="true"
            />
            <input
              ref={mobileInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, DSA, jobs…"
              aria-label="Search EngineerPrep India"
              className="epi-input h-10 w-full rounded-xl pl-9 pr-8 text-sm"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setHits([]);
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {query.trim().length >= 2 && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 scroll-thin">
              {hits.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-ink-500">
                  No matches for “{query}”.
                </p>
              ) : (
                hits.map((hit) => (
                  <Link
                    key={`mob-${hit.kind}-${hit.id}`}
                    href={hit.href}
                    onClick={() => {
                      setMobileSearchVisible(false);
                      setQuery("");
                    }}
                    className="flex items-start gap-2.5 rounded-lg bg-white px-3 py-2.5 mb-1 last:mb-0 hover:bg-brand-50"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-500">
                      {hit.kind === "Resource" && <FileStack className="size-3.5" />}
                      {hit.kind === "DSA Problem" && <Code2 className="size-3.5" />}
                      {hit.kind === "Opportunity" && <Briefcase className="size-3.5" />}
                      {hit.kind === "Roadmap" && <Route className="size-3.5" />}
                      {hit.kind === "Mock Test" && <LayoutDashboard className="size-3.5" />}
                      {hit.kind === "Subject" && <BookOpen className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {hit.title}
                      </span>
                      <span className="block truncate text-[0.7rem] text-ink-500">
                        {hit.kind} · {hit.subtitle}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Confirm logout"
        description="You will need to log in again to access your dashboard."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={loggingOut} onClick={performLogout}>
              Logout
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">
          Your progress, notes and activity will be saved. You can log back in
          at any time to continue where you left off.
        </p>
      </Modal>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof UserIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[2.5rem] items-center gap-2.5 rounded-xl px-3 py-2 text-[0.82rem] font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <Icon className="size-4" /> {label}
    </Link>
  );
}
