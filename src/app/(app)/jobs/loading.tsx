import { CardSkeleton, Skeleton } from "@/components/ui";

export default function JobsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Filter and Search bar skeleton */}
      <div className="epi-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <Skeleton className="h-10 w-full sm:w-80" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Job list / cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="epi-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3.5 w-60" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-9 w-28 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

