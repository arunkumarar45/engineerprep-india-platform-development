import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  variant?: "icon" | "horizontal" | "compact" | "stacked";
  tone?: "light" | "dark";
  className?: string;
  iconOnly?: boolean;
  priority?: boolean;
  href?: string | null;
}

/**
 * EngineerPrep India — Brand Icon v2
 * Bold engineering iconmark: circuit-board trace grid forming a sharp "EP" letterform
 * on a deep-navy rounded-square base with a vivid saffron-to-amber gradient pulse.
 * Intentionally high visual weight for strong recognizability at all sizes.
 */
export function BrandIcon({
  size = 36,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Saffron fire gradient — left-bottom to top-right */}
        <linearGradient id="g-fire" x1="4" y1="52" x2="52" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C43A00" />
          <stop offset="40%"  stopColor="#FF5A00" />
          <stop offset="100%" stopColor="#FF8C1A" />
        </linearGradient>

        {/* Warm amber accent for circuit dots */}
        <linearGradient id="g-amber" x1="28" y1="8" x2="28" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FF9640" />
        </linearGradient>

        {/* Strong drop-shadow glow for the icon on light backgrounds */}
        <filter id="f-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF5A00" floodOpacity="0.40" />
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.18" />
        </filter>

        {/* Subtle inner shine */}
        <linearGradient id="g-shine" x1="10" y1="4" x2="46" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* ── Base plate: deep navy rounded square ── */}
      <rect x="2" y="2" width="52" height="52" rx="14" fill="#0F172A" filter="url(#f-glow)" />

      {/* ── Inner shine overlay ── */}
      <rect x="2" y="2" width="52" height="52" rx="14" fill="url(#g-shine)" />

      {/* ══════════════════════════════════════════
          LETTER  E  —  left column + 3 bars
          Column: x=10..17, y=11..45
          Top bar:   y=11..18, x=10..36
          Mid bar:   y=24..31, x=10..30
          Bot bar:   y=38..45, x=10..36
         ══════════════════════════════════════════ */}

      {/* E — vertical spine */}
      <rect x="10" y="11" width="7" height="34" rx="2" fill="url(#g-fire)" />

      {/* E — top bar */}
      <rect x="10" y="11" width="26" height="7" rx="2" fill="url(#g-fire)" />

      {/* E — mid bar (slightly shorter — visual rhythm) */}
      <rect x="10" y="24.5" width="20" height="7" rx="2" fill="url(#g-fire)" />

      {/* E — bottom bar */}
      <rect x="10" y="38" width="26" height="7" rx="2" fill="url(#g-fire)" />

      {/* ══════════════════════════════════════════
          LETTER  P  —  right of E sharing spine space
          Stem: x=30..37, y=11..45
          Bowl: rounded rect arc top-right, y=11..31, x=30..46, r=10
         ══════════════════════════════════════════ */}

      {/* P — vertical stem */}
      <rect x="30" y="11" width="7" height="34" rx="2" fill="#FFFFFF" fillOpacity="0.93" />

      {/* P — bowl (rounded right cap) */}
      <path
        d="M37 11 H43 C47.4183 11 51 14.5817 51 19 C51 23.4183 47.4183 27 43 27 H37 V20 H43 C43.5523 20 44 19.5523 44 19 C44 18.4477 43.5523 18 43 18 H37 V11 Z"
        fill="#FFFFFF"
        fillOpacity="0.93"
      />

      {/* P bowl — accent dot (circuit node) at bowl centre */}
      <circle cx="43" cy="19" r="3.5" fill="url(#g-amber)" />

      {/* ── Circuit trace decorations — tiny terminal dots ── */}
      {/* Top-right corner node */}
      <circle cx="47" cy="10" r="2" fill="url(#g-amber)" fillOpacity="0.70" />
      {/* Bottom-right corner node */}
      <circle cx="47" cy="46" r="2" fill="url(#g-amber)" fillOpacity="0.55" />
      {/* Mid-left node (E mid junction) */}
      <circle cx="10" cy="28" r="2" fill="url(#g-amber)" fillOpacity="0.60" />

      {/* ── Ascending arrow / career trajectory — bottom-right ── */}
      <path
        d="M38 36 L46 36 L46 44 M46 36 L39 43"
        stroke="url(#g-amber)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.80"
      />
    </svg>
  );
}

/**
 * EngineerPrep India — Complete Brandmark Component
 */
export function Brandmark({
  compact = false,
  tone = "light",
  className = "",
  href = "/",
}: {
  compact?: boolean;
  tone?: "light" | "dark";
  className?: string;
  href?: string | null;
}) {
  const content = (
    <div
      className={cn(
        "group inline-flex items-center gap-3 transition-opacity hover:opacity-90 focus:outline-none",
        className,
      )}
    >
      <BrandIcon size={44} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-[1.2rem] font-black tracking-tight font-heading",
                tone === "dark" ? "text-white" : "text-ink-950",
              )}
            >
              EngineerPrep
            </span>
            <span className="text-[1.2rem] font-black tracking-tight text-brand-500">
              India
            </span>
          </span>
          <span
            className={cn(
              "mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.16em]",
              tone === "dark" ? "text-slate-400" : "text-ink-400",
            )}
          >
            Engineering · Placements · Success
          </span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label="EngineerPrep India Home">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Mobile-optimized Header Brandmark (Responsive text scaling)
 */
export function MobileHeaderBrandmark({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="EngineerPrep India Home"
      className={cn("flex min-w-0 items-center gap-2 focus:outline-none", className)}
    >
      <BrandIcon size={34} />
      <span className="hidden min-w-0 leading-tight min-[440px]:block">
        <span className="flex items-center gap-1">
          <span
            className={cn(
              "truncate text-[0.92rem] font-black tracking-tight",
              tone === "dark" ? "text-white" : "text-ink-950",
            )}
          >
            EngineerPrep
          </span>
          <span className="text-[0.92rem] font-black tracking-tight text-brand-500">
            India
          </span>
        </span>
        <span
          className={cn(
            "hidden truncate text-[0.58rem] font-bold uppercase tracking-wider min-[540px]:block",
            tone === "dark" ? "text-slate-400" : "text-ink-500",
          )}
        >
          VTU & Placements
        </span>
      </span>
    </Link>
  );
}
