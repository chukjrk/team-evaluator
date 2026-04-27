"use client";

import { useState, useRef } from "react";
import { RefreshCw, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useValidationPlan } from "@/hooks/useValidationPlan";
import type { IdeaData } from "@/lib/types/idea";
import type { ValidationStep } from "@/lib/types/validation";

interface ValidationNotesTabProps {
  idea: IdeaData;
  onIdeaUpdated: (idea: IdeaData) => void;
  onReevalComplete: () => void; // switches to evaluation tab after success
}

function StepNoteCard({
  step,
  ideaId,
  onSaved,
}: {
  step: ValidationStep;
  ideaId: string;
  onSaved: (updated: ValidationStep) => void;
}) {
  const [supporting, setSupporting] = useState(step.supportingNotes ?? "");
  const [contradicting, setContradicting] = useState(step.contradictingNotes ?? "");
  const [sources, setSources] = useState(step.dataSources ?? "");
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function saveField(field: "supportingNotes" | "contradictingNotes" | "dataSources", value: string) {
    const res = await fetch(`/api/ideas/${ideaId}/validation-plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepOrder: step.order, [field]: value }),
    });
    if (res.ok) {
      const data = await res.json();
      const updated = (data.content?.validationSteps as ValidationStep[] | undefined)?.find(
        (s) => s.order === step.order
      );
      if (updated) onSaved(updated);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), 1500);
    }
  }

  const hasNotes = !!(supporting || contradicting || sources);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Step header */}
      <div className="flex items-start gap-2.5 px-3.5 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-800 leading-snug">{step.title}</span>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${
              step.priority === "critical"
                ? "bg-red-50 text-red-700 border-red-200"
                : step.priority === "high"
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-zinc-100 text-zinc-500 border-zinc-200"
            }`}
          >
            {step.priority}
          </span>
        </div>
        {saved && (
          <span className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium shrink-0 bg-green-50 text-green-700 border-green-200 transition-opacity duration-300">
            Saved
          </span>
        )}
        {hasNotes && (
          <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5" title="Has notes" />
        )}
      </div>

      {/* Note fields */}
      <div className="px-3.5 py-3 space-y-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
            Supporting evidence
          </label>
          <textarea
            value={supporting}
            onChange={(e) => setSupporting(e.target.value)}
            onBlur={(e) => saveField("supportingNotes", e.target.value)}
            placeholder="What confirmed your assumption? Interviews, signals, data, positive responses..."
            rows={3}
            className="w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
            Contradicting evidence
          </label>
          <textarea
            value={contradicting}
            onChange={(e) => setContradicting(e.target.value)}
            onBlur={(e) => saveField("contradictingNotes", e.target.value)}
            placeholder="What challenged or disproved it? Objections, failed tests, unexpected pushback..."
            rows={3}
            className="w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
            Sources
          </label>
          <input
            type="text"
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            onBlur={(e) => saveField("dataSources", e.target.value)}
            placeholder="Who you spoke to, articles read, datasets used..."
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
          />
        </div>
      </div>
    </div>
  );
}

export function ValidationNotesTab({
  idea,
  onIdeaUpdated,
  onReevalComplete,
}: ValidationNotesTabProps) {
  const [reevaluating, setReevaluating] = useState(false);
  const { plan, mutate: mutatePlan } = useValidationPlan(idea.score ? idea.id : null);

  const steps = plan?.content.validationSteps ?? [];
  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const canReeval = totalSteps > 0 && completedCount / totalSteps >= 0.5;

  async function handleReeval() {
    setReevaluating(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/reeval`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Re-evaluation failed");
        return;
      }
      onIdeaUpdated({ ...idea, score: data });
      toast.success("Re-evaluation complete");
      onReevalComplete();
    } catch {
      toast.error("Something went wrong during re-evaluation");
    } finally {
      setReevaluating(false);
    }
  }

  if (!idea.score) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] py-20 text-center px-6">
        <NotebookPen className="h-10 w-10 text-zinc-200 mb-3" />
        <p className="text-sm font-medium text-zinc-400">Not yet evaluated</p>
        <p className="text-xs text-zinc-300 mt-1">
          Evaluate the idea first to unlock validation notes
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] py-20 text-center px-6">
        <NotebookPen className="h-10 w-10 text-zinc-200 mb-3" />
        <p className="text-sm font-medium text-zinc-400">No validation plan yet</p>
        <p className="text-xs text-zinc-300 mt-1">
          Generate a validation plan first to start tracking notes
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Progress bar */}
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-zinc-400 shrink-0 tabular-nums">
            {completedCount}/{totalSteps} steps done
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="px-4 py-4 space-y-3">
          {steps.map((step) => (
            <StepNoteCard
              key={`${idea.id}-${step.order}`}
              step={step}
              ideaId={idea.id}
              onSaved={(updated) => {
                if (!plan) return;
                const updatedContent = {
                  ...plan.content,
                  validationSteps: plan.content.validationSteps.map((s) =>
                    s.order === updated.order ? updated : s
                  ),
                };
                mutatePlan({ ...plan, content: updatedContent }, false);
              }}
            />
          ))}

          {/* Re-evaluate section */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-zinc-700">Re-evaluate with validation data</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {canReeval
                  ? "Your notes will be fed to the AI alongside the original evaluation. It will cross-check your findings and update the scores."
                  : `Complete at least ${Math.ceil(totalSteps * 0.5)} of ${totalSteps} steps to unlock re-evaluation.`}
              </p>
            </div>
            <Button
              size="sm"
              variant={canReeval ? "default" : "outline"}
              onClick={handleReeval}
              disabled={!canReeval || reevaluating}
              className="w-full"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${reevaluating ? "animate-spin" : ""}`} />
              {reevaluating ? "Re-evaluating..." : "Re-evaluate Idea"}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
