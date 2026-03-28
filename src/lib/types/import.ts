export interface CategorizedGroup {
  industryId: string;
  estimatedContacts: number;
  notableRoles: string[];
  connectionStrength: "WARM" | "MODERATE" | "COLD";
}

export type StagedContact =
  | {
      source: "GOOGLE";
      name?: string;
      company?: string;
      domain?: string;
      position?: string;
      industryId?: string;
      connectionStrength: "WARM" | "MODERATE";
    }
  | {
      source: "LINKEDIN";
      company?: string;
      position?: string;
      industryId?: string;
      connectionStrength: "WARM";
    }
  | {
      source: "MANUAL";
      name?: string;
      company?: string;
      domain?: string;
      position?: string;
      industryId?: string;
      connectionStrength: "WARM" | "MODERATE" | "COLD";
    };

// Shape stored in NetworkImportSession.groups Json field (version 2).
// Old sessions stored a bare CategorizedGroup[] — use parseSessionData() to handle both.
export interface ImportSessionData {
  version: 2;
  groups: CategorizedGroup[];
  contacts: StagedContact[];
}

export function parseSessionData(raw: unknown): {
  groups: CategorizedGroup[];
  contacts: StagedContact[];
} {
  if (Array.isArray(raw)) {
    // Legacy format: bare CategorizedGroup[] with old `industry` field name
    return {
      groups: (raw as Array<Record<string, unknown>>).map((g) => ({
        industryId: (g.industryId ?? g.industry ?? "other") as string,
        estimatedContacts: g.estimatedContacts as number,
        notableRoles: (g.notableRoles ?? []) as string[],
        connectionStrength: g.connectionStrength as "WARM" | "MODERATE" | "COLD",
      })),
      contacts: [],
    };
  }
  const d = raw as ImportSessionData;
  if (d?.version === 2) return { groups: d.groups, contacts: d.contacts };
  return { groups: [], contacts: [] };
}
