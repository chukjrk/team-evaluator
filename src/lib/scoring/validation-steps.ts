import Anthropic from "@anthropic-ai/sdk";
import type { Idea, IdeaScore } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { ValidationPlanCore } from "@/lib/types/validation";

const SYSTEM_PROMPT = `You are a startup validation strategist. Given an evaluated startup idea and the founding team's background and skills, generate a structured validation plan.

Your job is to produce a concrete, prioritized action plan — not generic advice. Every step must be specific to THIS idea and THIS team's situation.

Rules:
- validationSteps: exactly 3 to 4 steps, ordered by priority (critical first). Keep descriptions concise (1-2 sentences).
- successCriteria: exactly 3 specific, measurable criteria (1 sentence each)
- reevaluationTriggers: exactly 2 findings that would materially change the score (1 sentence each)
- Be concise throughout — keep descriptions tight, avoid filler sentences
- Do not use the words "innovative", "exciting", "promising", or "potential"`;

const VALIDATION_STEPS_TOOL: Anthropic.Tool = {
  name: "submit_validation_steps",
  description:
    "Submit the structured validation steps plan for the given startup idea and team.",
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
      "successCriteria",
      "estimatedTimeline",
      "reevaluationTriggers",
    ],
  },
};

function buildTeamContext(members: MemberWithProfile[]): string {
  const team = members.map((m) => ({
    name: m.name,
    skills: m.profile?.skills ?? [],
    background: m.profile?.background ?? "",
  }));
  return JSON.stringify({ team }, null, 2);
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

export async function generateValidationSteps(
  idea: Idea,
  score: IdeaScore,
  members: MemberWithProfile[],
  additionalContext?: string
): Promise<ValidationPlanCore> {
  console.log("[validation-steps] generateValidationSteps start", {
    ideaId: idea.id,
    memberCount: members.length,
  });

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 120_000,
  });

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      tools: [VALIDATION_STEPS_TOOL],
      tool_choice: { type: "tool", name: "submit_validation_steps" },
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
              text: `TEAM CONTEXT:\n\n${buildTeamContext(members)}`,
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
    console.error("[validation-steps] Claude API error:", apiErr);
    throw apiErr;
  }

  console.log("[validation-steps] Claude API responded", {
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

  const plan = toolUseBlock.input as ValidationPlanCore;

  if (!plan.hypothesis || !Array.isArray(plan.validationSteps)) {
    throw new Error("Validation steps tool response missing required fields");
  }

  return plan;
}
