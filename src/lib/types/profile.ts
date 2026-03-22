import type { ConnectionStrength, ContactSource } from "@prisma/client";

export interface CofounderProfileData {
  id: string;
  background: string;
  skills: string[]; // taxonomy keys — validated at input, stored as string[]
  updatedAt: Date;
  memberId: string;
}

export interface NetworkEntryData {
  id: string;
  industryId: string;
  industry: { id: string; label: string };
  estimatedContacts: number;
  notableRoles: string[];
  connectionStrength: ConnectionStrength;
}

export interface ContactData {
  id: string;
  name: string | null;
  company: string | null;
  domain: string | null;
  position: string | null;
  industryId: string | null;
  connectionStrength: ConnectionStrength;
  source: ContactSource;
  createdAt: Date;
  updatedAt: Date;
  profileId: string;
}

export interface MemberWithProfile {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  profile:
    | (CofounderProfileData & {
        networkEntries: NetworkEntryData[];
        contacts: ContactData[];
      })
    | null;
}
