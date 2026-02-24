import type { Visibility } from "@prisma/client";
import type { ScoreResult } from "./scoring";

export type { Visibility };

export interface IdeaData {
  id: string;
  title: string;
  problemStatement: string;
  targetCustomer: string;
  industry: string;
  notes: string | null;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
  submitterId: string;
  submitter: { id: string; name: string; email: string };
  score: (ScoreResult & { generatedAt: Date; modelVersion: string }) | null;
}
