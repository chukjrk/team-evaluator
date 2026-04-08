import Anthropic from "@anthropic-ai/sdk";
import type { Contact, NetworkEntry } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { ValidationPlanCore, NetworkContactGroup, NetworkContact } from "@/lib/types/validation";

const SYSTEM_PROMPT = `You are a startup validation strategist specializing in network leverage. Given a validation plan with specific steps and the founding team's real contacts, group the contacts into meaningful clusters and map each cluster to the validation steps it can accelerate.

Your job is to identify relationship clusters — groups of people who share a context (same program cohort, same company alumni network, same functional role) — and explain why each cluster is useful for specific validation steps. Grouping must be intent-driven and step-driven: different cohorts serve different trust contexts even if they help the same step, so they are separate groups.

Rules:
- Only include people from the provided contacts list (referenced by their id); return empty array if no relevant contacts exist
- Group by relationship context, not company alone — invent a short slug label that reflects the cluster (e.g. "vfa-cohort", "stripe-alumni", "b2b-saas-operators"), lowercase and hyphenated
- Each group must map to at least one validation step via forSteps array
- A group may map to multiple steps when the cluster is broadly useful
- Each contact should appear in at most one group — the group that best fits their primary relationship context. Exception: a contact may appear in two different groups only if they are genuinely useful for different validation steps belonging to those groups. Never duplicate a contact within or across groups serving the same step
- Write a group-level summary (1-2 sentences) explaining why the cluster is useful for the mapped steps — do not write individual outreach messages
- Prioritize WARM contacts over MODERATE and COLD when forming high-priority groups
- Aim for 3-7 meaningful groups; do not create singleton groups unless the contact is uniquely critical
- Max 20 contacts per group
- Write one outreachAngle per group — a sample first message referencing the specific validation step goal. It should feel specific to the relationship context of the group, not generic. Do not start with "I"
- Do not use the words "innovative", "exciting", "promising", or "potential"`;

const NETWORK_PLAN_TOOL: Anthropic.Tool = {
  name: "submit_network_plan",
  description:
    "Submit grouped contact recommendations mapped to specific validation steps. Groups are defined by relationship context — not by company alone.",
  input_schema: {
    type: "object" as const,
    properties: {
      networkContactGroups: {
        type: "array",
        description:
          "Contact groups, each tied to one or more validation steps. Empty array if no relevant contacts exist.",
        items: {
          type: "object",
          properties: {
            groupLabel: {
              type: "string",
              description:
                "Short slug label for this cluster. Invent from company/position patterns, e.g. 'vfa-cohort', 'stripe-alumni', 'mba-network'. Lowercase, hyphenated.",
            },
            summary: {
              type: "string",
              description:
                "1-2 sentences explaining why this cluster is useful for the mapped validation steps. Do not name individual contacts here.",
            },
            outreachAngle: {
              type: "string",
              description:
                "Sample opening message (1-2 sentences) you could send to someone in this group. Reference the specific validation step goal, not generic networking. Do not start with 'I'.",
            },
            forSteps: {
              type: "array",
              description:
                "Array of validation step order numbers this group helps with. Must have at least one.",
              items: { type: "integer" },
              minItems: 1,
            },
            priority: { type: "string", enum: ["high", "medium"] },
            contactIds: {
              type: "array",
              description:
                "Indices (id field) of contacts from the input list that belong to this group. Min 1, max 20.",
              items: { type: "integer" },
              minItems: 1,
              maxItems: 20,
            },
          },
          required: ["groupLabel", "summary", "outreachAngle", "forSteps", "priority", "contactIds"],
        },
      },
    },
    required: ["networkContactGroups"],
  },
};

function buildNetworkContext(
  plan: ValidationPlanCore,
  members: MemberWithProfile[],
  relevantContacts: Array<Contact & { cofounderName: string }>,
  allNetworkEntries: Array<NetworkEntry & { cofounderName: string }>
): string {
  const steps = plan.validationSteps.map((s) => ({
    order: s.order,
    title: s.title,
    type: s.type,
    priority: s.priority,
  }));

  // Include integer id for index-based output — name omitted to eliminate hallucination surface
  const contacts = relevantContacts.map((c, idx) => ({
    id: idx,
    cofounderName: c.cofounderName,
    company: c.company ?? undefined,
    position: c.position ?? undefined,
    industryId: c.industryId ?? undefined,
    connectionStrength: c.connectionStrength,
  }));

  const networkEntries = allNetworkEntries.map((e) => ({
    cofounderName: e.cofounderName,
    industryId: e.industryId,
    estimatedContacts: e.estimatedContacts,
    notableRoles: e.notableRoles,
    connectionStrength: e.connectionStrength,
  }));

  const teamNames = members.map((m) => m.name);

  return JSON.stringify({ validationSteps: steps, teamNames, contacts, networkEntries }, null, 2);
}

export async function assessNetworkForPlan(
  plan: ValidationPlanCore,
  members: MemberWithProfile[],
  allContacts: Contact[],
  allNetworkEntries: NetworkEntry[]
): Promise<NetworkContactGroup[]> {
  console.log("[validation-network] assessNetworkForPlan start", {
    contactCount: allContacts.length,
    networkEntryCount: allNetworkEntries.length,
  });

  // Build a name lookup: profileId → member name
  const profileToMember = new Map<string, string>();
  for (const m of members) {
    if (m.profile) profileToMember.set(m.profile.id, m.name);
  }

  // Calibrated strength: stated connectionStrength × source reliability weight.
  // Source reliability reflects how intentional the import was — manual entry is the strongest
  // signal (conscious act), Google imports are weakest (low bar to be "in contacts").
  const SOURCE_WEIGHT = { MANUAL: 1.0, LINKEDIN: 0.8, GOOGLE: 0.5 } as const;
  const STRENGTH_SCORE = { WARM: 3, MODERATE: 2, COLD: 1 } as const;

  function effectiveStrength(c: Contact): number {
    return STRENGTH_SCORE[c.connectionStrength] * SOURCE_WEIGHT[c.source];
  }

  // Tag with cofounder name, sort by effective strength (descending), cap at 150
  const taggedContacts = allContacts
    .map((c) => ({ ...c, cofounderName: profileToMember.get(c.profileId) ?? "Team" }))
    .sort((a, b) => effectiveStrength(b) - effectiveStrength(a))
    .slice(0, 150);

  const taggedEntries = allNetworkEntries.map((e) => ({
    ...e,
    cofounderName: profileToMember.get(e.profileId) ?? "Team",
  }));

  if (taggedContacts.length === 0 && taggedEntries.length === 0) {
    console.log("[validation-network] no contacts or entries, returning empty");
    return [];
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 120_000,
  });

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      tools: [NETWORK_PLAN_TOOL],
      tool_choice: { type: "tool", name: "submit_network_plan" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildNetworkContext(plan, members, taggedContacts, taggedEntries),
            },
          ],
        },
      ],
    });
  } catch (apiErr) {
    console.error("[validation-network] Claude API error:", apiErr);
    throw apiErr;
  }

  console.log("[validation-network] Claude API responded", {
    stopReason: message.stop_reason,
    usage: message.usage,
  });

  const toolUseBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUseBlock) {
    throw new Error(
      `Claude did not call the expected tool. stop_reason: ${message.stop_reason}`
    );
  }

  const raw = toolUseBlock.input as { networkContactGroups: Array<{ groupLabel: string; summary: string; outreachAngle: string; forSteps: number[]; priority: "high" | "medium"; contactIds: number[] }> };

  if (!Array.isArray(raw.networkContactGroups)) {
    throw new Error("Network plan tool response missing networkContactGroups array");
  }

  // Resolve contactIds back to full NetworkContact objects from the tagged input array
  // Filter out any out-of-bounds ids Claude may have returned
  const groups: NetworkContactGroup[] = raw.networkContactGroups.map((g) => {
    const contacts: NetworkContact[] = g.contactIds
      .filter((id) => id >= 0 && id < taggedContacts.length)
      .map((id) => {
        const c = taggedContacts[id];
        return {
          cofounderName: c.cofounderName,
          contactName: c.name ?? undefined,
          company: c.company ?? undefined,
          position: c.position ?? undefined,
          connectionStrength: c.connectionStrength,
        };
      });
    return {
      groupLabel: g.groupLabel,
      summary: g.summary,
      outreachAngle: g.outreachAngle,
      forSteps: g.forSteps,
      priority: g.priority,
      contacts,
    };
  }).filter((g) => g.contacts.length > 0); // drop groups where all ids were invalid

  return groups;
}
