"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import {
  SKILLS_TAXONOMY,
  SKILL_LABELS,
  CATEGORY_LABELS,
  type SkillKey,
  type SkillCategory,
} from "@/lib/constants/skills";
import { useMembers } from "@/hooks/useWorkspace";

interface IdeaSkillCoverageProps {
  requiredSkills: string[];
}

const CATEGORY_COLORS: Record<SkillCategory, { bg: string; text: string; border: string }> = {
  technical: { bg: "#dbeafe", text: "#1e3a8a", border: "#3b82f6" },
  business:  { bg: "#ede9fe", text: "#2e1065", border: "#7c3aed" },
  domain:    { bg: "#d1fae5", text: "#064e3b", border: "#059669" },
};

function categoryOf(skill: string): SkillCategory | null {
  for (const cat of Object.keys(SKILLS_TAXONOMY) as SkillCategory[]) {
    if ((SKILLS_TAXONOMY[cat] as readonly string[]).includes(skill)) return cat;
  }
  return null;
}

export function IdeaSkillCoverage({ requiredSkills }: IdeaSkillCoverageProps) {
  const { members } = useMembers();

  const teamSkills = new Set(
    members.flatMap((m) => (m.profile?.skills ?? []) as SkillKey[])
  );

  // Group required skills by category, preserving taxonomy order
  const grouped: Partial<Record<SkillCategory, string[]>> = {};
  for (const cat of Object.keys(SKILLS_TAXONOMY) as SkillCategory[]) {
    const inCat = (SKILLS_TAXONOMY[cat] as readonly string[]).filter((s) =>
      requiredSkills.includes(s)
    );
    if (inCat.length > 0) grouped[cat] = inCat;
  }

  const coveredCount = requiredSkills.filter((s) => teamSkills.has(s as SkillKey)).length;
  const total = requiredSkills.length;

  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold text-zinc-700">Required Skills</p>
        <span className="text-[10px] tabular-nums text-zinc-400">
          {coveredCount} / {total} covered
        </span>
      </div>

      <div className="space-y-3">
        {(Object.keys(grouped) as SkillCategory[]).map((cat) => {
          const colors = CATEGORY_COLORS[cat];
          return (
            <div key={cat}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {grouped[cat]!.map((skill) => {
                  const covered = teamSkills.has(skill as SkillKey);
                  const label = SKILL_LABELS[skill as SkillKey] ?? skill;
                  return (
                    <div
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
                      style={
                        covered
                          ? { background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }
                          : { background: "#fafafa", color: "#a1a1aa", border: "1px dashed #d4d4d8" }
                      }
                    >
                      {covered ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: colors.border }} />
                      ) : (
                        <XCircle className="h-3 w-3 shrink-0 text-zinc-400" />
                      )}
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
