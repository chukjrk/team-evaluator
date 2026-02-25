"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { INDUSTRY_LABELS } from "@/lib/constants/industries";
import type { IdeaData, Visibility } from "@/lib/types/idea";
import type { AIScoreResult } from "@/lib/types/scoring";
import type { IndustryKey } from "@/lib/constants/industries";

interface EvaluationPanelProps {
  idea: IdeaData;
  currentMemberId: string;
  onIdeaUpdated: (idea: IdeaData) => void;
  onIdeaDeleted: (ideaId: string) => void;
  onOpenEdit: () => void;
}

export function EvaluationPanel({
  idea,
  currentMemberId,
  onIdeaUpdated,
  onIdeaDeleted,
  onOpenEdit,
}: EvaluationPanelProps) {
  const [evaluating, setEvaluating] = useState(false);
  const isOwner = idea.submitterId === currentMemberId;

  async function handleEvaluate() {
    setEvaluating(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/score`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Evaluation failed");
        return;
      }
      // Merge the new score into the idea object for the parent
      onIdeaUpdated({ ...idea, score: data });
      toast.success("Evaluation complete");
    } catch {
      toast.error("Something went wrong during evaluation");
    } finally {
      setEvaluating(false);
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

  const reasoning = idea.score?.aiReasoning as AIScoreResult["reasoning"] | undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-200 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 leading-tight">
              {idea.title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-zinc-400">{idea.submitter.name}</span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }}
              >
                {INDUSTRY_LABELS[idea.industry as IndustryKey] ?? idea.industry}
              </span>
            </div>
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

        {/* Idea details */}
        <div className="mt-3 space-y-2 text-xs text-zinc-500">
          <div>
            <span className="font-medium text-zinc-600">Problem: </span>
            {idea.problemStatement}
          </div>
          <div>
            <span className="font-medium text-zinc-600">Customer: </span>
            {idea.targetCustomer}
          </div>
          {idea.notes && (
            <div>
              <span className="font-medium text-zinc-600">Notes: </span>
              {idea.notes}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {evaluating ? (
          <ScoreLoadingState />
        ) : idea.score ? (
          <>
            <ScoreBreakdown
              teamSkillScore={idea.score.teamSkillScore}
              networkScore={idea.score.networkScore}
              ideaQualityScore={idea.score.ideaQualityScore}
              teamIdeaFitScore={idea.score.teamIdeaFitScore}
              compositeScore={idea.score.compositeScore}
            />

            {reasoning?.requiredSkills && reasoning.requiredSkills.length > 0 && (
              <IdeaSkillCoverage requiredSkills={reasoning.requiredSkills} />
            )}

            <TimeEstimateChip
              timeToFirstCustomer={idea.score.timeToFirstCustomer}
              optimistic={reasoning?.timeEstimate?.optimistic}
              realistic={reasoning?.timeEstimate?.realistic}
            />

            {reasoning && (
              <AIInsightCard
                narrative={idea.score.aiNarrative}
                reasoning={reasoning}
              />
            )}

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
              {isOwner
                ? "Click Evaluate to score this idea based on your team's skills and network."
                : "The idea submitter needs to trigger evaluation."}
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

        {isOwner && (
          <Button
            size="sm"
            variant={idea.score ? "outline" : "default"}
            onClick={handleEvaluate}
            disabled={evaluating}
            className="ml-auto"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${evaluating ? "animate-spin" : ""}`} />
            {evaluating ? "Evaluating..." : idea.score ? "Re-evaluate" : "Evaluate"}
          </Button>
        )}
      </div>
    </div>
  );
}
