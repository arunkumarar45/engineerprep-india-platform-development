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
 * EngineerPrep India — Original Brand Icon (Monogram 'E' & 'P' Chevron Matrix)
 * Represents engineering architecture, technical rigor, and upward career trajectory.
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
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Core Vibrant Gradient */}
        <linearGradient
          id="epi-brand-grad"
          x1="6"
          y1="42"
          x2="42"
          y2="6"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#E04800" />
          <stop offset="55%" stopColor="#FF5A00" />
          <stop offset="100%" stopColor="#FF7A1A" />
        </linearGradient>

        {/* Technical Indigo/Sapphire Accent */}
        <linearGradient
          id="epi-tech-accent"
          x1="8"
          y1="8"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Ambient Glow */}
        <filter id="epi-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3"
            floodColor="#FF5A00"
            floodOpacity="0.32"
          />
        </filter>
      </defs>

      {/* Hexagonal Base Container */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#epi-brand-grad)"
        filter="url(#epi-glow)"
      />

      {/* Geometric Vector Architecture: Monogram E + P with Ascending Path */}
      {/* 1. Left Vertical Stem (Engineering Spine) */}
      <path
        d="M12 11C12 9.89543 12.8954 9 14 9H21C22.1046 9 23 9.89543 23 11V37C23 38.1046 22.1046 39 21 39H14C12.8954 39 12 38.1046 12 37V11Z"
        fill="#FFFFFF"
      />

      {/* 2. Horizontal Tech Nodes of 'E' */}
      {/* Top Bar connecting into 'P' loop */}
      <path
        d="M21 9H31C35.4183 9 39 12.5817 39 17C39 21.4183 35.4183 25 31 25H21V19H30C31.1046 19 32 18.1046 32 17C32 15.8954 31.1046 15 30 15H21V9Z"
        fill="#FFFFFF"
      />

      {/* Mid Node of 'E' */}
      <path
        d="M21 21.5H27C27.8284 21.5 28.5 22.1716 28.5 23C28.5 23.8284 27.8284 24.5 27 24.5H21V21.5Z"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />

      {/* Bottom Foundation Bar of 'E' */}
      <path
        d="M21 33H33C34.1046 33 35 33.8954 35 35C35 36.1046 34.1046 37 33 37H21V33Z"
        fill="#FFFFFF"
      />

      {/* 3. Upward Career Trajectory / Ascending Apex Accent inside 'P' */}
      <circle cx="30.5" cy="17" r="3" fill="url(#epi-brand-grad)" />

      {/* 4. Dynamic Forward Tech Pointer (Arrow/Progress Notch) */}
      <path
        d="M32 29L37.5 34.5L35 37L29.5 31.5L32 29Z"
        fill="#FFE8D6"
        fillOpacity="0.9"
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
        "group inline-flex items-center gap-2.5 transition-opacity hover:opacity-95 focus:outline-none",
        className,
      )}
    >
      <BrandIcon size={38} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="flex items-center gap-1">
            <span
              className={cn(
                "text-[1.05rem] font-black tracking-tight font-heading",
                tone === "dark" ? "text-white" : "text-ink-950",
              )}
            >
              EngineerPrep
            </span>
            <span className="text-[1.05rem] font-black tracking-tight text-brand-500">
              India
            </span>
          </span>
          <span
            className={cn(
              "mt-1 text-[0.62rem] font-bold uppercase tracking-[0.14em]",
              tone === "dark" ? "text-slate-400" : "text-ink-500",
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
