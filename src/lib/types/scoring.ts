export type Recommendation = "pass" | "watch" | "conditional-proceed" | "proceed";

export interface AIScoreResult {
  ideaQualityScore: number;
  teamIdeaFitScore: number;
  overallViabilityScore: number;
  recommendation: Recommendation;
  timeToFirstCustomer: string;
  narrative: string;
  reasoning: {
    ideaQuality: {
      problemClarity: number;
      marketOpportunity: number;
      competitiveLandscape: number;
      defensibility: number;
      revenueModel: number;
      notes: string;
    };
    teamFit: {
      skillAlignment: number;
      domainExperience: number;
      founderMarketFit: number;
      executionRisk: number;
      gaps: string[];
      notes: string;
    };
    timeEstimate: {
      optimistic: string;
      realistic: string;
      pessimistic: string;
      keyRisks: string[];
      blockers: string[];
    };
    marketSizing: {
      tam: string;
      sam: string;
      initialWedge: string;
    };
    requiredSkills: string[];
    missingSkills: string[];
    competitorFlags: string[];
  };
}

/**
 * The aiReasoning JSON stored in the DB embeds `recommendation` and
 * `overallViabilityScore` alongside the reasoning object so they persist
 * without requiring a DB migration.
 */
export type StoredReasoning = AIScoreResult["reasoning"] & {
  recommendation?: Recommendation;
  overallViabilityScore?: number;
};

export interface ScoreResult {
  teamSkillScore: number;
  networkScore: number;
  ideaQualityScore: number;
  teamIdeaFitScore: number;
  compositeScore: number;
  timeToFirstCustomer: string;
  aiNarrative: string;
  aiReasoning: StoredReasoning;
}
