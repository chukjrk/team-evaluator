"use client";

import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ScoreLoadingState() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Score circle placeholder */}
      <div className="rounded-xl bg-zinc-50 px-5 py-4 text-center space-y-2">
        <Skeleton className="h-3 w-24 mx-auto" />
        <Skeleton className="h-14 w-20 mx-auto rounded-lg" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>

      {/* Score bars */}
      {["Team Skills", "Network", "Idea Quality", "Team–Idea Fit"].map((label) => (
        <div key={label} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-6" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}

      {/* Status message */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-400">
        <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-spin" />
        Asking Claude for evaluation...
      </div>
    </div>
  );
}
