export interface ValidationStep {
  order: number;
  title: string;
  description: string;
  type:
    | "customer-interview"
    | "prototype"
    | "market-research"
    | "technical"
    | "partnership"
    | "mvp-test";
  priority: "critical" | "high" | "medium";
  completed?: boolean;
  supportingNotes?: string;    // evidence that confirms the assumption
  contradictingNotes?: string; // evidence that challenged or disproved it
  dataSources?: string;        // who was spoken to, what data was used
}

export interface NetworkReachOut {
  cofounderName: string; // which team member owns this contact
  contactName?: string;
  company?: string;
  position?: string;
  connectionStrength: "WARM" | "MODERATE" | "COLD";
  reason: string; // why this person is relevant
  outreachAngle: string; // what to say / how to approach
  priority: "high" | "medium";
  forStep?: number; // maps to validationStep.order
}

// Plan without network reach-outs — returned by the steps agent
export type ValidationPlanCore = Omit<StoredValidationPlan, "networkReachOuts">;

export interface StoredValidationPlan {
  hypothesis: string; // primary thing to validate
  validationSteps: ValidationStep[];
  networkReachOuts: NetworkReachOut[]; // specific contacts from workspace network
  successCriteria: string[];
  estimatedTimeline: string;
  reevaluationTriggers: string[]; // key findings that would change the score
}

export interface ValidationPlanResponse {
  id: string;
  content: StoredValidationPlan;
  generatedAt: string;
  modelVersion: string;
  ideaId: string;
  triggeredById: string;
  triggeredBy: { name: string };
}
