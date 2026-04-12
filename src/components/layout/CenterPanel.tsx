"use client";

import { useState } from "react";
import { Plus, Info } from "lucide-react";
import Link from "next/link";
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
  evaluatingIds?: Set<string>;
}

export function CenterPanel({
  selectedIdeaId,
  onSelectIdea,
  onIdeaUpdate,
  evaluatingIds,
}: CenterPanelProps) {
  const { ideas, mutate, isLoading } = useIdeas();
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);
  const [filters, setFilters] = useState<IdeaFilterState>({
    industry: "all",
    visibility: "all",
  });

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

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-zinc-400 hover:text-zinc-500" title="Workspace info">
                <Info className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-sm font-semibold text-zinc-900">Ideas</h2>
          </div>
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
                isEvaluating={evaluatingIds?.has(idea.id) ?? false}
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
