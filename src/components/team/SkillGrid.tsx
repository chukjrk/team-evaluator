"use client";

import {
  SKILLS_TAXONOMY,
  SKILL_LABELS,
  CATEGORY_LABELS,
  type SkillKey,
  type SkillCategory,
} from "@/lib/constants/skills";
import type { MemberWithProfile } from "@/lib/types/profile";

interface SkillGridProps {
  members: MemberWithProfile[];
}

const CATEGORY_COLORS: Record<SkillCategory, { filled: string; empty: string }> = {
  technical: { filled: "#3b82f6", empty: "#dbeafe" }, // blue
  business:  { filled: "#7c3aed", empty: "#ede9fe" }, // violet
  domain:    { filled: "#059669", empty: "#d1fae5" }, // emerald
};

export function SkillGrid({ members: memberList }: SkillGridProps) {
  const teamSkills = new Set(
    memberList.flatMap((m) => (m.profile?.skills ?? []) as SkillKey[])
  );

  const categories = Object.keys(SKILLS_TAXONOMY) as SkillCategory[];

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const skills = SKILLS_TAXONOMY[category] as readonly string[];
        const covered = skills.filter((s) => teamSkills.has(s as SkillKey)).length;
        const pct = Math.round((covered / skills.length) * 100);
        const colors = CATEGORY_COLORS[category];

        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-zinc-500">
                {CATEGORY_LABELS[category]}
              </span>
              <span className="text-xs text-zinc-400">{covered}/{skills.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => {
                const has = teamSkills.has(skill as SkillKey);
                return (
                  <div
                    key={skill}
                    title={SKILL_LABELS[skill as SkillKey]}
                    className="h-2.5 flex-1 rounded-sm min-w-[10px] transition-colors"
                    style={{ background: has ? colors.filled : colors.empty }}
                  />
                );
              })}
            </div>
            <div className="mt-0.5 text-right text-[10px] text-zinc-400">
              {pct}% covered
            </div>
          </div>
        );
      })}
    </div>
  );
}
