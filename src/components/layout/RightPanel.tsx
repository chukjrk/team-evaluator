"use client";

import { useState } from "react";
import { ClipboardList, BarChart2, NotebookPen } from "lucide-react";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import { EvaluationPanel } from "@/components/evaluation/EvaluationPanel";
import { ValidationPlanTab } from "@/components/evaluation/ValidationPlanTab";
import { ValidationNotesTab } from "@/components/evaluation/ValidationNotesTab";
import { cn } from "@/lib/utils";
import type { IdeaData } from "@/lib/types/idea";

type RightTab = "evaluation" | "validation" | "notes";

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
  const [activeTab, setActiveTab] = useState<RightTab>("evaluation");

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

  const tabs: { id: RightTab; label: string; icon: React.ReactNode }[] = [
    { id: "evaluation", label: "Evaluation", icon: <BarChart2 className="h-3.5 w-3.5" /> },
    { id: "validation", label: "Validation Plan", icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: "notes", label: "Validation Notes", icon: <NotebookPen className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab bar */}
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

      {activeTab === "evaluation" && (
        <div className="flex flex-col flex-1 min-h-0">
          <EvaluationPanel
            idea={idea}
            currentMemberId={currentMemberId}
            onIdeaUpdated={onIdeaUpdated}
            onIdeaDeleted={onIdeaDeleted}
            onOpenEdit={() => setEditOpen(true)}
          />
        </div>
      )}

      {activeTab === "validation" && <ValidationPlanTab idea={idea} />}

      {activeTab === "notes" && (
        <ValidationNotesTab
          idea={idea}
          onIdeaUpdated={onIdeaUpdated}
          onReevalComplete={() => setActiveTab("evaluation")}
        />
      )}

      <IdeaForm
        key={idea?.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        existing={idea}
        onSaved={onIdeaUpdated}
      />
    </div>
  );
}
