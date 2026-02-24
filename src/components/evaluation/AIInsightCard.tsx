"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AIScoreResult } from "@/lib/types/scoring";

interface AIInsightCardProps {
  narrative: string;
  reasoning: AIScoreResult["reasoning"];
}

export function AIInsightCard({ narrative, reasoning }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-xs font-medium text-zinc-700">AI Insight</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed text-zinc-600">{narrative}</p>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-3 space-y-4">
          {/* Idea Quality sub-scores */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Idea Quality Breakdown</p>
            <div className="space-y-1.5">
              {[
                { label: "Problem Clarity", val: reasoning.ideaQuality.problemClarity },
                { label: "Market Opportunity", val: reasoning.ideaQuality.marketOpportunity },
                { label: "Competitive Landscape", val: reasoning.ideaQuality.competitiveLandscape },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-36 text-xs text-zinc-500">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${val * 10}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-6 text-right">{val}/10</span>
                </div>
              ))}
              {reasoning.ideaQuality.notes && (
                <p className="text-xs text-zinc-400 italic pt-1">{reasoning.ideaQuality.notes}</p>
              )}
            </div>
          </div>

          {/* Team Fit sub-scores */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Team Fit Breakdown</p>
            <div className="space-y-1.5">
              {[
                { label: "Skill Alignment", val: reasoning.teamFit.skillAlignment },
                { label: "Domain Experience", val: reasoning.teamFit.domainExperience },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-36 text-xs text-zinc-500">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${val * 10}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-6 text-right">{val}/10</span>
                </div>
              ))}
            </div>

            {reasoning.teamFit.gaps.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-zinc-500 mb-1">Skill Gaps</p>
                <div className="flex flex-wrap gap-1">
                  {reasoning.teamFit.gaps.map((gap) => (
                    <span
                      key={gap}
                      className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700"
                    >
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {reasoning.teamFit.notes && (
              <p className="text-xs text-zinc-400 italic pt-1">{reasoning.teamFit.notes}</p>
            )}
          </div>

          {/* Key risks */}
          {reasoning.timeEstimate.keyRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <p className="text-xs font-medium text-zinc-500">Key Risks</p>
              </div>
              <ul className="space-y-1">
                {reasoning.timeEstimate.keyRisks.map((risk, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-1.5">
                    <span className="text-zinc-300">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
