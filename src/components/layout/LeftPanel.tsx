"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CofounderCard } from "@/components/team/CofounderCard";
import { SkillGrid } from "@/components/team/SkillGrid";
import { InviteBanner } from "@/components/shared/InviteBanner";
import { computeTeamSkillScore } from "@/lib/scoring/team-skill";
import { formatScore, scoreColor } from "@/lib/utils";
import { useMembers, useWorkspaceInfo } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

export function LeftPanel() {
  const { members, isLoading } = useMembers();
  const { workspace } = useWorkspaceInfo();

  const teamScore =
    members.length > 0 ? computeTeamSkillScore(members) : null;

  return (
    <div className="flex h-full flex-col border-r border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Workspace
          </p>
          <h1 className="truncate text-sm font-semibold text-zinc-900">
            {workspace?.name ?? "Loading..."}
          </h1>
        </div>
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Team score */}
          {teamScore !== null && (
            <div className="rounded-lg bg-zinc-50 px-4 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Team Skill Strength
              </p>
              <p className={cn("text-3xl font-bold mt-0.5", scoreColor(teamScore))}>
                {formatScore(teamScore)}
              </p>
            </div>
          )}

          {/* Cofounders */}
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">Team</p>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No members yet</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <CofounderCard key={m.id} member={m} />
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Skill coverage heatmap */}
          {members.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">
                Skill Coverage
              </p>
              <SkillGrid members={members} />
            </div>
          )}

          <Separator />

          {/* Invite banner */}
          <InviteBanner />
        </div>
      </ScrollArea>
    </div>
  );
}
