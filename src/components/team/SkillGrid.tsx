"use client";

import {
  SKILLS_TAXONOMY,
  CATEGORY_LABELS,
  type SkillKey,
  type SkillCategory,
} from "@/lib/constants/skills";
import type { MemberWithProfile } from "@/lib/types/profile";

interface SkillGridProps {
  members: MemberWithProfile[];
}

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  technical: "#3b82f6", // blue
  business:  "#7c3aed", // violet
  domain:    "#059669", // emerald
};

export function SkillGrid({ members: memberList }: SkillGridProps) {
  const teamSkills = new Set(
    memberList.flatMap((m) => (m.profile?.skills ?? []) as SkillKey[])
  );

  const categories = Object.keys(SKILLS_TAXONOMY) as SkillCategory[];

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const skills = SKILLS_TAXONOMY[category] as readonly string[];
        const covered = skills.filter((s) => teamSkills.has(s as SkillKey)).length;
        const pct = Math.round((covered / skills.length) * 100);
        const color = CATEGORY_COLORS[category];

        return (
          <div key={category} className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {CATEGORY_LABELS[category]}
              </span>
              <span className="text-sm font-bold tabular-nums text-zinc-900">
                {pct}
                <span className="text-xs font-medium text-zinc-400">%</span>
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>

            <p className="text-right text-[10px] tabular-nums text-zinc-400">
              {covered} / {skills.length} skills
            </p>
          </div>
        );
      })}
    </div>
  );
}
