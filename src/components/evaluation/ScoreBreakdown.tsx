"use client";

import { Progress } from "@/components/ui/progress";
import { cn, formatScore } from "@/lib/utils";

interface ScoreRow {
  label: string;
  score: number;
  description?: string;
}

interface ScoreBreakdownProps {
  teamSkillScore: number;
  networkScore: number;
  ideaQualityScore: number;
  teamIdeaFitScore: number;
  compositeScore: number;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-500";
}

export function ScoreBreakdown({
  teamSkillScore,
  networkScore,
  ideaQualityScore,
  teamIdeaFitScore,
  compositeScore,
}: ScoreBreakdownProps) {
  const rows: ScoreRow[] = [
    { label: "Team Skills", score: teamSkillScore, description: "Coverage & complementarity across cofounders" },
    { label: "Network", score: networkScore, description: "Reach & relevance to idea's target market" },
    { label: "Idea Quality", score: ideaQualityScore, description: "Problem clarity, market opportunity, competition" },
    { label: "Team–Idea Fit", score: teamIdeaFitScore, description: "How well skills match what this idea needs" },
  ];

  return (
    <div className="space-y-4">
      {/* Composite score */}
      <div className="rounded-xl bg-zinc-50 px-5 py-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Overall Score
        </p>
        <p className={cn("mt-1 text-5xl font-bold", scoreColor(compositeScore))}>
          {formatScore(compositeScore)}
        </p>
        <p className="text-xs text-zinc-400">out of 100</p>
      </div>

      {/* Component rows */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-700">{row.label}</span>
                {row.description && (
                  <p className="text-[10px] text-zinc-400 leading-tight">{row.description}</p>
                )}
              </div>
              <span className={cn("text-sm font-semibold tabular-nums", scoreColor(row.score))}>
                {formatScore(row.score)}
              </span>
            </div>
            <Progress value={row.score} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
