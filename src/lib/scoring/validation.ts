import Anthropic from "@anthropic-ai/sdk";
import type { Contact, Idea, IdeaScore, NetworkEntry } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { StoredValidationPlan } from "@/lib/types/validation";

const SYSTEM_PROMPT = `You are a startup validation strategist. Given an evaluated startup idea and the founding team's real network, generate a structured validation plan that tells the team exactly what to do next and who to contact.

Your job is to produce a concrete, prioritized action plan — not generic advice. Every step must be specific to THIS idea and THIS team's situation. Every network reach-out must reference a real person from the provided contacts list.

Rules:
- validationSteps: exactly 3 to 4 steps, ordered by priority (critical first). Keep descriptions concise (1-2 sentences).
- networkReachOuts: only include people from the provided contacts list; if no relevant contacts exist, return an empty array; max 5 reach-outs. Keep outreachAngle to 1-2 sentences.
- successCriteria: exactly 3 specific, measurable criteria (1 sentence each)
- reevaluationTriggers: exactly 2 findings that would materially change the score (1 sentence each)
- Be concise throughout — keep descriptions tight, avoid filler sentences
- Do not use the words "innovative", "exciting", "promising", or "potential"`;

const VALIDATION_PLAN_TOOL: Anthropic.Tool = {
  name: "submit_validation_plan",
  description:
    "Submit the structured validation plan for the given startup idea and team.",
  input_schema: {
    type: "object" as const,
    properties: {
      hypothesis: {
        type: "string",
        description:
          "The single most critical assumption that, if wrong, kills this idea. One sentence.",
      },
      validationSteps: {
        type: "array",
        description: "3 to 4 prioritized validation steps, critical first.",
        items: {
          type: "object",
          properties: {
            order: { type: "integer", description: "Starting at 1." },
            title: { type: "string", description: "Short action title." },
            description: {
              type: "string",
              description:
                "1-2 sentences describing exactly what to do and what to learn.",
            },
            type: {
              type: "string",
              enum: [
                "customer-interview",
                "prototype",
                "market-research",
                "technical",
                "partnership",
                "mvp-test",
              ],
            },
            priority: {
              type: "string",
              enum: ["critical", "high", "medium"],
            },
          },
          required: ["order", "title", "description", "type", "priority"],
        },
        minItems: 3,
        maxItems: 4,
      },
      networkReachOuts: {
        type: "array",
        description:
          "Up to 5 specific contacts from the team network to reach out to. Empty array if no relevant contacts.",
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
                "Why this specific person is valuable for validation.",
            },
            outreachAngle: {
              type: "string",
              description:
                "1-2 sentences: exactly what to say in the first message.",
            },
            priority: { type: "string", enum: ["high", "medium"] },
          },
          required: [
            "cofounderName",
            "connectionStrength",
            "reason",
            "outreachAngle",
            "priority",
          ],
        },
        maxItems: 5,
      },
      successCriteria: {
        type: "array",
        description:
          "Exactly 3 specific, measurable things that must be true before proceeding.",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
      },
      estimatedTimeline: {
        type: "string",
        description:
          "Realistic timeline to complete the critical validation steps, e.g. '3-4 weeks'.",
      },
      reevaluationTriggers: {
        type: "array",
        description:
          "Exactly 2 specific findings that would change the evaluation score significantly.",
        items: { type: "string" },
        minItems: 2,
        maxItems: 2,
      },
    },
    required: [
      "hypothesis",
      "validationSteps",
      "networkReachOuts",
      "successCriteria",
      "estimatedTimeline",
      "reevaluationTriggers",
    ],
  },
};

function buildNetworkContext(
  members: MemberWithProfile[],
  relevantContacts: Array<Contact & { cofounderName: string }>,
  allNetworkEntries: Array<NetworkEntry & { cofounderName: string }>
): string {
  const teamData = {
    members: members.map((m) => ({
      name: m.name,
      skills: m.profile?.skills ?? [],
      background: m.profile?.background ?? "",
    })),
    contacts: relevantContacts.map((c) => ({
      cofounderName: c.cofounderName,
      contactName: c.name ?? undefined,
      company: c.company ?? undefined,
      position: c.position ?? undefined,
      industryId: c.industryId ?? undefined,
      connectionStrength: c.connectionStrength,
    })),
    networkEntries: allNetworkEntries.map((e) => ({
      cofounderName: e.cofounderName,
      industryId: e.industryId,
      estimatedContacts: e.estimatedContacts,
      notableRoles: e.notableRoles,
      connectionStrength: e.connectionStrength,
    })),
  };
  return JSON.stringify(teamData, null, 2);
}

function buildIdeaAndScorePayload(idea: Idea, score: IdeaScore): string {
  const reasoning = score.aiReasoning as Record<string, unknown>;
  return JSON.stringify(
    {
      idea: {
        title: idea.title,
        problem: idea.problemStatement,
        targetCustomer: idea.targetCustomer,
        industryId: idea.industryId,
        notes: idea.notes ?? null,
      },
      evaluation: {
        compositeScore: score.compositeScore,
        teamSkillScore: score.teamSkillScore,
        networkScore: score.networkScore,
        ideaQualityScore: score.ideaQualityScore,
        teamIdeaFitScore: score.teamIdeaFitScore,
        timeToFirstCustomer: score.timeToFirstCustomer,
        narrative: score.aiNarrative,
        recommendation: reasoning?.recommendation ?? null,
        reasoning: {
          ideaQuality: reasoning?.ideaQuality ?? null,
          teamFit: reasoning?.teamFit ?? null,
          timeEstimate: reasoning?.timeEstimate ?? null,
          marketSizing: reasoning?.marketSizing ?? null,
          missingSkills: reasoning?.missingSkills ?? null,
          competitorFlags: reasoning?.competitorFlags ?? null,
        },
      },
    },
    null,
    2
  );
}

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

  // Build a name lookup: profileId → member name
  const profileToMember = new Map<string, string>();
  for (const m of members) {
    if (m.profile) profileToMember.set(m.profile.id, m.name);
  }

  // Tag contacts with cofounder name, filter to relevant industry, sort by strength, cap at 150
  const STRENGTH_ORDER = { WARM: 0, MODERATE: 1, COLD: 2 };
  const taggedContacts = allContacts
    .filter((c) => c.industryId === idea.industryId || c.industryId === null)
    .map((c) => ({ ...c, cofounderName: profileToMember.get(c.profileId) ?? "Team" }))
    .sort((a, b) => STRENGTH_ORDER[a.connectionStrength] - STRENGTH_ORDER[b.connectionStrength])
    .slice(0, 150);

  // Tag network entries with cofounder name
  const taggedEntries = allNetworkEntries.map((e) => ({
    ...e,
    cofounderName: profileToMember.get(e.profileId) ?? "Team",
  }));

  console.log("[validation] context built", {
    taggedContactCount: taggedContacts.length,
    taggedEntryCount: taggedEntries.length,
    apiKeyPresent: !!process.env.ANTHROPIC_API_KEY,
    apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 8),
  });

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 120_000,
  });

  console.log("[validation] calling Claude API...");
  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      tools: [VALIDATION_PLAN_TOOL],
      tool_choice: { type: "tool", name: "submit_validation_plan" },
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
              text: `TEAM NETWORK:\n\n${buildNetworkContext(members, taggedContacts, taggedEntries)}`,
              cache_control: { type: "ephemeral" },
            },
            {
              type: "text",
              text: `IDEA AND EVALUATION:\n\n${buildIdeaAndScorePayload(idea, score)}${
                additionalContext
                  ? `\n\nADDITIONAL CONTEXT FROM THE TEAM:\n${additionalContext}`
                  : ""
              }`,
            },
          ],
        },
      ],
    });
  } catch (apiErr) {
    console.error("[validation] Claude API error:", apiErr);
    throw apiErr;
  }

  console.log("[validation] Claude API responded", {
    stopReason: message.stop_reason,
    contentBlocks: message.content.length,
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

  const plan = toolUseBlock.input as StoredValidationPlan;

  if (!plan.hypothesis || !Array.isArray(plan.validationSteps) || !Array.isArray(plan.networkReachOuts)) {
    throw new Error("Validation plan tool response missing required fields");
  }

  return plan;
}
