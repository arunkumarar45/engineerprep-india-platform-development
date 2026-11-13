import { CardSkeleton, Skeleton } from "@/components/ui";

export default function PlacementsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-line pb-3 overflow-x-auto">
        <Skeleton className="h-9 w-28 shrink-0 rounded-lg" />
        <Skeleton className="h-9 w-32 shrink-0 rounded-lg" />
        <Skeleton className="h-9 w-28 shrink-0 rounded-lg" />
        <Skeleton className="h-9 w-36 shrink-0 rounded-lg" />
        <Skeleton className="h-9 w-32 shrink-0 rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardSkeleton count={6} />
      </div>
    </div>
  );
}

