"use client";

import { SKILL_LABELS, SKILLS_TAXONOMY, type SkillKey } from "@/lib/constants/skills";
import type { MemberWithProfile } from "@/lib/types/profile";

interface CofounderCardProps {
  member: MemberWithProfile;
}

/** Category-based tag style: light fill, darker border of same hue */
function skillTagStyle(skill: SkillKey): { background: string; border: string; color: string } {
  if ((SKILLS_TAXONOMY.technical as readonly string[]).includes(skill)) {
    // Blue family
    return { background: "#dbeafe", border: "1px solid #3b82f6", color: "#1e3a8a" };
  }
  if ((SKILLS_TAXONOMY.business as readonly string[]).includes(skill)) {
    // Violet family
    return { background: "#ede9fe", border: "1px solid #7c3aed", color: "#2e1065" };
  }
  // Domain — emerald/teal family
  return { background: "#d1fae5", border: "1px solid #059669", color: "#064e3b" };
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
              +{overflow} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-400 italic">No skills added yet</p>
      )}
    </div>
  );
}
