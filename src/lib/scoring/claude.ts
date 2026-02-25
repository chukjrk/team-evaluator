import Anthropic from "@anthropic-ai/sdk";
import type { Idea } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { AIScoreResult } from "@/lib/types/scoring";
import { clamp } from "@/lib/utils";

// ---------------------------------------------------------------------------
// System prompt — static across all evaluations, marked for caching.
// The model receives team context first (also cached), then the idea.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a startup evaluator with expertise in venture capital, go-to-market strategy, and team assessment.

You will receive two separate inputs:
1. TEAM CONTEXT — a JSON object describing the founding team: their skills, backgrounds, and network entries (industry contacts with connection strength).
2. IDEA — a JSON object describing the startup idea to evaluate.

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

// ---------------------------------------------------------------------------
// Payload builders
// ---------------------------------------------------------------------------

/**
 * Team context — includes background, skills, and network entries for every
 * workspace member.  This block is sent first and marked for prompt caching
 * so repeated evaluations within the same workspace reuse the cached tokens.
 *
 * Network entries are included here (rather than being dropped as before) so
 * Claude has richer context for team-idea fit and because the additional
 * tokens help meet the 1024-token minimum required for a cache hit.
 */
function buildTeamContext(members: MemberWithProfile[]): string {
  const team = members.map((m) => ({
    skills: m.profile?.skills ?? [],
    background: m.profile?.background ?? "",
    network: (m.profile?.networkEntries ?? []).map((e) => ({
      industry: e.industry,
      estimatedContacts: e.estimatedContacts,
      notableRoles: e.notableRoles,
      connectionStrength: e.connectionStrength,
    })),
  }));

  return JSON.stringify({ team }, null, 2);
}

/**
 * Idea payload — only the idea-specific fields.  This block is NOT cached
 * because it changes with every evaluation request.
 */
function buildIdeaPayload(idea: Idea): string {
  return JSON.stringify(
    {
      idea: {
        title: idea.title,
        problem: idea.problemStatement,
        targetCustomer: idea.targetCustomer,
        industry: idea.industry,
        notes: idea.notes ?? null,
      },
    },
    null,
    2
  );
}

// ---------------------------------------------------------------------------
// Response validation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Calls Claude to produce idea quality and team-fit scores.
 *
 * Prompt caching strategy
 * ───────────────────────
 * The user message is split into two content blocks:
 *
 *  ┌─────────────────────────────────────────────┐  ← cached (ephemeral)
 *  │  TEAM CONTEXT  (background, skills, network) │
 *  └─────────────────────────────────────────────┘
 *  ┌─────────────────────────────────────────────┐  ← NOT cached
 *  │  IDEA  (title, problem, customer, industry)  │
 *  └─────────────────────────────────────────────┘
 *
 * Because the team profile is stable across multiple idea evaluations for the
 * same workspace, Anthropic's server-side cache (5-minute TTL) will return a
 * cache hit for the second and subsequent evaluations within that window,
 * avoiding re-tokenisation of the profile data.
 *
 * The system prompt is also marked for caching; at its current length it may
 * fall below the 1024-token minimum, but combined with the team block the
 * total cacheable prefix will typically exceed the threshold for real teams.
 */
export async function callClaudeForScores(
  idea: Idea,
  members: MemberWithProfile[]
): Promise<AIScoreResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.beta.promptCaching.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
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
            // Team context — cached so subsequent evaluations in the same
            // workspace reuse these tokens without paying full input cost.
            text: `TEAM CONTEXT:\n\n${buildTeamContext(members)}`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            // Idea — changes per request, never cached.
            text: `IDEA TO EVALUATE:\n\n${buildIdeaPayload(idea)}`,
          },
        ],
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
