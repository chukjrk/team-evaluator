import Anthropic from "@anthropic-ai/sdk";
import type { Idea } from "@prisma/client";
import type { TavilySearchSet } from "@/lib/tavily";
import type { MarketResearchResult, MarketResearchSection, MarketResearchTopic } from "@/lib/types/market-research";

const TOPIC_LABELS: Record<MarketResearchTopic, string> = {
  "customer-pain": "Customer Pain & Behavioral Evidence",
  "existing-solutions": "Existing Solutions & Workarounds",
  "market-size": "Market Size & Growth Signals",
  "competitor-landscape": "Competitor Landscape",
};

const SYSTEM_PROMPT = `You are a market research analyst helping early-stage startup founders understand their market.
You will receive a startup idea and web search results across several topics.
For each topic that has search results, write a concise 2-4 sentence synthesis that:
- Names specific signals, tools, or companies found in the sources
- Draws conclusions relevant to whether this startup has a viable market
- Is direct and honest — do not speculate beyond what the sources show

Return ONLY valid JSON with this schema:
{
  "sections": [
    { "topic": "<topic-id>", "synthesis": "<2-4 sentence synthesis>" }
  ]
}

Include one entry per topic that has search results. Do not include any text outside the JSON.`;

function buildResearchPayload(idea: Idea, searchSets: TavilySearchSet[]): string {
  const sections = searchSets
    .filter((s) => s.results.length > 0)
    .map((s) => ({
      topic: s.topic,
      label: TOPIC_LABELS[s.topic],
      query: s.query,
      results: s.results.map((r) => ({
        title: r.title,
        snippet: r.snippet,
        url: r.url,
      })),
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
      },
      searchResults: sections,
    },
    null,
    2
  );
}

export async function generateMarketResearch(
  idea: Idea,
  searchSets: TavilySearchSet[]
): Promise<MarketResearchResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildResearchPayload(idea, searchSets),
      },
    ],
  });

  let raw = (message.content[0] as Anthropic.TextBlock).text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  let parsed: { sections: Array<{ topic: MarketResearchTopic; synthesis: string }> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Market research returned non-JSON: ${raw.slice(0, 200)}`);
  }

  const synthesisByTopic = new Map(parsed.sections.map((s) => [s.topic, s.synthesis]));

  const sections: MarketResearchSection[] = searchSets
    .filter((s) => s.results.length > 0)
    .map((s) => ({
      topic: s.topic,
      query: s.query,
      synthesis: synthesisByTopic.get(s.topic) ?? "",
      sources: s.results,
    }));

  return {
    generatedAt: new Date().toISOString(),
    sections,
  };
}
