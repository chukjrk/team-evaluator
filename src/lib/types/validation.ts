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

export const STEP_TYPE_LABELS = {
  "customer-interview": "Interview",
  prototype: "Prototype",
  "market-research": "Research",
  technical: "Technical",
  partnership: "Partnership",
  "mvp-test": "MVP Test",
} as const satisfies Record<ValidationStep["type"], string>;

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

export const CONNECTION_STRENGTH_STYLES = {
  WARM: "bg-green-100 text-green-700",
  MODERATE: "bg-yellow-100 text-yellow-700",
  COLD: "bg-zinc-100 text-zinc-500",
} as const satisfies Record<NetworkReachOut["connectionStrength"], string>;

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
