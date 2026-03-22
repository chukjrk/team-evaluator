"use client";

import { useState } from "react";
import { RefreshCw, ClipboardList, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface GeneratePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (additionalContext: string) => void;
  isRegenerating?: boolean;
  loading?: boolean;
}

const PLACEHOLDER_EXAMPLES = [
  "We already have 2 warm intros to potential enterprise buyers — prioritize those.",
  "Focus on validating the pricing model, not the technology.",
  "We're targeting SMBs in the UK, not US enterprise.",
  "We have 3 months runway — steps should be achievable in that window.",
];

export function GeneratePlanDialog({
  open,
  onOpenChange,
  onGenerate,
  isRegenerating = false,
  loading = false,
}: GeneratePlanDialogProps) {
  const [context, setContext] = useState("");

  function handleSubmit() {
    onGenerate(context.trim());
    setContext("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) setContext("");
    onOpenChange(next);
  }

  const placeholder = PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-violet-500" />
            {isRegenerating ? "Regenerate Validation Plan" : "Generate Validation Plan"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 leading-relaxed">
            The AI will create a step-by-step validation roadmap using your team&apos;s
            network and evaluation results. Optionally add context to guide it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
              Additional context{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={placeholder}
              className="min-h-[110px] text-sm resize-none"
              disabled={loading}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Use this to steer the plan — e.g. constraints, priorities, focus areas,
              contacts to emphasise, or things the AI might not know about your situation.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                {isRegenerating ? "Regenerate" : "Generate"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
