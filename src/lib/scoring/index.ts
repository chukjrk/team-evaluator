import type { Contact, Idea, NetworkEntry } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { ScoreResult } from "@/lib/types/scoring";
import { computeTeamSkillScore } from "./team-skill";
import { computeNetworkScoreHybrid } from "./network";
import { callClaudeForScores } from "./claude";
import { clamp } from "@/lib/utils";

const COMPOSITE_WEIGHTS = {
  teamSkill: 0.25,
  network: 0.20,
  ideaQuality: 0.30,
  teamIdeaFit: 0.25,
} as const;

export async function computeFullScore(
  idea: Idea,
  members: MemberWithProfile[],
  allNetworkEntries: NetworkEntry[],
  allContacts: Contact[] = []
): Promise<ScoreResult> {
  const teamSkillScore = computeTeamSkillScore(members);
  const networkScore = computeNetworkScoreHybrid(allContacts, allNetworkEntries, idea.industryId);

  // Claude call (slow — 5-15s)
  const aiResult = await callClaudeForScores(idea, members);

  const compositeScore = clamp(
    COMPOSITE_WEIGHTS.teamSkill * teamSkillScore +
      COMPOSITE_WEIGHTS.network * networkScore +
      COMPOSITE_WEIGHTS.ideaQuality * aiResult.ideaQualityScore +
      COMPOSITE_WEIGHTS.teamIdeaFit * aiResult.teamIdeaFitScore,
    0,
    100
  );

  return {
    teamSkillScore,
    networkScore,
    ideaQualityScore: aiResult.ideaQualityScore,
    teamIdeaFitScore: aiResult.teamIdeaFitScore,
    compositeScore,
    timeToFirstCustomer: aiResult.timeToFirstCustomer,
    aiNarrative: aiResult.narrative,
    // Embed top-level AI verdict fields into the reasoning JSON blob so they
    // persist without requiring new DB columns.
    aiReasoning: {
      ...aiResult.reasoning,
      recommendation: aiResult.recommendation,
      overallViabilityScore: aiResult.overallViabilityScore,
    },
  };
}
