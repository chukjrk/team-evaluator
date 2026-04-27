import type { Visibility } from "@prisma/client";
import type { AIScoreResult, ScoreResult } from "./scoring";
import type { PivotPlan } from "./pivot";
import type { MarketResearchResult } from "./market-research";

export type { Visibility };

export interface IdeaData {
  id: string;
  title: string;
  problemStatement: string;
  targetCustomer?: string | null;
  targetCustomerWho?: string | null;
  targetCustomerWorkaround?: string | null;
  targetCustomerCostOfInaction?: string | null;
  industryId: string;
  industry: { id: string; label: string };
  notes: string | null;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
  submitterId: string;
  submitter: { id: string; name: string; email: string };
  score: (ScoreResult & {
    generatedAt: Date;
    modelVersion: string;
    reevalScore?: AIScoreResult | null;
    reevalAt?: Date | null;
    pivotPlan?: PivotPlan | null;
    pivotAt?: Date | null;
    marketResearch?: MarketResearchResult | null;
    marketResearchAt?: Date | null;
  }) | null;
}
