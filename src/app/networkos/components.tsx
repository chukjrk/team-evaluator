"use client";

import { Copy, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { COMMUNITIES, STRENGTH_CONFIG } from "./data";
import type { OrgId, PathNode, ContactResult } from "./data";

export function OrgBadge({ orgId }: { orgId: OrgId }) {
  const community = COMMUNITIES.find((c) => c.id === orgId)!;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: community.bg, border: `1px solid ${community.border}`, color: community.text }}
    >
      {community.name}
    </span>
  );
}

export function StrengthBadge({ strength }: { strength: "WARM" | "MODERATE" | "COLD" }) {
  const cfg = STRENGTH_CONFIG[strength];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

export function PathVisualization({ nodes }: { nodes: PathNode[] }) {
  return (
    <div className="flex items-start gap-1">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && (
            <div className="h-px w-4 mt-3.5 border-t border-dashed border-zinc-300 shrink-0" />
          )}
          <div className="flex flex-col items-center gap-0.5 min-w-0">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                i === 0
                  ? "bg-violet-100 text-violet-700 ring-1 ring-violet-400"
                  : i === nodes.length - 1
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-600"
              )}
            >
              {node.initials}
            </div>
            <span className="text-[8px] text-zinc-500 text-center w-14 truncate leading-tight">
              {node.label}
            </span>
            {node.sub && (
              <span className="text-[7px] text-zinc-400 text-center leading-tight">{node.sub}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResultCard({
  contact,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: {
  contact: ContactResult;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer",
        isSelected
          ? "border-violet-500 bg-violet-50/40 ring-1 ring-violet-500"
          : isHovered
          ? "border-zinc-300 bg-zinc-50"
          : "border-zinc-200 bg-white hover:bg-zinc-50"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 truncate">{contact.name}</p>
          <p className="text-xs text-zinc-500">{contact.title} · {contact.company}</p>
        </div>
        <StrengthBadge strength={contact.strength} />
      </div>
      <div className="mb-2">
        <PathVisualization nodes={contact.pathNodes} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        {contact.orgs.map((orgId) => (
          <OrgBadge key={orgId} orgId={orgId} />
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">{contact.outreachAngle}</p>
    </button>
  );
}

export function ContactDetailPanel({
  contact,
  copiedMessage,
  onCopy,
  onClose,
}: {
  contact: ContactResult;
  copiedMessage: boolean;
  onCopy: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between px-4 py-3 border-b border-zinc-200">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h2 className="text-base font-semibold text-zinc-900">{contact.name}</h2>
            <StrengthBadge strength={contact.strength} />
          </div>
          <p className="text-sm text-zinc-500">{contact.title} · {contact.company}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-4">
          {/* Connection path */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">Connection Path</h3>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <PathVisualization nodes={contact.pathNodes} />
            </div>
          </div>

          {/* Org source */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Source Communities</h3>
            <div className="flex flex-wrap gap-1.5">
              {contact.orgs.map((orgId) => (
                <OrgBadge key={orgId} orgId={orgId} />
              ))}
            </div>
            {contact.orgs.length > 1 && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-700">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Reachable through {contact.orgs.length} of your communities — stronger introduction</span>
              </div>
            )}
          </div>

          {/* How connected */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">How You&apos;re Connected</h3>
            <p className="text-xs text-zinc-600 leading-relaxed rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {contact.middlemanNote}
            </p>
          </div>

          {/* Why this person */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Why This Person</h3>
            <p className="text-xs text-zinc-600 leading-relaxed rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {contact.whyRelevant}
            </p>
          </div>

          {/* Outreach draft */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Outreach Draft</h3>
              <button
                onClick={() => onCopy(contact.fullOutreach)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  copiedMessage
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {copiedMessage ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedMessage ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap italic">
              {contact.fullOutreach}
            </div>
          </div>

          {/* CTA */}
          <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm">
            Request Intro through {contact.pathNodes[1]?.label ?? "Connection"}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
