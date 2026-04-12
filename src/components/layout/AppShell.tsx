"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Users, Lightbulb, BarChart2, ChevronRight } from "lucide-react";
import { LeftPanel } from "./LeftPanel";
import { CenterPanel } from "./CenterPanel";
import { RightPanel } from "./RightPanel";
import { useIdeas } from "@/hooks/useIdeas";
import { cn } from "@/lib/utils";
import type { IdeaData } from "@/lib/types/idea";

const MIN_LEFT = 260;
const MAX_LEFT = 560;
const MIN_RIGHT = 360;
const DEFAULT_RIGHT = 860;
const MAX_RIGHT = 960;

type MobileTab = "team" | "ideas" | "detail";

interface AppShellProps {
  currentMemberId: string;
}

export function AppShell({ currentMemberId }: AppShellProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>("ideas");
  const [evaluatingIds, setEvaluatingIds] = useState<Set<string>>(new Set());
  const { ideas, mutate } = useIdeas(evaluatingIds.size > 0 ? 2_000 : 15_000);

  function handleEvaluationStart(ideaId: string) {
    setEvaluatingIds((prev) => new Set(prev).add(ideaId));
  }
  function handleEvaluationEnd(ideaId: string) {
    setEvaluatingIds((prev) => { const s = new Set(prev); s.delete(ideaId); return s; });
  }

  const [leftWidth, setLeftWidth] = useState(360);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  // Refs for drag state — using ref so event listeners don't become stale
  const leftDrag = useRef<{ startX: number; startWidth: number } | null>(null);
  const rightDrag = useRef<{ startX: number; startWidth: number } | null>(null);

  // ── Left handle ──────────────────────────────────────────────────────────────
  const onLeftMouseDown = useCallback((e: { preventDefault(): void; clientX: number }) => {
    e.preventDefault();
    leftDrag.current = { startX: e.clientX, startWidth: leftWidth };
  }, [leftWidth]);

  // ── Right handle ─────────────────────────────────────────────────────────────
  const onRightMouseDown = useCallback((e: { preventDefault(): void; clientX: number }) => {
    e.preventDefault();
    rightDrag.current = { startX: e.clientX, startWidth: rightWidth };
  }, [rightWidth]);

  // Global mouse move / up
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (leftDrag.current) {
        const delta = e.clientX - leftDrag.current.startX;
        setLeftWidth(Math.min(MAX_LEFT, Math.max(MIN_LEFT, leftDrag.current.startWidth + delta)));
      }
      if (rightDrag.current) {
        // Moving right → panel shrinks; moving left → panel grows
        const delta = e.clientX - rightDrag.current.startX;
        setRightWidth(Math.min(MAX_RIGHT, Math.max(MIN_RIGHT, rightDrag.current.startWidth - delta)));
      }
    }

    function onMouseUp() {
      leftDrag.current = null;
      rightDrag.current = null;
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId) ?? null;

  // On mobile, selecting an idea also navigates to the detail tab
  const handleSelectIdea = useCallback((id: string) => {
    setSelectedIdeaId(id);
    setActiveTab("detail");
  }, []);

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
      if (selectedIdeaId === deletedId) {
        setSelectedIdeaId(null);
        setActiveTab("ideas");
      }
    },
    [ideas, mutate, selectedIdeaId]
  );

  const handleCenterUpdate = useCallback(
    (idea: IdeaData) => {
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

  const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: "team", label: "Team", icon: <Users className="h-5 w-5" /> },
    { id: "ideas", label: "Ideas", icon: <Lightbulb className="h-5 w-5" /> },
    { id: "detail", label: "Detail", icon: <BarChart2 className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* ── Desktop layout (≥ 1024px) ─────────────────────────────────────────── */}
      <div className="hidden lg:flex h-screen overflow-hidden select-none">
        {/* Left panel */}
        {!leftCollapsed && (
          <div style={{ width: leftWidth, minWidth: leftWidth, maxWidth: leftWidth }} className="flex-shrink-0">
            <LeftPanel onCollapse={() => setLeftCollapsed(true)} />
          </div>
        )}

        {/* Left resize handle (only when expanded) */}
        {!leftCollapsed && (
          <div
            onMouseDown={onLeftMouseDown}
            className="group w-1.5 flex-shrink-0 cursor-col-resize bg-zinc-100 hover:bg-zinc-300 active:bg-violet-400 transition-colors"
            title="Drag to resize"
          >
            <div className="h-full w-full group-hover:opacity-100 opacity-0 flex items-center justify-center">
              <div className="h-8 w-0.5 rounded-full bg-zinc-400" />
            </div>
          </div>
        )}

        {/* Expand button (only when collapsed) */}
        {leftCollapsed && (
          <button
            onClick={() => setLeftCollapsed(false)}
            className="flex-shrink-0 w-8 flex flex-col items-center justify-start pt-3 border-r border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
            title="Expand panel"
          >
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </button>
        )}

        {/* Center panel */}
        <div className="flex-1 min-w-0">
          <CenterPanel
            selectedIdeaId={selectedIdeaId}
            onSelectIdea={setSelectedIdeaId}
            onIdeaUpdate={handleCenterUpdate}
            evaluatingIds={evaluatingIds}
          />
        </div>

        {/* Right resize handle */}
        <div
          onMouseDown={onRightMouseDown}
          className="group w-1.5 flex-shrink-0 cursor-col-resize bg-zinc-100 hover:bg-zinc-300 active:bg-violet-400 transition-colors"
          title="Drag to resize"
        >
          <div className="h-full w-full group-hover:opacity-100 opacity-0 flex items-center justify-center">
            <div className="h-8 w-0.5 rounded-full bg-zinc-400" />
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: rightWidth, minWidth: rightWidth, maxWidth: rightWidth }} className="flex-shrink-0">
          <RightPanel
            key={selectedIdea?.id}
            idea={selectedIdea}
            currentMemberId={currentMemberId}
            isEvaluating={evaluatingIds.has(selectedIdea?.id ?? "")}
            onEvaluationStart={handleEvaluationStart}
            onEvaluationEnd={handleEvaluationEnd}
            onIdeaUpdated={handleIdeaUpdate}
            onIdeaDeleted={handleIdeaDelete}
          />
        </div>
      </div>

      {/* ── Mobile / tablet layout (< 1024px) ─────────────────────────────────── */}
      <div className="flex lg:hidden flex-col h-screen overflow-hidden">
        {/* Active panel fills remaining space */}
        <div className="flex-1 min-h-0">
          {activeTab === "team" && <LeftPanel onCollapse={() => {}} />}
          {activeTab === "ideas" && (
            <CenterPanel
              selectedIdeaId={selectedIdeaId}
              onSelectIdea={handleSelectIdea}
              onIdeaUpdate={handleCenterUpdate}
              evaluatingIds={evaluatingIds}
            />
          )}
          {activeTab === "detail" && (
            <RightPanel
              key={selectedIdea?.id}
              idea={selectedIdea}
              currentMemberId={currentMemberId}
              isEvaluating={evaluatingIds.has(selectedIdea?.id ?? "")}
              onEvaluationStart={handleEvaluationStart}
              onEvaluationEnd={handleEvaluationEnd}
              onIdeaUpdated={handleIdeaUpdate}
              onIdeaDeleted={handleIdeaDelete}
            />
          )}
        </div>

        {/* Bottom navigation bar */}
        <nav className="shrink-0 flex border-t border-zinc-200 bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "text-violet-600"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {/* Active indicator */}
              {activeTab === tab.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-violet-500" />
              )}
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
