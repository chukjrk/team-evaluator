"use client";

import { useState } from "react";
import { Plus, RefreshCw, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import { IdeaFilters, type IdeaFilterState } from "@/components/ideas/IdeaFilters";
import { ValidationPlanTree } from "@/components/evaluation/ValidationPlanTree";
import { GeneratePlanDialog } from "@/components/evaluation/GeneratePlanDialog";
import { useIdeas } from "@/hooks/useIdeas";
import { useValidationPlan } from "@/hooks/useValidationPlan";
import type { IdeaData } from "@/lib/types/idea";

interface CenterPanelProps {
  selectedIdeaId: string | null;
  onSelectIdea: (id: string) => void;
  onIdeaUpdate: (idea: IdeaData) => void;
}

export function CenterPanel({
  selectedIdeaId,
  onSelectIdea,
  onIdeaUpdate,
}: CenterPanelProps) {
  const { ideas, mutate, isLoading } = useIdeas();
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);
  const [filters, setFilters] = useState<IdeaFilterState>({
    industry: "all",
    visibility: "all",
  });
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId) ?? null;
  const hasScore = !!selectedIdea?.score;

  const { plan, mutate: mutatePlan } = useValidationPlan(
    hasScore ? selectedIdeaId : null
  );

  const filtered = ideas.filter((idea) => {
    if (filters.industry !== "all" && idea.industryId !== filters.industry) return false;
    if (filters.visibility !== "all" && idea.visibility !== filters.visibility) return false;
    return true;
  });

  function handleNewIdea(idea: IdeaData) {
    mutate([idea, ...ideas], false);
    onSelectIdea(idea.id);
    onIdeaUpdate(idea);
  }

  function openGenerateDialog(regenerating = false) {
    setIsRegenerating(regenerating);
    setDialogOpen(true);
  }

  async function handleGeneratePlan(additionalContext: string) {
    if (!selectedIdeaId) return;
    setDialogOpen(false);
    setGeneratingPlan(true);
    try {
      const res = await fetch(`/api/ideas/${selectedIdeaId}/validation-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalContext: additionalContext || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate validation plan");
        return;
      }
      await mutatePlan(data, false);
      toast.success("Validation plan ready");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGeneratingPlan(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* ── Ideas sub-panel ──────────────────────────────────────── */}
      <div className="w-[260px] shrink-0 flex flex-col border-r border-zinc-200 bg-zinc-50">
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-zinc-900">Ideas</h2>
            <Button size="sm" onClick={() => setNewIdeaOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New
            </Button>
          </div>
          <IdeaFilters filters={filters} onChange={setFilters} />
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-medium text-zinc-500">No ideas yet</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Submit your first idea to get started
                </p>
              </div>
            ) : (
              filtered.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  isSelected={idea.id === selectedIdeaId}
                  onSelect={() => onSelectIdea(idea.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <IdeaForm
          open={newIdeaOpen}
          onOpenChange={setNewIdeaOpen}
          onSaved={handleNewIdea}
        />
      </div>

      <GeneratePlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleGeneratePlan}
        isRegenerating={isRegenerating}
        loading={generatingPlan}
      />

      {/* ── Validation Plan sub-panel ─────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col bg-white">
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="h-4 w-4 text-zinc-400 shrink-0" />
            <h2 className="text-sm font-semibold text-zinc-900 shrink-0">Validation Plan</h2>
            {selectedIdea && (
              <span className="text-xs text-zinc-400 truncate">
                — {selectedIdea.title}
              </span>
            )}
          </div>
          {plan && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs shrink-0"
              onClick={() => openGenerateDialog(true)}
              disabled={generatingPlan}
            >
              <RefreshCw
                className={`mr-1 h-3 w-3 ${generatingPlan ? "animate-spin" : ""}`}
              />
              {generatingPlan ? "Generating..." : "Regenerate"}
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {!selectedIdeaId ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] py-20 text-center px-6">
              <ClipboardList className="h-10 w-10 text-zinc-200 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No idea selected</p>
              <p className="text-xs text-zinc-300 mt-1">
                Select an idea from the list to view its validation plan
              </p>
            </div>
          ) : !hasScore ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] py-20 text-center px-6">
              <ClipboardList className="h-10 w-10 text-zinc-200 mb-3" />
              <p className="text-sm font-medium text-zinc-400">Not yet evaluated</p>
              <p className="text-xs text-zinc-300 mt-1">
                Evaluate the idea first to unlock the validation plan
              </p>
            </div>
          ) : plan ? (
            <ValidationPlanTree
              plan={plan.content}
              generatedAt={plan.generatedAt}
              triggeredByName={plan.triggeredBy.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[360px] py-20 text-center px-6">
              <ClipboardList className="h-10 w-10 text-zinc-200 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No validation plan yet</p>
              <p className="text-xs text-zinc-300 mt-1 mb-5">
                Generate an AI-powered step-by-step validation roadmap
              </p>
              <Button size="sm" onClick={() => openGenerateDialog(false)} disabled={generatingPlan}>
                {generatingPlan ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
