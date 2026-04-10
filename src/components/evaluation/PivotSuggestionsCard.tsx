"use client";

import { GitBranch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PivotPlan, PivotType } from "@/lib/types/pivot";

interface PivotSuggestionsCardProps {
  pivotPlan: PivotPlan | null;
  pivotAt: Date | string | null;
  generating: boolean;
  onGenerate: () => void;
}

const PIVOT_TYPE_CONFIG: Record<PivotType, { label: string; color: string; bg: string }> = {
  "narrow-who":   { label: "Narrow Who",   color: "#4f46e5", bg: "#eef2ff" },
  "adjacent-who": { label: "Adjacent Who", color: "#ea580c", bg: "#fff7ed" },
  "change-how":   { label: "Change How",   color: "#0d9488", bg: "#f0fdfa" },
};

export function PivotSuggestionsCard({
  pivotPlan,
  pivotAt,
  generating,
  onGenerate,
}: PivotSuggestionsCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-sm font-semibold text-zinc-800">Pivot Suggestions</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onGenerate}
          disabled={generating}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Analyzing..." : pivotPlan ? "Regenerate" : "Find Better Who"}
        </Button>
      </div>

      {generating ? (
        <div className="px-4 py-6 space-y-3 animate-pulse">
          <div className="h-3 bg-zinc-100 rounded w-3/4" />
          <div className="h-16 bg-zinc-100 rounded" />
          <div className="h-16 bg-zinc-100 rounded" />
        </div>
      ) : pivotPlan ? (
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs text-zinc-500 italic">{pivotPlan.pivotTrigger}</p>

          <div className="space-y-3">
            {pivotPlan.suggestions.map((s, i) => {
              const cfg = PIVOT_TYPE_CONFIG[s.pivotType] ?? PIVOT_TYPE_CONFIG["narrow-who"];
              return (
                <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 mt-0.5"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <p className="text-xs font-semibold text-zinc-800 leading-snug">{s.newTargetCustomer}</p>
                  </div>
                  <p className="text-xs text-zinc-500">{s.desperationRationale}</p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide shrink-0 mt-0.5">
                      Test
                    </span>
                    <p className="text-xs text-zinc-600">{s.validationShortcut}</p>
                  </div>
                  {s.networkLeverage && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide shrink-0 mt-0.5">
                        Reach
                      </span>
                      <p className="text-xs text-zinc-600">{s.networkLeverage}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-zinc-400 italic">Keep: {pivotPlan.keepWhat}</p>

          {pivotAt && (
            <p className="text-[10px] text-zinc-400 text-right">
              Generated{" "}
              {new Date(pivotAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="px-4 py-5 text-center space-y-1">
          <p className="text-xs text-zinc-500">
            Not sure if you&apos;re targeting the right customer?
          </p>
          <p className="text-[11px] text-zinc-400">
            Click &ldquo;Find Better Who&rdquo; to get pivot suggestions based on desperation signals.
          </p>
        </div>
      )}
    </div>
  );
}
