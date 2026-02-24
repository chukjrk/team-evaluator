"use client";

import {
  SKILLS_TAXONOMY,
  SKILL_LABELS,
  CATEGORY_LABELS,
  type SkillKey,
  type SkillCategory,
} from "@/lib/constants/skills";
import { cn } from "@/lib/utils";
import type { MemberWithProfile } from "@/lib/types/profile";

interface SkillGridProps {
  members: MemberWithProfile[];
}

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
                    className={cn(
                      "h-2.5 flex-1 rounded-sm min-w-[10px]",
                      has ? "bg-zinc-800" : "bg-zinc-200"
                    )}
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
