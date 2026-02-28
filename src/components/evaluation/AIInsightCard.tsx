"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle, TrendingUp, Users, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredReasoning } from "@/lib/types/scoring";

interface AIInsightCardProps {
  narrative: string;
  reasoning: StoredReasoning;
}

function SubScoreBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-36 shrink-0 text-xs text-zinc-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${val * 10}%`, background: color }} />
      </div>
      <span className="text-xs text-zinc-500 w-6 text-right">{val}/10</span>
    </div>
  );
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
        <div className="border-t border-zinc-100 px-4 py-3 space-y-5">
          {/* Idea Quality sub-scores */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Idea Quality Breakdown</p>
            <div className="space-y-1.5">
              {[
                { label: "Problem Clarity", val: reasoning.ideaQuality.problemClarity },
                { label: "Market Opportunity", val: reasoning.ideaQuality.marketOpportunity },
                { label: "Competitive Landscape", val: reasoning.ideaQuality.competitiveLandscape },
                { label: "Defensibility", val: reasoning.ideaQuality.defensibility },
                { label: "Revenue Model", val: reasoning.ideaQuality.revenueModel },
              ].map(({ label, val }) => (
                <SubScoreBar key={label} label={label} val={val ?? 0} color="#a78bfa" />
              ))}
              {reasoning.ideaQuality.notes && (
                <p className="text-xs text-zinc-400 italic pt-1">{reasoning.ideaQuality.notes}</p>
              )}
            </div>
          </div>

          {/* Team Fit sub-scores */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3 w-3 text-blue-400" />
              <p className="text-xs font-medium text-zinc-500">Team Fit Breakdown</p>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Skill Alignment", val: reasoning.teamFit.skillAlignment },
                { label: "Domain Experience", val: reasoning.teamFit.domainExperience },
                { label: "Founder–Market Fit", val: reasoning.teamFit.founderMarketFit },
                { label: "Execution Risk", val: 10 - (reasoning.teamFit.executionRisk ?? 0) },
              ].map(({ label, val }) => (
                <SubScoreBar key={label} label={label} val={val ?? 0} color="#60a5fa" />
              ))}
            </div>

            {reasoning.teamFit.gaps && reasoning.teamFit.gaps.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-zinc-500 mb-1">Identified Gaps</p>
                <ul className="space-y-1">
                  {reasoning.teamFit.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-zinc-500 flex gap-1.5">
                      <span className="text-amber-400 shrink-0">•</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reasoning.teamFit.notes && (
              <p className="text-xs text-zinc-400 italic pt-1">{reasoning.teamFit.notes}</p>
            )}
          </div>

          {/* Market Sizing */}
          {reasoning.marketSizing && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <p className="text-xs font-medium text-zinc-500">Market Sizing</p>
              </div>
              <div className="space-y-1.5 rounded-md bg-zinc-50 px-3 py-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">TAM</span>
                  <span className="text-zinc-700">{reasoning.marketSizing.tam}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">SAM</span>
                  <span className="text-zinc-700">{reasoning.marketSizing.sam}</span>
                </div>
                <div className="pt-1 border-t border-zinc-200">
                  <p className="text-[10px] font-medium text-zinc-400 mb-0.5">Initial Wedge</p>
                  <p className="text-xs text-zinc-600">{reasoning.marketSizing.initialWedge}</p>
                </div>
              </div>
            </div>
          )}

          {/* Competitor Flags */}
          {reasoning.competitorFlags && reasoning.competitorFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Swords className="h-3 w-3 text-rose-400" />
                <p className="text-xs font-medium text-zinc-500">Competitor Flags</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {reasoning.competitorFlags.map((flag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700 border border-rose-100"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {reasoning.missingSkills && reasoning.missingSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1.5">Missing Skills</p>
              <div className="flex flex-wrap gap-1">
                {reasoning.missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 border border-amber-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Risks + Blockers */}
          {reasoning.timeEstimate.keyRisks && reasoning.timeEstimate.keyRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <p className="text-xs font-medium text-zinc-500">Key Risks</p>
              </div>
              <ul className="space-y-1">
                {reasoning.timeEstimate.keyRisks.map((risk, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-1.5">
                    <span className="text-zinc-300 shrink-0">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasoning.timeEstimate.blockers && reasoning.timeEstimate.blockers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1.5">
                Blockers to Optimistic Case
              </p>
              <ul className="space-y-1">
                {reasoning.timeEstimate.blockers.map((blocker, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-1.5">
                    <span className="text-blue-300 shrink-0">•</span>
                    {blocker}
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
