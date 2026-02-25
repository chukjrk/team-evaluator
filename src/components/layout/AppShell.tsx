"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LeftPanel } from "./LeftPanel";
import { CenterPanel } from "./CenterPanel";
import { RightPanel } from "./RightPanel";
import { useIdeas } from "@/hooks/useIdeas";
import type { IdeaData } from "@/lib/types/idea";

const MIN_LEFT = 260;
const MAX_LEFT = 560;
const MIN_RIGHT = 360;
const MAX_RIGHT = 720;

interface AppShellProps {
  currentMemberId: string;
}

export function AppShell({ currentMemberId }: AppShellProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const { ideas, mutate } = useIdeas();

  const [leftWidth, setLeftWidth] = useState(360);
  const [rightWidth, setRightWidth] = useState(500);

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
    <div className="flex h-screen overflow-hidden select-none">
      {/* Left panel */}
      <div style={{ width: leftWidth, minWidth: leftWidth, maxWidth: leftWidth }} className="flex-shrink-0">
        <LeftPanel />
      </div>

      {/* Left resize handle */}
      <div
        onMouseDown={onLeftMouseDown}
        className="group w-1.5 flex-shrink-0 cursor-col-resize bg-zinc-100 hover:bg-zinc-300 active:bg-violet-400 transition-colors"
        title="Drag to resize"
      >
        <div className="h-full w-full group-hover:opacity-100 opacity-0 flex items-center justify-center">
          <div className="h-8 w-0.5 rounded-full bg-zinc-400" />
        </div>
      </div>

      {/* Center panel */}
      <div className="flex-1 min-w-0">
        <CenterPanel
          selectedIdeaId={selectedIdeaId}
          onSelectIdea={setSelectedIdeaId}
          onIdeaUpdate={handleCenterUpdate}
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
          idea={selectedIdea}
          currentMemberId={currentMemberId}
          onIdeaUpdated={handleIdeaUpdate}
          onIdeaDeleted={handleIdeaDelete}
        />
      </div>
    </div>
  );
}
