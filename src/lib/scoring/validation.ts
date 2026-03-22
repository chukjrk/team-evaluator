import Anthropic from "@anthropic-ai/sdk";
import type { Contact, Idea, IdeaScore, NetworkEntry } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { StoredValidationPlan } from "@/lib/types/validation";

const SYSTEM_PROMPT = `You are a startup validation strategist. Given an evaluated startup idea and the founding team's real network, generate a structured validation plan that tells the team exactly what to do next and who to contact.

Your job is to produce a concrete, prioritized action plan — not generic advice. Every step must be specific to THIS idea and THIS team's situation. Every network reach-out must reference a real person from the provided contacts list.

Return ONLY valid JSON with this exact schema:
{
  "hypothesis": "<The single most critical assumption that, if wrong, kills this idea. One sentence.>",
  "validationSteps": [
    {
      "order": <integer starting at 1>,
      "title": "<short action title>",
      "description": "<2-3 sentences describing exactly what to do and what to learn from it>",
      "type": "customer-interview" | "prototype" | "market-research" | "technical" | "partnership" | "mvp-test",
      "priority": "critical" | "high" | "medium"
    }
  ],
  "networkReachOuts": [
    {
      "cofounderName": "<name of the team member who owns this contact>",
      "contactName": "<name of the person to reach out to, if known>",
      "company": "<company name>",
      "position": "<their role>",
      "connectionStrength": "WARM" | "MODERATE" | "COLD",
      "reason": "<why this specific person is valuable for validation — be precise>",
      "outreachAngle": "<exactly what to say in the first message — reference the specific problem you're solving>",
      "priority": "high" | "medium"
    }
  ],
  "successCriteria": [
    "<specific, measurable thing that must be true before proceeding — e.g. '8 of 10 customer interviews confirm they would pay $X/month'>",
    ...
  ],
  "estimatedTimeline": "<realistic timeline to complete the critical validation steps, e.g. '3-4 weeks'>",
  "reevaluationTriggers": [
    "<specific finding that would change the evaluation score significantly — e.g. 'Hospital procurement cycle is 18+ months, not 3-6 months as assumed'>",
    ...
  ]
}

Rules:
- validationSteps: exactly 3 to 4 steps, ordered by priority (critical first). Keep descriptions concise (1-2 sentences).
- networkReachOuts: only include people from the provided contacts list; if no relevant contacts exist, return an empty array; max 5 reach-outs. Keep outreachAngle to 1-2 sentences.
- successCriteria: exactly 3 specific, measurable criteria (1 sentence each)
- reevaluationTriggers: exactly 2 findings that would materially change the score (1 sentence each)
- Be concise throughout — the entire JSON response must fit within 1500 tokens
- Do not use the words "innovative", "exciting", "promising", or "potential"
- Do not include any text outside the JSON object`;

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
    timeout: 120_000, // 2 minute hard timeout
  });

  console.log("[validation] calling Claude API...");
  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
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

  let raw = (message.content[0] as Anthropic.TextBlock).text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Claude returned non-JSON response: ${raw.slice(0, 300)}`);
  }

  const p = parsed as StoredValidationPlan;
  if (!p.hypothesis || !Array.isArray(p.validationSteps) || !Array.isArray(p.networkReachOuts)) {
    throw new Error("Validation plan response missing required fields");
  }

  return p;
}
