"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function RoadmapFilters({
  options,
  active,
}: {
  options: string[];
  active: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const current = search.get("category") ?? active;

  return (
    <div className="epi-scroll-x flex gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => {
            const params = new URLSearchParams(search.toString());
            if (option === "All") params.delete("category");
            else params.set("category", option);
            router.push(`/placements/roadmaps?${params.toString()}`);
          }}
          className={cn(
            "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
            current === option
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-line bg-white text-ink-700 hover:border-brand-300 hover:text-brand-600",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
