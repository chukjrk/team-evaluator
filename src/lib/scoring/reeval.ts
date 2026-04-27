import Anthropic from "@anthropic-ai/sdk";
import type { Idea, IdeaScore } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { ValidationStep } from "@/lib/types/validation";
import type { AIScoreResult } from "@/lib/types/scoring";
import { clamp } from "@/lib/utils";
import { runDesperationSearches, buildMarketSignalsBlock } from "@/lib/tavily";

const SYSTEM_PROMPT = `You are a startup evaluator. The founding team has completed validation work on their idea. Your job is to re-evaluate the idea based on real-world evidence from their validation activities.

You will receive:
1. TEAM CONTEXT — the founding team's skills and background
2. ORIGINAL EVALUATION — the initial AI evaluation scores and reasoning (including the original desperation score)
3. VALIDATION EVIDENCE — structured notes from completed validation steps, including supporting and contradicting evidence

Scoring rules:
- Treat supporting notes as real-world evidence that reduces uncertainty — but only if backed by specific data sources or named contacts
- Weight contradicting evidence heavily — it is often more predictive of failure than positive signals
- Cross-check factual claims against your knowledge: if a team claims "no competitors exist" but you know of relevant competitors, flag them in competitorFlags; if market size claims seem inconsistent, note the discrepancy in marketSizing
- If notes are thin, vague, or lack data sources, do not significantly increase scores
- If validation revealed new risks, lower the relevant scores
- Your narrative must name what the validation revealed — positive or negative — in the first sentence
- Be honest: teams that did thorough validation with mixed results are more credible than teams with only positive notes

For desperationScore: re-evaluate based on whether validation evidence revealed real behavioral pull (customers already paying for workarounds, urgency signals from interviews, self-built solutions). Score high (75-100) only if evidence confirms desperate customers. Lower the score if validation found lukewarm interest or speculative demand.

Use the same skill taxonomy and output schema as the original evaluation.`;

const REEVAL_TOOL: Anthropic.Tool = {
  name: "submit_reevaluation",
  description: "Submit the re-evaluation scores based on validation evidence.",
  input_schema: {
    type: "object" as const,
    properties: {
      ideaQualityScore: { type: "integer", description: "0-100" },
      teamIdeaFitScore: { type: "integer", description: "0-100" },
      desperationScore: { type: "integer", description: "0-100 — Re-evaluated based on validation evidence of customer desperation. Score high only if evidence confirms behavioral pull (paying for workarounds, urgency in interviews). Lower if demand proved speculative." },
      overallViabilityScore: { type: "integer", description: "0-100" },
      recommendation: {
        type: "string",
        enum: ["pass", "watch", "conditional-proceed", "proceed"],
      },
      timeToFirstCustomer: { type: "string" },
      narrative: {
        type: "string",
        description:
          "3-5 sentences. First sentence must name what the validation revealed. Must not use words 'innovative', 'exciting', 'promising', or 'potential'.",
      },
      reasoning: {
        type: "object",
        properties: {
          ideaQuality: {
            type: "object",
            properties: {
              problemClarity: { type: "integer" },
              marketOpportunity: { type: "integer" },
              competitiveLandscape: { type: "integer" },
              defensibility: { type: "integer" },
              revenueModel: { type: "integer" },
              notes: { type: "string" },
            },
            required: ["problemClarity", "marketOpportunity", "competitiveLandscape", "defensibility", "revenueModel", "notes"],
          },
          desperation: {
            type: "object",
            properties: {
              desperationSignals: { type: "integer", description: "0-10 — Concrete behavioral evidence from validation that customers are desperate. Update based on interview/experiment results." },
              segmentNarrowness: { type: "integer", description: "0-10 — Precision of the validated target segment. Update if validation clarified or narrowed the who." },
              notes: { type: "string", description: "The most important desperation signal (or absence of signal) revealed by validation evidence." },
            },
            required: ["desperationSignals", "segmentNarrowness", "notes"],
          },
          teamFit: {
            type: "object",
            properties: {
              skillAlignment: { type: "integer" },
              domainExperience: { type: "integer" },
              founderMarketFit: { type: "integer" },
              executionRisk: { type: "integer" },
              gaps: { type: "array", items: { type: "string" } },
              notes: { type: "string" },
            },
            required: ["skillAlignment", "domainExperience", "founderMarketFit", "executionRisk", "gaps", "notes"],
          },
          timeEstimate: {
            type: "object",
            properties: {
              optimistic: { type: "string" },
              realistic: { type: "string" },
              pessimistic: { type: "string" },
              keyRisks: { type: "array", items: { type: "string" } },
              blockers: { type: "array", items: { type: "string" } },
            },
            required: ["optimistic", "realistic", "pessimistic", "keyRisks", "blockers"],
          },
          marketSizing: {
            type: "object",
            properties: {
              tam: { type: "string" },
              sam: { type: "string" },
              initialWedge: { type: "string" },
            },
            required: ["tam", "sam", "initialWedge"],
          },
          requiredSkills: { type: "array", items: { type: "string" } },
          missingSkills: { type: "array", items: { type: "string" } },
          competitorFlags: { type: "array", items: { type: "string" } },
        },
        required: ["ideaQuality", "desperation", "teamFit", "timeEstimate", "marketSizing", "requiredSkills", "missingSkills", "competitorFlags"],
      },
    },
    required: [
      "ideaQualityScore",
      "teamIdeaFitScore",
      "desperationScore",
      "overallViabilityScore",
      "recommendation",
      "timeToFirstCustomer",
      "narrative",
      "reasoning",
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

function buildReevalPayload(
  idea: Idea,
  originalScore: IdeaScore,
  completedSteps: ValidationStep[]
): string {
  const reasoning = originalScore.aiReasoning as Record<string, unknown>;

  const evidence = completedSteps.map((s) => ({
    stepOrder: s.order,
    stepTitle: s.title,
    stepType: s.type,
    supportingEvidence: s.supportingNotes ?? null,
    contradictingEvidence: s.contradictingNotes ?? null,
    dataSources: s.dataSources ?? null,
  }));

  return JSON.stringify(
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
      originalEvaluation: {
        compositeScore: originalScore.compositeScore,
        ideaQualityScore: originalScore.ideaQualityScore,
        teamIdeaFitScore: originalScore.teamIdeaFitScore,
        desperationScore: originalScore.desperationScore,
        timeToFirstCustomer: originalScore.timeToFirstCustomer,
        narrative: originalScore.aiNarrative,
        recommendation: reasoning?.recommendation ?? null,
        reasoning: {
          ideaQuality: reasoning?.ideaQuality ?? null,
          desperation: reasoning?.desperation ?? null,
          teamFit: reasoning?.teamFit ?? null,
          marketSizing: reasoning?.marketSizing ?? null,
          competitorFlags: reasoning?.competitorFlags ?? null,
        },
      },
      validationEvidence: evidence,
    },
    null,
    2
  );
}

export async function reEvaluateIdea(
  idea: Idea,
  members: MemberWithProfile[],
  originalScore: IdeaScore,
  completedSteps: ValidationStep[]
): Promise<AIScoreResult> {
  console.log("[reeval] reEvaluateIdea start", {
    ideaId: idea.id,
    completedSteps: completedSteps.length,
  });

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 120_000,
  });

  const freshSignalSets = await runDesperationSearches(idea);
  const freshSignalsBlock = buildMarketSignalsBlock(freshSignalSets.slice(0, 1));

  const userContent: Anthropic.MessageParam["content"] = [
    {
      type: "text",
      text: `TEAM CONTEXT:\n\n${buildTeamContext(members)}`,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `ORIGINAL EVALUATION AND VALIDATION EVIDENCE:\n\n${buildReevalPayload(idea, originalScore, completedSteps)}`,
    },
  ];

  if (freshSignalsBlock) {
    userContent.push({ type: "text", text: freshSignalsBlock });
  }

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      tools: [REEVAL_TOOL],
      tool_choice: { type: "tool", name: "submit_reevaluation" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });
  } catch (apiErr) {
    console.error("[reeval] Claude API error:", apiErr);
    throw apiErr;
  }

  console.log("[reeval] Claude API responded", {
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

  const result = toolUseBlock.input as AIScoreResult;

  if (typeof result.ideaQualityScore !== "number" || typeof result.teamIdeaFitScore !== "number" || typeof result.desperationScore !== "number") {
    throw new Error("Re-evaluation tool response missing required score fields");
  }

  result.ideaQualityScore = clamp(result.ideaQualityScore, 0, 100);
  result.teamIdeaFitScore = clamp(result.teamIdeaFitScore, 0, 100);
  result.desperationScore = clamp(result.desperationScore, 0, 100);
  if (typeof result.overallViabilityScore === "number") {
    result.overallViabilityScore = clamp(result.overallViabilityScore, 0, 100);
  }

  return result;
}
