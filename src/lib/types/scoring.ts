export interface AIScoreResult {
  ideaQualityScore: number;
  teamIdeaFitScore: number;
  timeToFirstCustomer: string;
  narrative: string;
  reasoning: {
    ideaQuality: {
      problemClarity: number;
      marketOpportunity: number;
      competitiveLandscape: number;
      notes: string;
    };
    teamFit: {
      skillAlignment: number;
      domainExperience: number;
      gaps: string[];
      notes: string;
    };
    timeEstimate: {
      optimistic: string;
      realistic: string;
      keyRisks: string[];
    };
  };
}

export interface ScoreResult {
  teamSkillScore: number;
  networkScore: number;
  ideaQualityScore: number;
  teamIdeaFitScore: number;
  compositeScore: number;
  timeToFirstCustomer: string;
  aiNarrative: string;
  aiReasoning: AIScoreResult["reasoning"];
}
