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

  // Step 2: filter contacts to idea industry before passing to network agent
  const relevantContacts = allContacts.filter(
    (c) => c.industryId === idea.industryId || c.industryId === null
  );

  // Step 3: map network contacts to specific steps
  const networkReachOuts = await assessNetworkForPlan(
    planCore,
    members,
    relevantContacts,
    allNetworkEntries
  );

  console.log("[validation] network assessment complete", {
    reachOutCount: networkReachOuts.length,
  });

  return {
    ...planCore,
    networkReachOuts,
  };
}
