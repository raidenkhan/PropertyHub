"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeroSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 py-6 px-4 md:py-8 md:px-6 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col items-start gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 md:h-10 w-48 md:w-72 bg-white/30" />
            <Skeleton className="h-4 md:h-6 w-64 md:w-[32rem] bg-white/20" />
          </div>
          <Skeleton className="h-9 w-40 bg-white/40" />
        </div>
      </div>
    </div>
  );
}

export function StatsGridSkeleton({ count = 4, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6'} mb-6 md:mb-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border-0 shadow-lg p-3 md:p-6 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 md:h-8 w-12" />
            </div>
            <Skeleton className="h-5 w-5 md:h-8 md:w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuickActionsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-0 shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 md:p-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PropertiesGridSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="">
      {/* Mobile list */}
      <div className="block md:hidden space-y-3">
        {Array.from({ length: Math.min(items, 4) }).map((_, i) => (
          <div key={i} className="overflow-hidden border-0 shadow-md bg-card/30 backdrop-blur-sm rounded-lg">
            <div className="flex items-stretch">
              <Skeleton className="w-24 h-24 rounded-none" />
              <div className="flex-1 p-3 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop grid */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border shadow-sm overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-40" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
