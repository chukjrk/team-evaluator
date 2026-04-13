"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { RefreshCw, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { IdeaSkillCoverage } from "./IdeaSkillCoverage";
import { TimeEstimateChip } from "./TimeEstimateChip";
import { AIInsightCard } from "./AIInsightCard";
import { ScoreLoadingState } from "./ScoreLoadingState";
import { PivotSuggestionsCard } from "./PivotSuggestionsCard";
import type { IdeaData, Visibility } from "@/lib/types/idea";
import type { AIScoreResult, StoredReasoning, Recommendation } from "@/lib/types/scoring";
import type { PivotPlan } from "@/lib/types/pivot";

interface EvaluationPanelProps {
  idea: IdeaData;
  currentMemberId: string;
  isEvaluating: boolean;
  onEvaluationStart: (ideaId: string) => void;
  onEvaluationEnd: (ideaId: string) => void;
  onIdeaUpdated: (idea: IdeaData) => void;
  onIdeaDeleted: (ideaId: string) => void;
  onOpenEdit: () => void;
}

export function EvaluationPanel({
  idea,
  currentMemberId,
  isEvaluating,
  onEvaluationStart,
  onEvaluationEnd,
  onIdeaUpdated,
  onIdeaDeleted,
  onOpenEdit,
}: EvaluationPanelProps) {
  const [generatingPivot, setGeneratingPivot] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOwner = idea.submitterId === currentMemberId;

  function handleScroll() {
    if (scrollRef.current) {
      setHeaderCollapsed(scrollRef.current.scrollTop > 20);
    }
  }

  async function handleEvaluate() {
    onEvaluationStart(idea.id);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/score`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Evaluation failed");
        return;
      }
      onIdeaUpdated({ ...idea, score: data });
      toast.success("Evaluation complete");
    } catch {
      toast.error("Something went wrong during evaluation");
    } finally {
      onEvaluationEnd(idea.id);
    }
  }

  async function handleVisibilityChange(visibility: Visibility) {
    const res = await fetch(`/api/ideas/${idea.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    const data = await res.json();
    if (res.ok) {
      onIdeaUpdated(data);
      toast.success("Visibility updated");
    } else {
      toast.error(data.error ?? "Failed to update visibility");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${idea.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
    if (res.ok) {
      onIdeaDeleted(idea.id);
      toast.success("Idea deleted");
    } else {
      toast.error("Failed to delete idea");
    }
  }

  const reasoning = idea.score?.aiReasoning as StoredReasoning | undefined;
  const reevalScore = idea.score?.reevalScore as AIScoreResult | null | undefined;
  const pivotPlan = idea.score?.pivotPlan as PivotPlan | null | undefined;

  async function handleGeneratePivot() {
    setGeneratingPivot(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/pivot`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Pivot analysis failed");
        return;
      }
      onIdeaUpdated({
        ...idea,
        score: idea.score ? { ...idea.score, pivotPlan: data.pivotPlan, pivotAt: data.pivotAt } : null,
      });
    } catch {
      toast.error("Something went wrong during pivot analysis");
    } finally {
      setGeneratingPivot(false);
    }
  }

  const RECOMMENDATION_CONFIG: Record<
    Recommendation,
    { label: string; bg: string; text: string; border: string }
  > = {
    pass: {
      label: "Pass",
      bg: "#fff1f2",
      text: "#be123c",
      border: "#fda4af",
    },
    watch: {
      label: "Watch",
      bg: "#fffbeb",
      text: "#92400e",
      border: "#fcd34d",
    },
    "conditional-proceed": {
      label: "Conditional Proceed",
      bg: "#eff6ff",
      text: "#1d4ed8",
      border: "#93c5fd",
    },
    proceed: {
      label: "Proceed",
      bg: "#f0fdf4",
      text: "#15803d",
      border: "#86efac",
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`shrink-0 border-b border-zinc-200 px-5 transition-all duration-200 ${headerCollapsed ? "py-2.5" : "py-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 leading-tight truncate">
              {idea.title}
            </h2>
            {!headerCollapsed && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-zinc-400">{idea.submitter.name}</span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }}
                >
                  {idea.industry.label}
                </span>
              </div>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onOpenEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Idea details — hidden when collapsed */}
        {!headerCollapsed && (
          <div className="mt-3 space-y-2 text-xs text-zinc-500">
            <div>
              <span className="font-medium text-zinc-600">Problem: </span>
              {idea.problemStatement}
            </div>
            {idea.targetCustomerWho ? (
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-zinc-600">Who: </span>
                  {idea.targetCustomerWho}
                </div>
                {idea.targetCustomerWorkaround && (
                  <div>
                    <span className="font-medium text-zinc-600">Today: </span>
                    {idea.targetCustomerWorkaround}
                  </div>
                )}
                {idea.targetCustomerCostOfInaction && (
                  <div>
                    <span className="font-medium text-zinc-600">Cost of inaction: </span>
                    {idea.targetCustomerCostOfInaction}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <span className="font-medium text-zinc-600">Customer: </span>
                {idea.targetCustomer}
              </div>
            )}
            {idea.notes && (
              <div>
                <span className="font-medium text-zinc-600">Notes: </span>
                {idea.notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {isEvaluating ? (
          <ScoreLoadingState />
        ) : idea.score ? (
          <>
            <ScoreBreakdown
              teamSkillScore={idea.score.teamSkillScore}
              networkScore={idea.score.networkScore}
              ideaQualityScore={idea.score.ideaQualityScore}
              teamIdeaFitScore={idea.score.teamIdeaFitScore}
              desperationScore={idea.score.desperationScore ?? 0}
              compositeScore={idea.score.compositeScore}
            />

            {reasoning?.recommendation && (() => {
              const rec = RECOMMENDATION_CONFIG[reasoning.recommendation];
              return rec ? (
                <div
                  className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                  style={{ background: rec.bg, borderColor: rec.border }}
                >
                  <span className="text-xs font-medium" style={{ color: rec.text }}>
                    VC Verdict
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: rec.border, color: rec.text }}
                  >
                    {rec.label}
                  </span>
                </div>
              ) : null;
            })()}

            {reasoning?.requiredSkills && reasoning.requiredSkills.length > 0 && (
              <IdeaSkillCoverage requiredSkills={reasoning.requiredSkills} />
            )}

            <TimeEstimateChip
              timeToFirstCustomer={idea.score.timeToFirstCustomer}
              optimistic={reasoning?.timeEstimate?.optimistic}
              realistic={reasoning?.timeEstimate?.realistic}
              pessimistic={reasoning?.timeEstimate?.pessimistic}
            />

            {reasoning && (
              <AIInsightCard
                narrative={idea.score.aiNarrative}
                reasoning={reasoning}
              />
            )}

            <PivotSuggestionsCard
              pivotPlan={pivotPlan ?? null}
              pivotAt={idea.score.pivotAt ?? null}
              generating={generatingPivot}
              onGenerate={handleGeneratePivot}
            />

            {/* Post-validation re-evaluation block */}
            {reevalScore && idea.score.reevalAt && (() => {
              const rec = RECOMMENDATION_CONFIG[reevalScore.recommendation];
              const qDelta = Math.round(reevalScore.ideaQualityScore - idea.score!.ideaQualityScore);
              const fitDelta = Math.round(reevalScore.teamIdeaFitScore - idea.score!.teamIdeaFitScore);
              const despDelta = Math.round((reevalScore.desperationScore ?? 0) - (idea.score!.desperationScore ?? 0));
              function delta(n: number) {
                return n > 0 ? `+${n}` : `${n}`;
              }
              return (
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                      Post-validation Score
                    </p>
                    {rec && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: rec.border, color: rec.text }}
                      >
                        {rec.label}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500">Idea Quality</p>
                      <p className="text-sm font-bold text-zinc-800">
                        {Math.round(reevalScore.ideaQualityScore)}
                      </p>
                      <p className={`text-[10px] font-medium ${qDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {delta(qDelta)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500">Team Fit</p>
                      <p className="text-sm font-bold text-zinc-800">
                        {Math.round(reevalScore.teamIdeaFitScore)}
                      </p>
                      <p className={`text-[10px] font-medium ${fitDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {delta(fitDelta)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500">Desperation</p>
                      <p className="text-sm font-bold text-zinc-800">
                        {Math.round(reevalScore.desperationScore ?? 0)}
                      </p>
                      <p className={`text-[10px] font-medium ${despDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {delta(despDelta)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">{reevalScore.narrative}</p>
                  <p className="text-[10px] text-violet-400">
                    Re-evaluated on{" "}
                    {new Date(idea.score.reevalAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              );
            })()}

            <p className="text-[10px] text-zinc-400 text-center">
              Evaluated on{" "}
              {new Date(idea.score.generatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="text-3xl">🔍</div>
            <p className="text-sm font-medium text-zinc-600">Not yet evaluated</p>
            <p className="text-xs text-zinc-400 max-w-xs">
              Click Evaluate to score this idea based on your team's skills and network.
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-zinc-200 px-5 py-3 flex items-center justify-between gap-3">
        {isOwner && (
          <Select
            value={idea.visibility}
            onValueChange={(v) => handleVisibilityChange(v as Visibility)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <div className="flex items-center gap-1.5">
                {idea.visibility === "PRIVATE" ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="WORKSPACE">Workspace</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          size="sm"
          variant={idea.score ? "outline" : "default"}
          onClick={handleEvaluate}
          disabled={isEvaluating}
          className="ml-auto"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
          {isEvaluating ? "Evaluating..." : idea.score ? "Re-evaluate" : "Evaluate"}
        </Button>
      </div>
    </div>
  );
}
