"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, GraduationCap, X } from "lucide-react";
import { SIDEBARS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar({
  section,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  section: string;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const config = SIDEBARS[section] ?? SIDEBARS.dashboard;

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        data-testid="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-navy-900 text-white transition-all duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64",
          open ? "w-72 translate-x-0" : "-translate-x-full",
        )}
        aria-label={`${config.label} navigation`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-[0_6px_16px_rgba(255,90,0,0.35)]">
            <GraduationCap className="size-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold leading-tight">
                EngineerPrep
              </p>
              <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wider text-brand-400">
                India
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="ml-auto grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="ml-auto hidden size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white lg:grid"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft
              className={cn(
                "size-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4 scroll-thin">
          <p
            className={cn(
              "px-2 pb-2 text-[0.65rem] font-bold uppercase tracking-wider text-white/35",
              collapsed && "sr-only",
            )}
          >
            {config.label}
          </p>
          <ul className="space-y-0.5">
            {config.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" &&
                  item.href.split("?")[0] !== "/jobs" &&
                  pathname.startsWith(item.href.split("?")[0]) &&
                  item.href.split("?")[0] !== "/vtu" &&
                  item.href.split("?")[0] !== "/jobs");
              const Icon = item.icon;
              return (
                <li key={`${item.label}-${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-medium transition-colors",
                      isActive
                        ? "bg-brand-500 text-white shadow-[0_6px_16px_rgba(255,90,0,0.28)]"
                        : "text-white/70 hover:bg-white/8 hover:text-white",
                      collapsed && "lg:justify-center lg:px-0",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0" aria-hidden />
                    <span className={cn("truncate", collapsed && "lg:hidden")}>
                      {item.label}
                    </span>
                    {item.badge && !collapsed && (
                      <span className="ml-auto rounded-full bg-white/15 px-1.5 py-0.5 text-[0.6rem] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[0.7rem] font-bold text-white">Daily VTU Updates</p>
            <p className="mt-1 text-[0.65rem] leading-relaxed text-white/55">
              Notes, question papers, results and circulars — refreshed daily.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
