import Anthropic from "@anthropic-ai/sdk";
import type { Idea } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { AIScoreResult } from "@/lib/types/scoring";
import { clamp } from "@/lib/utils";

const SYSTEM_PROMPT = `You are a startup evaluator with expertise in venture capital, go-to-market strategy, and team assessment.

You will receive a JSON object with two keys: "idea" and "team".

Evaluate and return ONLY valid JSON with this exact schema:
{
  "ideaQualityScore": <integer 0-100>,
  "teamIdeaFitScore": <integer 0-100>,
  "timeToFirstCustomer": "<range string, e.g. '3-6 months'>",
  "narrative": "<2-4 sentence plain English summary of the idea and its prospects>",
  "reasoning": {
    "ideaQuality": {
      "problemClarity": <integer 0-10>,
      "marketOpportunity": <integer 0-10>,
      "competitiveLandscape": <integer 0-10>,
      "notes": "<string>"
    },
    "teamFit": {
      "skillAlignment": <integer 0-10>,
      "domainExperience": <integer 0-10>,
      "gaps": ["<gap string>"],
      "notes": "<string>"
    },
    "timeEstimate": {
      "optimistic": "<string>",
      "realistic": "<string>",
      "keyRisks": ["<risk string>"]
    }
  }
}

Do not include any text outside the JSON object. Do not wrap in markdown code fences.
All ideas should be treated as early-stage/preliminary regardless of description depth.`;

function buildPayload(idea: Idea, members: MemberWithProfile[]): string {
  return JSON.stringify({
    idea: {
      title: idea.title,
      problem: idea.problemStatement,
      targetCustomer: idea.targetCustomer,
      industry: idea.industry,
      notes: idea.notes ?? null,
    },
    team: members.map((m) => ({
      skills: m.profile?.skills ?? [],
      background: m.profile?.background ?? "",
    })),
  });
}

function validateAndNormalize(raw: unknown): AIScoreResult {
  const r = raw as Record<string, unknown>;

  if (
    typeof r.ideaQualityScore !== "number" ||
    typeof r.teamIdeaFitScore !== "number" ||
    typeof r.timeToFirstCustomer !== "string" ||
    typeof r.narrative !== "string"
  ) {
    throw new Error("Claude response missing required fields");
  }

  // Clamp scores defensively
  r.ideaQualityScore = clamp(r.ideaQualityScore, 0, 100);
  r.teamIdeaFitScore = clamp(r.teamIdeaFitScore, 0, 100);

  return r as unknown as AIScoreResult;
}

export async function callClaudeForScores(
  idea: Idea,
  members: MemberWithProfile[]
): Promise<AIScoreResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const payload = buildPayload(idea, members);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Evaluate this startup:\n\n${payload}`,
      },
    ],
  });

  const raw = (message.content[0] as Anthropic.TextBlock).text.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Claude returned non-JSON response: ${raw.slice(0, 300)}`
    );
  }

  return validateAndNormalize(parsed);
}
