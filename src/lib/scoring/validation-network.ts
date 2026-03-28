import Anthropic from "@anthropic-ai/sdk";
import type { Contact, NetworkEntry } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { ValidationPlanCore, NetworkReachOut } from "@/lib/types/validation";

const SYSTEM_PROMPT = `You are a startup validation strategist specializing in network leverage. Given a validation plan with specific steps and the founding team's real contacts, identify which specific people can help with which validation steps.

Your job is to map real contacts to specific validation steps — not produce generic outreach advice. Every recommendation must reference a real person from the provided contacts list and be tied to a specific validation step.

Rules:
- Only include people from the provided contacts list; return empty array if no relevant contacts exist
- Max 5 reach-outs total
- Each reach-out must include forStep: the order number of the validation step it supports
- Keep outreachAngle to 1-2 sentences — exactly what to say in the first message
- Prioritize WARM contacts over MODERATE and COLD for the same step
- Choose the single most relevant contact per validation step where possible
- Do not use the words "innovative", "exciting", "promising", or "potential"`;

const NETWORK_PLAN_TOOL: Anthropic.Tool = {
  name: "submit_network_plan",
  description:
    "Submit the network reach-out recommendations mapped to specific validation steps.",
  input_schema: {
    type: "object" as const,
    properties: {
      networkReachOuts: {
        type: "array",
        description:
          "Up to 5 contacts from the team network to reach out to, each mapped to a specific validation step. Empty array if no relevant contacts.",
        items: {
          type: "object",
          properties: {
            cofounderName: {
              type: "string",
              description: "Name of the team member who owns this contact.",
            },
            contactName: {
              type: "string",
              description: "Name of the person to reach out to.",
            },
            company: { type: "string" },
            position: { type: "string" },
            connectionStrength: {
              type: "string",
              enum: ["WARM", "MODERATE", "COLD"],
            },
            reason: {
              type: "string",
              description:
                "Why this specific person is valuable for the mapped validation step.",
            },
            outreachAngle: {
              type: "string",
              description:
                "1-2 sentences: exactly what to say in the first message.",
            },
            priority: { type: "string", enum: ["high", "medium"] },
            forStep: {
              type: "integer",
              description:
                "The order number of the validation step this contact can help with.",
            },
          },
          required: [
            "cofounderName",
            "connectionStrength",
            "reason",
            "outreachAngle",
            "priority",
            "forStep",
          ],
        },
        maxItems: 5,
      },
    },
    required: ["networkReachOuts"],
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

  const contacts = relevantContacts.map((c) => ({
    cofounderName: c.cofounderName,
    contactName: c.name ?? undefined,
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
): Promise<NetworkReachOut[]> {
  console.log("[validation-network] assessNetworkForPlan start", {
    contactCount: allContacts.length,
    networkEntryCount: allNetworkEntries.length,
  });

  // Build a name lookup: profileId → member name
  const profileToMember = new Map<string, string>();
  for (const m of members) {
    if (m.profile) profileToMember.set(m.profile.id, m.name);
  }

  // Tag contacts with cofounder name, filter to relevant industry, sort by strength, cap at 150
  const STRENGTH_ORDER = { WARM: 0, MODERATE: 1, COLD: 2 };
  const ideaIndustryId = undefined; // no idea reference here — network agent gets pre-filtered contacts
  const taggedContacts = allContacts
    .map((c) => ({ ...c, cofounderName: profileToMember.get(c.profileId) ?? "Team" }))
    .sort((a, b) => STRENGTH_ORDER[a.connectionStrength] - STRENGTH_ORDER[b.connectionStrength])
    .slice(0, 150);
  void ideaIndustryId; // contacts already filtered by caller

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
      max_tokens: 1500,
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

  const result = toolUseBlock.input as { networkReachOuts: NetworkReachOut[] };

  if (!Array.isArray(result.networkReachOuts)) {
    throw new Error("Network plan tool response missing networkReachOuts array");
  }

  return result.networkReachOuts;
}
