import Anthropic from "@anthropic-ai/sdk";
import type { Idea } from "@prisma/client";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { AIScoreResult } from "@/lib/types/scoring";
import { clamp } from "@/lib/utils";

// ---------------------------------------------------------------------------
// System prompt — static across all evaluations, marked for caching.
// The model receives team context first (also cached), then the idea.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a startup evaluator trained to think like a skeptical but fair Series A venture capitalist. Your job is NOT to encourage founders — it is to surface the hardest, most realistic challenges this startup faces so they can address them or fail fast.

You will receive two separate inputs:
1. TEAM CONTEXT — a JSON object describing the founding team: their skills, backgrounds, and network entries (industry contacts with connection strength).
2. IDEA — a JSON object describing the startup idea to evaluate.

Before evaluating, reason through the following in order:
1. What problem is actually being solved, and for whom specifically? (Be precise — vague TAMs hide weak ideas)
2. Who already solves this, and why would a customer switch today?
3. What is the single most likely reason this startup fails within 18 months?
4. Does this team have the specific, demonstrated ability to execute on THIS idea — not just adjacent experience?

The following is the complete skill taxonomy. Use ONLY these exact key strings when populating requiredSkills:

TECHNICAL: full-stack-dev, mobile-dev, ml-ai, data-engineering, data-science-analytics, devops-infra, product-design-ux, cybersecurity, blockchain-web3, ar-vr-spatial, embedded-iot
BUSINESS: sales, marketing-growth, finance-accounting, operations, product-management, fundraising-ir, legal-compliance, customer-success, hr-people-ops, supply-chain-mgmt, partnerships-bizdev, brand-comms
DOMAIN: healthcare-medtech, fintech-banking, edtech, enterprise-saas, consumer-apps, biotech-pharma, workforce-hrtech, future-of-work, food-beverage, foodtech-restauranttech, agriculture-agtech, hardware-manufacturing, real-estate, construction-proptech, climate-energy, retail-ecommerce, logistics-supply-chain, automotive-mobility, travel-hospitality, media-entertainment, sports-fitness-wellness, social-impact-nonprofit, government-civictech

Evaluate and return ONLY valid JSON with this exact schema:
{
  "ideaQualityScore": <integer 0-100>,
  "teamIdeaFitScore": <integer 0-100>,
  "overallViabilityScore": <integer 0-100>,
  "recommendation": "pass" | "watch" | "conditional-proceed" | "proceed",
  "timeToFirstCustomer": "<range string, e.g. '3-6 months'>",
  "narrative": "<3-5 sentence plain English summary. Must name the single biggest risk in the first sentence. Must not use the words 'innovative', 'exciting', 'promising', or 'potential'.>",
  "reasoning": {
    "ideaQuality": {
      "problemClarity": <integer 0-10>,
      "marketOpportunity": <integer 0-10>,
      "competitiveLandscape": <integer 0-10>,
      "defensibility": <integer 0-10>,
      "revenueModel": <integer 0-10>,
      "notes": "<string. Must identify the most likely reason this idea fails, not general observations.>"
    },
    "teamFit": {
      "skillAlignment": <integer 0-10>,
      "domainExperience": <integer 0-10>,
      "founderMarketFit": <integer 0-10>,
      "executionRisk": <integer 0-10>,
      "gaps": ["<gap string — be specific: not 'needs sales' but 'no one on team has sold to enterprise procurement before'>"],
      "notes": "<string>"
    },
    "timeEstimate": {
      "optimistic": "<string>",
      "realistic": "<string>",
      "pessimistic": "<string>",
      "keyRisks": ["<risk string>"],
      "blockers": ["<what must be true for the optimistic case to hold>"]
    },
    "marketSizing": {
      "tam": "<string — total addressable market, e.g. '$4B global SMB payroll software'>",
      "sam": "<string — serviceable addressable market>",
      "initialWedge": "<string — the specific first beachhead customer segment>"
    },
    "requiredSkills": ["<exact skill key from taxonomy above>"],
    "missingSkills": ["<exact skill key — skills required but absent from the team>"],
    "competitorFlags": ["<named competitor or category, e.g. 'Rippling already does this for SMBs'>"]
  }
}

requiredSkills must list every skill key from the taxonomy that this idea genuinely needs to succeed — typically 4 to 10 keys spanning technical, business, and domain categories. Only use exact key strings from the taxonomy above.

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
    2,
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
  members: MemberWithProfile[],
): Promise<AIScoreResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
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

  let raw = (message.content[0] as Anthropic.TextBlock).text.trim();

  // Strip markdown code fences if the model wraps the output despite instructions.
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Claude returned non-JSON response: ${raw.slice(0, 300)}`);
  }

  return validateAndNormalize(parsed);
}
