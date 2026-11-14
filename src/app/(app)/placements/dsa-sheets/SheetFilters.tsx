"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui";

export function SheetFilters({
  options,
  active,
}: {
  options: Array<{ id: string; label: string }>;
  active: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const current = search.get("difficulty") ?? active;

  return (
    <div className="max-w-full overflow-x-auto scroll-thin">
      <SegmentedControl
        options={options}
        value={current.toUpperCase()}
        onChange={(next) => {
          const params = new URLSearchParams(search.toString());
          if (next === "ALL") params.delete("difficulty");
          else params.set("difficulty", next);
          router.push(`/placements/dsa-sheets?${params.toString()}`);
        }}
      />
    </div>
  );
}
