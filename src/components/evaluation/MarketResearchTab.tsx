"use client";

import { useState } from "react";
import { TrendingUp, Users, MessageCircle, Wrench, RefreshCw, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { IdeaData } from "@/lib/types/idea";
import type { MarketResearchResult, MarketResearchSection, MarketResearchTopic } from "@/lib/types/market-research";

interface MarketResearchTabProps {
  idea: IdeaData;
  onIdeaUpdated: (idea: IdeaData) => void;
}

const TOPIC_CONFIG: Record<
  MarketResearchTopic,
  { label: string; icon: React.ReactNode; requiresReeval: boolean }
> = {
  "customer-pain": {
    label: "Customer Pain & Behavioral Evidence",
    icon: <MessageCircle className="h-4 w-4 text-rose-500" />,
    requiresReeval: false,
  },
  "existing-solutions": {
    label: "Existing Solutions & Workarounds",
    icon: <Wrench className="h-4 w-4 text-amber-500" />,
    requiresReeval: false,
  },
  "market-size": {
    label: "Market Size & Growth Signals",
    icon: <TrendingUp className="h-4 w-4 text-violet-500" />,
    requiresReeval: true,
  },
  "competitor-landscape": {
    label: "Competitor Landscape",
    icon: <Users className="h-4 w-4 text-blue-500" />,
    requiresReeval: true,
  },
};

const TOPIC_ORDER: MarketResearchTopic[] = [
  "customer-pain",
  "existing-solutions",
  "market-size",
  "competitor-landscape",
];

function SourceList({ section }: { section: MarketResearchSection }) {
  const [open, setOpen] = useState(false);

  if (!section.sources.length) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? "Hide" : "Show"} {section.sources.length} source{section.sources.length !== 1 ? "s" : ""}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {section.sources.map((src, i) => (
            <div key={i} className="rounded border border-zinc-100 bg-zinc-50 px-2.5 py-2 space-y-0.5">
              <p className="text-[11px] font-medium text-zinc-700 leading-snug">{src.title}</p>
              <p className="text-[10px] text-zinc-500 leading-snug">{src.snippet}</p>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-violet-500 hover:underline truncate block"
              >
                {src.url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  topic,
  section,
  locked,
}: {
  topic: MarketResearchTopic;
  section: MarketResearchSection | undefined;
  locked: boolean;
}) {
  const cfg = TOPIC_CONFIG[topic];

  if (locked) {
    return (
      <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-3 opacity-50">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-400">{cfg.label}</span>
        </div>
        <p className="text-[11px] text-zinc-400 italic">
          Complete validation and re-evaluate to unlock.
        </p>
      </div>
    );
  }

  if (!section) return null;

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        {cfg.icon}
        <span className="text-xs font-semibold text-zinc-800">{cfg.label}</span>
      </div>
      <p className="text-xs text-zinc-600 leading-relaxed">{section.synthesis}</p>
      <SourceList section={section} />
    </div>
  );
}

export function MarketResearchTab({ idea, onIdeaUpdated }: MarketResearchTabProps) {
  const [generating, setGenerating] = useState(false);

  if (!idea.score) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center space-y-2">
        <TrendingUp className="h-8 w-8 text-zinc-300" />
        <p className="text-sm font-medium text-zinc-500">Evaluate the idea first</p>
        <p className="text-xs text-zinc-400">
          Market research unlocks after the idea has been scored.
        </p>
      </div>
    );
  }

  const marketResearch = idea.score.marketResearch as MarketResearchResult | null | undefined;
  const marketResearchAt = idea.score.marketResearchAt;
  const hasReeval = !!idea.score.reevalScore;

  const sectionByTopic = new Map(
    (marketResearch?.sections ?? []).map((s) => [s.topic, s])
  );

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/market-research`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Market research failed");
        return;
      }
      onIdeaUpdated({
        ...idea,
        score: idea.score
          ? {
              ...idea.score,
              marketResearch: data.marketResearch,
              marketResearchAt: data.marketResearchAt,
            }
          : null,
      });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-zinc-800">Market Research</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={handleGenerate}
          disabled={generating}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Researching..." : marketResearch ? "Regenerate" : "Run Market Research"}
        </Button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {generating ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-zinc-100 rounded-lg" />
            <div className="h-20 bg-zinc-100 rounded-lg" />
            <div className="h-14 bg-zinc-50 rounded-lg opacity-50" />
            <div className="h-14 bg-zinc-50 rounded-lg opacity-50" />
          </div>
        ) : !marketResearch ? (
          <div className="space-y-3">
            <div className="text-center py-4 space-y-1">
              <p className="text-xs text-zinc-500">
                Get AI-synthesized market intelligence sourced from the live web.
              </p>
              <p className="text-[11px] text-zinc-400">
                Covers customer pain signals and existing solutions now.
                {!hasReeval && " Market size and competitor landscape unlock after re-evaluation."}
              </p>
            </div>

            {TOPIC_ORDER.map((topic) => {
              const cfg = TOPIC_CONFIG[topic];
              if (cfg.requiresReeval && !hasReeval) {
                return (
                  <div key={topic} className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-3 opacity-50">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-400">{cfg.label}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 italic mt-1">
                      Complete validation and re-evaluate to unlock.
                    </p>
                  </div>
                );
              }
              return (
                <div key={topic} className="rounded-lg border border-dashed border-zinc-200 px-3 py-3">
                  <div className="flex items-center gap-2">
                    {cfg.icon}
                    <span className="text-xs font-semibold text-zinc-500">{cfg.label}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 italic mt-1">Click &quot;Run Market Research&quot; to generate.</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 select-text">
            {hasReeval && (
              <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                <p className="text-[11px] text-violet-700">
                  Validation complete — full market research unlocked.
                </p>
              </div>
            )}

            {TOPIC_ORDER.map((topic) => {
              const cfg = TOPIC_CONFIG[topic];
              const section = sectionByTopic.get(topic);
              const locked = cfg.requiresReeval && !hasReeval;
              return (
                <SectionCard key={topic} topic={topic} section={section} locked={locked} />
              );
            })}

            {marketResearchAt && (
              <p className="text-[10px] text-zinc-400 text-right pt-1">
                Generated{" "}
                {new Date(marketResearchAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
