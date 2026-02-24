"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import { IdeaFilters, type IdeaFilterState } from "@/components/ideas/IdeaFilters";
import { useIdeas } from "@/hooks/useIdeas";
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

  const filtered = ideas.filter((idea) => {
    if (filters.industry !== "all" && idea.industry !== filters.industry) return false;
    if (filters.visibility !== "all" && idea.visibility !== filters.visibility) return false;
    return true;
  });

  function handleNewIdea(idea: IdeaData) {
    mutate([idea, ...ideas], false);
    onSelectIdea(idea.id);
    onIdeaUpdate(idea);
  }

  return (
    <div className="flex h-full flex-col border-r border-zinc-200 bg-zinc-50">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-900">Ideas</h2>
          <Button size="sm" onClick={() => setNewIdeaOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Idea
          </Button>
        </div>
        <IdeaFilters filters={filters} onChange={setFilters} />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
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
  );
}
