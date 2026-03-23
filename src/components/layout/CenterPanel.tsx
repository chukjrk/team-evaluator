"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, RefreshCw, ClipboardList, Lightbulb, ChevronDown, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { IdeaData } from "@/lib/types/idea";

type CenterTab = "ideas" | "validation";

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
  const [activeTab, setActiveTab] = useState<CenterTab>("ideas");
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);
  const [filters, setFilters] = useState<IdeaFilterState>({
    industry: "all",
    visibility: "all",
  });
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [ideaPickerOpen, setIdeaPickerOpen] = useState(false);
  const ideaPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ideaPickerRef.current && !ideaPickerRef.current.contains(e.target as Node)) {
        setIdeaPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const tabs: { id: CenterTab; label: string; icon: React.ReactNode }[] = [
    { id: "ideas", label: "Ideas", icon: <Lightbulb className="h-4 w-4" /> },
    { id: "validation", label: "Validation Plan", icon: <ClipboardList className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "text-violet-600"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-violet-500" />
              )}
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ideas tab ────────────────────────────────────────────────── */}
      {activeTab === "ideas" && (
        <div className="flex flex-col flex-1 min-h-0 bg-zinc-50">
          {/* Sub-header */}
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

          <ScrollArea className="flex-1 h-0">
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
      )}

      {/* ── Validation Plan tab ──────────────────────────────────────── */}
      {activeTab === "validation" && (
        <div className="flex flex-col flex-1 min-h-0 bg-white">
          {/* Sub-header */}
          <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 flex items-center justify-between gap-2">
            {/* Idea picker */}
            <div className="relative min-w-0 flex-1" ref={ideaPickerRef}>
              <button
                onClick={() => setIdeaPickerOpen((o) => !o)}
                className="flex items-center gap-1.5 min-w-0 max-w-full rounded-md px-2 py-1 -mx-2 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <ClipboardList className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="text-sm font-semibold text-zinc-900 shrink-0">Validation Plan</span>
                {selectedIdea ? (
                  <span className="text-xs text-zinc-400 truncate">— {selectedIdea.title}</span>
                ) : (
                  <span className="text-xs text-zinc-300 truncate">— select an idea</span>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform", ideaPickerOpen && "rotate-180")} />
              </button>

              {ideaPickerOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
                  {ideas.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-400">No ideas yet</p>
                  ) : (
                    ideas.map((idea) => (
                      <button
                        key={idea.id}
                        onClick={() => {
                          onSelectIdea(idea.id);
                          setIdeaPickerOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        <Check className={cn("h-3.5 w-3.5 shrink-0", idea.id === selectedIdeaId ? "text-violet-500" : "text-transparent")} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-800 truncate">{idea.title}</p>
                          {idea.score && (
                            <p className="text-[10px] text-zinc-400">Score: {Math.round(idea.score.compositeScore * 100)}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
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

          <ScrollArea className="flex-1 h-0">
            {!selectedIdeaId ? (
              <div className="flex flex-col items-center justify-center min-h-[360px] py-20 text-center px-6">
                <ClipboardList className="h-10 w-10 text-zinc-200 mb-3" />
                <p className="text-sm font-medium text-zinc-400">No idea selected</p>
                <p className="text-xs text-zinc-300 mt-1">
                  Select an idea from the Ideas tab to view its validation plan
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
      )}

      <GeneratePlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleGeneratePlan}
        isRegenerating={isRegenerating}
        loading={generatingPlan}
      />
    </div>
  );
}
