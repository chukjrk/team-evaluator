"use client";

import { useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ValidationPlanTree } from "./ValidationPlanTree";
import { GeneratePlanDialog } from "./GeneratePlanDialog";
import { useValidationPlan } from "@/hooks/useValidationPlan";
import type { IdeaData } from "@/lib/types/idea";

interface ValidationPlanTabProps {
  idea: IdeaData;
}

export function ValidationPlanTab({ idea }: ValidationPlanTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const hasScore = !!idea.score;
  const { plan, mutate: mutatePlan } = useValidationPlan(hasScore ? idea.id : null);

  function openGenerateDialog(regenerating = false) {
    setIsRegenerating(regenerating);
    setDialogOpen(true);
  }

  async function handleGeneratePlan(additionalContext: string) {
    setDialogOpen(false);
    setGeneratingPlan(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/validation-plan`, {
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
    <div className="flex flex-col flex-1 min-h-0">
      {plan && (
        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-2 flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => openGenerateDialog(true)}
            disabled={generatingPlan}
          >
            <RefreshCw className={`mr-1 h-3 w-3 ${generatingPlan ? "animate-spin" : ""}`} />
            {generatingPlan ? "Generating..." : "Regenerate"}
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 h-0">
        {!hasScore ? (
          <div className="flex flex-col items-center justify-center min-h-[360px] py-20 text-center px-6">
            <ClipboardList className="h-10 w-10 text-zinc-200 mb-3" />
            <p className="text-sm font-medium text-zinc-400">Not yet evaluated</p>
            <p className="text-xs text-zinc-300 mt-1">
              Evaluate the idea first to unlock the validation plan
            </p>
          </div>
        ) : plan ? (
          <ValidationPlanTree
            key={plan.generatedAt}
            plan={plan.content}
            generatedAt={plan.generatedAt}
            triggeredByName={plan.triggeredBy.name}
            onStepToggle={async (stepOrder, completed) => {
              const res = await fetch(`/api/ideas/${idea.id}/validation-plan`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepOrder, completed }),
              });
              if (res.ok) {
                const data = await res.json();
                await mutatePlan(data, false);
              }
            }}
            onStepNotesChange={async (stepOrder, notes) => {
              const res = await fetch(`/api/ideas/${idea.id}/validation-plan`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stepOrder, notes }),
              });
              if (res.ok) {
                const data = await res.json();
                await mutatePlan(data, false);
              }
            }}
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
