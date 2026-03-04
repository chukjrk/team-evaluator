export interface CategorizedGroup {
  industry: string;
  estimatedContacts: number;
  notableRoles: string[];
  connectionStrength: "WARM" | "MODERATE" | "COLD";
}
