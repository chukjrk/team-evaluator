"use client";

import { Lock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { INDUSTRY_LABELS } from "@/lib/constants/industries";
import { cn, formatScore, scoreBgColor } from "@/lib/utils";
import type { IdeaData } from "@/lib/types/idea";
import type { IndustryKey } from "@/lib/constants/industries";

interface IdeaCardProps {
  idea: IdeaData;
  isSelected: boolean;
  onSelect: () => void;
}

export function IdeaCard({ idea, isSelected, onSelect }: IdeaCardProps) {
  const score = idea.score?.compositeScore;
  const hasScore = score !== undefined && score !== null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left transition-colors hover:bg-zinc-50",
        isSelected
          ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
          : "border-zinc-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            {idea.visibility === "PRIVATE" ? (
              <Lock className="h-3 w-3 shrink-0 text-zinc-400" />
            ) : (
              <Globe className="h-3 w-3 shrink-0 text-zinc-400" />
            )}
            <p className="truncate text-sm font-medium text-zinc-900">
              {idea.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{idea.submitter.name}</span>
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              {INDUSTRY_LABELS[idea.industry as IndustryKey] ?? idea.industry}
            </Badge>
          </div>
        </div>

        {/* Score circle */}
        <div className="shrink-0 flex flex-col items-center">
          {hasScore ? (
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
              <div
                className={cn(
                  "absolute inset-0 rounded-full border-2",
                  score >= 75
                    ? "border-green-500"
                    : score >= 50
                    ? "border-yellow-500"
                    : "border-red-400"
                )}
              />
              <span className="text-xs font-bold text-zinc-800">
                {formatScore(score)}
              </span>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-zinc-300">
              <span className="text-[10px] text-zinc-400">—</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
