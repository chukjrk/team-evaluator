export type PivotType = "narrow-who" | "adjacent-who" | "change-how";

export interface PivotSuggestion {
  pivotType: PivotType;
  newTargetCustomer: string;
  desperationRationale: string;
  validationShortcut: string;
  networkLeverage: string | null;
}

export interface PivotPlan {
  pivotTrigger: string;
  suggestions: PivotSuggestion[];
  keepWhat: string;
}
