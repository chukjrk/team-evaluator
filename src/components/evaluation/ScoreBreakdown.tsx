"use client";

import { cn, formatScore, scoreBarGradient } from "@/lib/utils";

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

function scoreTextColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
}

function compositeCardStyle(score: number) {
  if (score >= 75) {
    return {
      background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
      borderColor: "#6ee7b7",
    };
  }
  if (score >= 50) {
    return {
      background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      borderColor: "#fcd34d",
    };
  }
  return {
    background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    borderColor: "#fda4af",
  };
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

  const cardStyle = compositeCardStyle(compositeScore);

  return (
    <div className="space-y-4">
      {/* Composite score */}
      <div
        className="rounded-xl border px-5 py-4 text-center"
        style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Overall Score
        </p>
        <p className={cn("mt-1 text-5xl font-bold", scoreTextColor(compositeScore))}>
          {formatScore(compositeScore)}
        </p>
        <p className="text-xs text-zinc-400">out of 100</p>
      </div>

      {/* Component rows */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-700">{row.label}</span>
                {row.description && (
                  <p className="text-[10px] text-zinc-400 leading-tight">{row.description}</p>
                )}
              </div>
              <span className={cn("text-sm font-semibold tabular-nums", scoreTextColor(row.score))}>
                {formatScore(row.score)}
              </span>
            </div>
            {/* Gradient progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${row.score}%`, ...scoreBarGradient(row.score) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
