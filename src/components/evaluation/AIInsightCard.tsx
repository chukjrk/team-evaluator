"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle, TrendingUp, Users, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoredReasoning } from "@/lib/types/scoring";

interface AIInsightCardProps {
  narrative: string;
  reasoning: StoredReasoning;
}

function SectionHeader({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="shrink-0">{icon}</span>}
      <p className="text-[13px] font-semibold text-zinc-600">{label}</p>
    </div>
  );
}

function SubSectionLabel({ label }: { label: string }) {
  return <p className="text-[13px] font-semibold text-zinc-600 mb-2">{label}</p>;
}

function SubScoreBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-xs text-zinc-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${val * 10}%`, background: color }} />
      </div>
      <span className="text-[11px] text-zinc-500 w-8 text-right tabular-nums">{val}/10</span>
    </div>
  );
}

export function AIInsightCard({ narrative, reasoning }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white overflow-hidden transition-colors",
        !expanded && "cursor-pointer hover:border-violet-200 hover:bg-violet-50/30"
      )}
      onClick={!expanded ? () => setExpanded(true) : undefined}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
          <span className="text-sm font-semibold text-zinc-800">AI Insight</span>
        </div>
        {expanded ? (
          <button
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            title="Collapse"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </div>

      {/* Narrative — always visible */}
      <div className="px-4 pb-4">
        <p className="text-xs leading-relaxed text-zinc-500 select-text">{narrative}</p>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-4 space-y-6 select-text">

          {/* Idea Quality */}
          <div>
            <SectionHeader label="Idea Quality Breakdown" />
            <div className="space-y-2">
              {[
                { label: "Problem Clarity", val: reasoning.ideaQuality.problemClarity },
                { label: "Market Opportunity", val: reasoning.ideaQuality.marketOpportunity },
                { label: "Competitive Landscape", val: reasoning.ideaQuality.competitiveLandscape },
                { label: "Defensibility", val: reasoning.ideaQuality.defensibility },
                { label: "Revenue Model", val: reasoning.ideaQuality.revenueModel },
              ].map(({ label, val }) => (
                <SubScoreBar key={label} label={label} val={val ?? 0} color="#a78bfa" />
              ))}
            </div>
            {reasoning.ideaQuality.notes && (
              <p className="text-xs text-zinc-500 italic mt-2">{reasoning.ideaQuality.notes}</p>
            )}
          </div>

          {/* Desperation */}
          {reasoning.desperation && (
            <div>
              <SectionHeader label="Desperation Breakdown" />
              <div className="space-y-2">
                {[
                  { label: "Desperation Signals", val: reasoning.desperation.desperationSignals },
                  { label: "Segment Narrowness",  val: reasoning.desperation.segmentNarrowness },
                ].map(({ label, val }) => (
                  <SubScoreBar key={label} label={label} val={val ?? 0} color="#f97316" />
                ))}
              </div>
              {reasoning.desperation.notes && (
                <p className="text-xs text-zinc-500 italic mt-2">{reasoning.desperation.notes}</p>
              )}
            </div>
          )}

          {/* Team Fit */}
          <div>
            <SectionHeader icon={<Users className="h-3.5 w-3.5 text-blue-400" />} label="Team Fit Breakdown" />
            <div className="space-y-2">
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
              <div className="mt-3">
                <SubSectionLabel label="Identified Gaps" />
                <ul className="space-y-1.5">
                  {reasoning.teamFit.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-zinc-500 flex gap-2">
                      <span className="font-bold text-amber-400 shrink-0 mt-0.5">•</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reasoning.teamFit.notes && (
              <p className="text-xs text-zinc-500 italic mt-2">{reasoning.teamFit.notes}</p>
            )}
          </div>

          {/* Market Sizing */}
          {reasoning.marketSizing && (
            <div>
              <SectionHeader icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} label="Market Sizing" />
              <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-4 py-3 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">TAM</p>
                  <p className="text-xs text-zinc-500">{reasoning.marketSizing.tam}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">SAM</p>
                  <p className="text-xs text-zinc-500">{reasoning.marketSizing.sam}</p>
                </div>
                <div className="pt-2 border-t border-zinc-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Initial Wedge</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{reasoning.marketSizing.initialWedge}</p>
                </div>
              </div>
            </div>
          )}

          {/* Competitor Flags */}
          {reasoning.competitorFlags && reasoning.competitorFlags.length > 0 && (
            <div>
              <SectionHeader icon={<Swords className="h-3.5 w-3.5 text-rose-400" />} label="Competitor Flags" />
              <div className="flex flex-wrap gap-1.5">
                {reasoning.competitorFlags.map((flag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-100"
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
              <SubSectionLabel label="Missing Skills" />
              <div className="flex flex-wrap gap-1.5">
                {reasoning.missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Risks */}
          {reasoning.timeEstimate.keyRisks && reasoning.timeEstimate.keyRisks.length > 0 && (
            <div>
              <SectionHeader icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} label="Key Risks" />
              <ul className="space-y-2">
                {reasoning.timeEstimate.keyRisks.map((risk, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-2">
                    <span className="font-bold text-amber-400 shrink-0 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {reasoning.timeEstimate.blockers && reasoning.timeEstimate.blockers.length > 0 && (
            <div>
              <SubSectionLabel label="Blockers to Optimistic Case" />
              <ul className="space-y-2">
                {reasoning.timeEstimate.blockers.map((blocker, i) => (
                  <li key={i} className="text-xs text-zinc-500 flex gap-2">
                    <span className="font-bold text-blue-300 shrink-0 mt-0.5">•</span>
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
