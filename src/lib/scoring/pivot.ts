import Anthropic from "@anthropic-ai/sdk";
import type { Idea, IdeaScore } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { PivotPlan, PivotSuggestion } from "@/lib/types/pivot";
import type { StoredReasoning } from "@/lib/types/scoring";

const SYSTEM_PROMPT = `You are a customer discovery strategist who helps early-stage founders find the most desperate version of their target customer.

Your job is to analyze a startup idea's current customer target and suggest 2-3 concrete pivot directions that would reach a customer who is MORE desperate — one who has already tried to solve this problem themselves, pays for inferior workarounds, or faces a workflow that breaks without a solution.

pivotType must be one of:
- "narrow-who": same problem, tighter behavioral sub-segment — who has this pain most acutely, right now, under what specific circumstance?
- "adjacent-who": a slightly different person who has the same underlying pain more intensely
- "change-how": same customer, different entry point or delivery that surfaces higher urgency

Rules: Aim for brevity in all fields.
- newTargetCustomer must describe a specific job-to-be-done with behavioral triggers, NOT a demographic or industry bucket. Bad: "healthcare workers". Good: "a clinic manager who has already built a spreadsheet to track patient no-shows because the EHR doesn't do it".
- desperationRationale must explain concrete behavioral evidence — what they are already doing that proves desperation.
- validationShortcut must be one concrete action (a call to make, a community to post in, a database to search) — not a category like "do customer interviews".
- networkLeverage: scan the team contacts provided and name specific companies or roles that could reach this segment. Return null if there is genuinely no match.
- keepWhat must identify the core insight or mechanism in the original idea worth preserving.

Prioritize suggestions where networkLeverage is non-null.
Do not use the words "innovative", "exciting", "promising", or "potential".`;

export async function generatePivotPlan(
  idea: Idea,
  score: IdeaScore,
  members: MemberWithProfile[],
): Promise<PivotPlan> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const reasoning = score.aiReasoning as StoredReasoning;

  const contacts = members.flatMap((m) =>
    (m.profile?.contacts ?? []).map((c) => ({
      company: c.company,
      position: c.position,
      industryId: c.industryId,
      connectionStrength: c.connectionStrength,
    }))
  );

  const payload = JSON.stringify(
    {
      idea: {
        title: idea.title,
        problem: idea.problemStatement,
        targetCustomer: idea.targetCustomerWho
          ? {
              who: idea.targetCustomerWho,
              workaround: idea.targetCustomerWorkaround ?? null,
              costOfInaction: idea.targetCustomerCostOfInaction ?? null,
            }
          : idea.targetCustomer,
        industryId: idea.industryId,
        notes: idea.notes ?? null,
      },
      desperationContext: {
        desperationScore: score.desperationScore,
        desperationSignals: reasoning.desperation?.desperationSignals ?? null,
        segmentNarrowness: reasoning.desperation?.segmentNarrowness ?? null,
        desperationNotes: reasoning.desperation?.notes ?? null,
        initialWedge: reasoning.marketSizing?.initialWedge ?? null,
      },
      teamContacts: contacts,
    },
    null,
    2,
  );

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: payload,
      },
    ],
    tools: [
      {
        name: "submit_pivot_plan",
        description: "Submit the pivot analysis with 2-3 customer pivot suggestions",
        input_schema: {
          type: "object" as const,
          required: ["pivotTrigger", "suggestions", "keepWhat"],
          properties: {
            pivotTrigger: {
              type: "string",
              description: "One sentence: what about this idea's current target customer signals low desperation or poor segment definition",
            },
            suggestions: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: {
                type: "object",
                required: ["pivotType", "newTargetCustomer", "desperationRationale", "validationShortcut", "networkLeverage"],
                properties: {
                  pivotType: { type: "string", enum: ["narrow-who", "adjacent-who", "change-how"] },
                  newTargetCustomer: { type: "string" },
                  desperationRationale: { type: "string" },
                  validationShortcut: { type: "string" },
                  networkLeverage: { type: ["string", "null"] },
                },
              },
            },
            keepWhat: {
              type: "string",
              description: "One sentence: what the team should NOT change — the core insight worth preserving",
            },
          },
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_pivot_plan" },
  });

  const toolBlock = message.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Pivot plan generation did not return a tool call");
  }

  const input = toolBlock.input as {
    pivotTrigger: string;
    suggestions: PivotSuggestion[];
    keepWhat: string;
  };

  return {
    pivotTrigger: input.pivotTrigger,
    suggestions: input.suggestions,
    keepWhat: input.keepWhat,
  };
}
