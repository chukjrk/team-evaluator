"use client";

import { Badge } from "@/components/ui/badge";
import { SKILL_LABELS, type SkillKey } from "@/lib/constants/skills";
import type { MemberWithProfile } from "@/lib/types/profile";

interface CofounderCardProps {
  member: MemberWithProfile;
}

export function CofounderCard({ member }: CofounderCardProps) {
  const skills = (member.profile?.skills ?? []) as SkillKey[];
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const SHOW_MAX = 4;
  const visibleSkills = skills.slice(0, SHOW_MAX);
  const overflow = skills.length - SHOW_MAX;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900">
            {member.name}
          </p>
          <p className="truncate text-xs text-zinc-400">{member.email}</p>
        </div>
      </div>

      {member.profile?.background && (
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
          {member.profile.background}
        </p>
      )}

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {visibleSkills.map((skill) => (
            <Badge key={skill} variant="secondary" className="px-1.5 py-0 text-[10px]">
              {SKILL_LABELS[skill]}
            </Badge>
          ))}
          {overflow > 0 && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              +{overflow} more
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-400 italic">No skills added yet</p>
      )}
    </div>
  );
}
