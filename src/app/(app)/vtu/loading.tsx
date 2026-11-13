import { CardSkeleton, Skeleton } from "@/components/ui";

export default function VtuLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Filter bar skeleton */}
      <div className="epi-card p-4 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-full sm:w-72" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Resource cards skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardSkeleton count={6} />
      </div>
    </div>
  );
}

