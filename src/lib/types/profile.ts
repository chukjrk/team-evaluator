import type { ConnectionStrength } from "@prisma/client";

export interface CofounderProfileData {
  id: string;
  background: string;
  skills: string[]; // taxonomy keys — validated at input, stored as string[]
  updatedAt: Date;
  memberId: string;
}

export interface NetworkEntryData {
  id: string;
  industry: string;
  estimatedContacts: number;
  notableRoles: string[];
  connectionStrength: ConnectionStrength;
}

export interface MemberWithProfile {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  profile: (CofounderProfileData & { networkEntries: NetworkEntryData[] }) | null;
}
