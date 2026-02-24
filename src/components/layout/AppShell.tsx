"use client";

import { useState, useCallback } from "react";
import { LeftPanel } from "./LeftPanel";
import { CenterPanel } from "./CenterPanel";
import { RightPanel } from "./RightPanel";
import { useIdeas } from "@/hooks/useIdeas";
import type { IdeaData } from "@/lib/types/idea";

interface AppShellProps {
  currentMemberId: string;
}

export function AppShell({ currentMemberId }: AppShellProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const { ideas, mutate } = useIdeas();

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId) ?? null;

  const handleIdeaUpdate = useCallback(
    (updated: IdeaData) => {
      mutate(
        ideas.map((i) => (i.id === updated.id ? updated : i)),
        false
      );
    },
    [ideas, mutate]
  );

  const handleIdeaDelete = useCallback(
    (deletedId: string) => {
      mutate(
        ideas.filter((i) => i.id !== deletedId),
        false
      );
      if (selectedIdeaId === deletedId) setSelectedIdeaId(null);
    },
    [ideas, mutate, selectedIdeaId]
  );

  const handleCenterUpdate = useCallback(
    (idea: IdeaData) => {
      // Sync a newly submitted/updated idea into the SWR cache
      const exists = ideas.some((i) => i.id === idea.id);
      mutate(
        exists
          ? ideas.map((i) => (i.id === idea.id ? idea : i))
          : [idea, ...ideas],
        false
      );
    },
    [ideas, mutate]
  );

  return (
    <div className="grid h-screen grid-cols-[280px_1fr_420px] overflow-hidden">
      <LeftPanel />
      <CenterPanel
        selectedIdeaId={selectedIdeaId}
        onSelectIdea={setSelectedIdeaId}
        onIdeaUpdate={handleCenterUpdate}
      />
      <RightPanel
        idea={selectedIdea}
        currentMemberId={currentMemberId}
        onIdeaUpdated={handleIdeaUpdate}
        onIdeaDeleted={handleIdeaDelete}
      />
    </div>
  );
}
