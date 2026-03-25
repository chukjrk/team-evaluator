"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, User, Users, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembers, useWorkspaceInfo } from "@/hooks/useWorkspace";
import { SKILL_LABELS, SKILLS_TAXONOMY, type SkillKey } from "@/lib/constants/skills";
import type { MemberWithProfile } from "@/lib/types/profile";

interface LeftPanelProps {
  onCollapse: () => void;
}

function skillTagStyle(skill: SkillKey): { background: string; border: string; color: string } {
  if ((SKILLS_TAXONOMY.technical as readonly string[]).includes(skill))
    return { background: "#dbeafe", border: "1px solid #3b82f6", color: "#1e3a8a" };
  if ((SKILLS_TAXONOMY.business as readonly string[]).includes(skill))
    return { background: "#ede9fe", border: "1px solid #7c3aed", color: "#2e1065" };
  return { background: "#d1fae5", border: "1px solid #059669", color: "#064e3b" };
}

function MemberRow({ member }: { member: MemberWithProfile }) {
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const skills = (member.profile?.skills ?? []) as SkillKey[];
  const visibleSkills = skills.slice(0, 3);
  const overflow = skills.length - visibleSkills.length;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white mt-0.5">
        {initials || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 truncate">{member.name}</p>
        {visibleSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={skillTagStyle(skill)}
              >
                {SKILL_LABELS[skill]}
              </span>
            ))}
            {overflow > 0 && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: "#f4f4f5", border: "1px solid #a1a1aa", color: "#52525b" }}
              >
                +{overflow}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic mt-0.5">No skills yet</p>
        )}
      </div>
    </div>
  );
}

export function LeftPanel({ onCollapse }: LeftPanelProps) {
  const { members, isLoading } = useMembers();
  const { workspace } = useWorkspaceInfo();
  const { signOut } = useClerk();
  const [teamOpen, setTeamOpen] = useState(true);

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
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onCollapse}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-3 space-y-1">
          {/* Profile */}
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <User className="h-4 w-4 shrink-0 text-zinc-400" />
            Profile
          </Link>

          {/* Team collapsible */}
          <button
            onClick={() => setTeamOpen(!teamOpen)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <Users className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="flex-1 text-left">Team</span>
            {teamOpen ? (
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            )}
          </button>

          {teamOpen && (
            <div className="pl-8 pr-2 mt-1 divide-y divide-zinc-100">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className="py-2 text-xs text-zinc-400 italic px-1">No members yet</p>
              ) : (
                members.map((m) => <MemberRow key={m.id} member={m} />)
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-100 px-3 py-2">
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-500 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}
