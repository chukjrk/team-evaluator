import {
  SKILLS_TAXONOMY,
  type SkillKey,
  type SkillCategory,
} from "@/lib/constants/skills";
import { clamp } from "@/lib/utils";
import type { MemberWithProfile } from "@/lib/types/profile";

const CATEGORY_WEIGHTS: Record<SkillCategory, number> = {
  technical: 0.4,
  business: 0.35,
  domain: 0.25,
};

const COMPLEMENTARITY_BONUS_MAX = 10;

export function computeTeamSkillScore(members: MemberWithProfile[]): number {
  if (members.length === 0) return 0;

  // Collect all skills and which members have them
  const teamSkillSet = new Set<string>();
  const skillToMemberCount: Record<string, number> = {};

  for (const member of members) {
    for (const skill of member.profile?.skills ?? []) {
      teamSkillSet.add(skill);
      skillToMemberCount[skill] = (skillToMemberCount[skill] ?? 0) + 1;
    }
  }

  if (teamSkillSet.size === 0) return 0;

  // Coverage per category
  let weightedCoverage = 0;
  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS) as Array<
    [SkillCategory, number]
  >) {
    const categorySkills = SKILLS_TAXONOMY[category] as readonly string[];
    const covered = categorySkills.filter((s) => teamSkillSet.has(s)).length;
    weightedCoverage += weight * (covered / categorySkills.length);
  }

  // Complementarity: penalize skills held by multiple members
  const totalSkills = teamSkillSet.size;
  const duplicatedCount = Object.values(skillToMemberCount).filter(
    (count) => count > 1
  ).length;
  const complementarityRatio = Math.max(0, 1 - duplicatedCount / totalSkills);
  const complementarityBonus = complementarityRatio * COMPLEMENTARITY_BONUS_MAX;

  const baseScore = weightedCoverage * 90;
  return clamp(baseScore + complementarityBonus, 0, 100);
}
