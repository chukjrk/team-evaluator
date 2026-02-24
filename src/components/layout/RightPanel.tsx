"use client";

import { useState } from "react";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import { EvaluationPanel } from "@/components/evaluation/EvaluationPanel";
import type { IdeaData } from "@/lib/types/idea";

interface RightPanelProps {
  idea: IdeaData | null;
  currentMemberId: string;
  onIdeaUpdated: (idea: IdeaData) => void;
  onIdeaDeleted: (ideaId: string) => void;
}

export function RightPanel({
  idea,
  currentMemberId,
  onIdeaUpdated,
  onIdeaDeleted,
}: RightPanelProps) {
  const [editOpen, setEditOpen] = useState(false);

  if (!idea) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <p className="text-2xl">💡</p>
          <p className="text-sm font-medium text-zinc-500">Select an idea</p>
          <p className="text-xs text-zinc-400">
            Click any idea in the list to view its evaluation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <EvaluationPanel
        idea={idea}
        currentMemberId={currentMemberId}
        onIdeaUpdated={onIdeaUpdated}
        onIdeaDeleted={onIdeaDeleted}
        onOpenEdit={() => setEditOpen(true)}
      />

      <IdeaForm
        open={editOpen}
        onOpenChange={setEditOpen}
        existing={idea}
        onSaved={onIdeaUpdated}
      />
    </div>
  );
}
