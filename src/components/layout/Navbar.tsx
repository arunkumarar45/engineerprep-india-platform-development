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
  GraduationCap,
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

export function Brandmark({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-[0_6px_16px_rgba(255,90,0,0.35)]">
        <GraduationCap className="size-5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span
            className={cn(
              "block text-[0.95rem] font-extrabold tracking-tight",
              tone === "dark" ? "text-white" : "text-ink-900",
            )}
          >
            EngineerPrep India
          </span>
          <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-brand-500">
            Learn. Practice. Prepare. Get Hired.
          </span>
        </span>
      )}
    </Link>
  );
}

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
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target))
        setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(target))
        setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(target))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[100rem] items-center gap-3 px-4 lg:px-6">
        <button
          onClick={onMenuClick}
          className="grid size-9 place-items-center rounded-lg border border-line text-ink-700 hover:border-brand-300 hover:text-brand-600 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-4.5" />
        </button>

        <Brandmark />

        <nav
          className="ml-4 hidden items-center gap-0.5 xl:flex"
          aria-label="Primary"
        >
          {TOP_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-2.5 py-2 text-[0.8rem] font-semibold text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Global search */}
        <div ref={searchRef} className="relative ml-auto w-full max-w-xs sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hits.length > 0 && setSearchOpen(true)}
            placeholder="Search notes, DSA, jobs…"
            aria-label="Search EngineerPrep India"
            className="epi-input h-9 pl-9 pr-8"
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
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2 hover:bg-brand-50"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-500">
                      {hit.kind === "Resource" && <FileStack className="size-3.5" />}
                      {hit.kind === "DSA Problem" && <Code2 className="size-3.5" />}
                      {hit.kind === "Opportunity" && (
                        <Briefcase className="size-3.5" />
                      )}
                      {hit.kind === "Roadmap" && <Route className="size-3.5" />}
                      {hit.kind === "Mock Test" && (
                        <LayoutDashboard className="size-3.5" />
                      )}
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

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative grid size-9 place-items-center rounded-lg border border-line text-ink-700 hover:border-brand-300 hover:text-brand-600"
            aria-label={`Notifications (${unread} unread)`}
          >
            {unread > 0 ? (
              <BellRing className="size-4.5 text-brand-500" />
            ) : (
              <Bell className="size-4.5" />
            )}
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[0.6rem] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="animate-fade-up absolute right-0 top-11 z-50 w-80 rounded-xl border border-line bg-white shadow-lift">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-bold">Notifications</p>
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
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-line py-1 pl-1 pr-2 hover:border-brand-300"
            aria-label="Open profile menu"
          >
            <span className="grid size-7 place-items-center rounded-md bg-navy-900 text-[0.7rem] font-bold text-white">
              {user ? initials(user.fullName) : "IN"}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[0.75rem] font-bold text-ink-900">
                {user?.fullName ?? "Guest"}
              </span>
              <span className="block text-[0.6rem] font-semibold uppercase tracking-wide text-ink-500">
                {user?.role === "ADMIN" ? "Administrator" : "Student"}
              </span>
            </span>
            <ChevronDown className="size-3.5 text-ink-500" />
          </button>
          {profileOpen && (
            <div className="animate-fade-up absolute right-0 top-11 z-50 w-60 rounded-xl border border-line bg-white p-1.5 shadow-lift">
              {user ? (
                <>
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="text-sm font-bold">{user.fullName}</p>
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
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.8rem] font-semibold text-error-500 hover:bg-error-500/10"
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
          Your demo progress stays saved on this device and in the demo database.
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
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8rem] font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-600"
    >
      <Icon className="size-4" /> {label}
    </Link>
  );
}
