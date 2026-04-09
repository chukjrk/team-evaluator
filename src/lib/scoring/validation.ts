import type { Contact, Idea, IdeaScore, NetworkEntry } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { StoredValidationPlan } from "@/lib/types/validation";
import { generateValidationSteps } from "./validation-steps";
import { assessNetworkForPlan } from "./validation-network";

export { assessNetworkForPlan } from "./validation-network";

export async function generateValidationPlan(
  idea: Idea,
  score: IdeaScore,
  members: MemberWithProfile[],
  allContacts: Contact[],
  allNetworkEntries: NetworkEntry[],
  additionalContext?: string
): Promise<StoredValidationPlan> {
  console.log("[validation] generateValidationPlan start", {
    ideaId: idea.id,
    memberCount: members.length,
    contactCount: allContacts.length,
    networkEntryCount: allNetworkEntries.length,
  });

  // Step 1: generate hypothesis + steps + criteria (no network)
  const planCore = await generateValidationSteps(idea, score, members, additionalContext);

  console.log("[validation] steps generated, assessing network...");

  // Step 2: map network contacts to specific steps
  // No hard industry pre-filter — effective_strength sort in the agent handles prioritization,
  // and Claude evaluates relevance to each step. A lawyer matters for a legal step regardless
  // of whether their industryId matches the idea's industry.
  const networkContactGroups = await assessNetworkForPlan(
    planCore,
    members,
    allContacts,
    allNetworkEntries
  );

  console.log("[validation] network assessment complete", {
    groupCount: networkContactGroups.length,
  });

  return {
    ...planCore,
    networkContactGroups,
  };
}
