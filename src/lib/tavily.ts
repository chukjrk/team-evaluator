import { tavily } from "@tavily/core";
import type { Idea } from "@prisma/client";

export interface TavilyResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export interface TavilySearchSet {
  topic: "customer-pain" | "existing-solutions" | "market-size" | "competitor-landscape";
  query: string;
  results: TavilyResult[];
}

function truncate(s: string, maxLen = 80): string {
  return s.length > maxLen ? s.slice(0, maxLen).trimEnd() : s;
}

function buildQuery(parts: (string | null | undefined)[], maxLen = 80): string {
  return truncate(parts.filter(Boolean).join(" "), maxLen);
}

async function search(
  client: ReturnType<typeof tavily>,
  topic: TavilySearchSet["topic"],
  query: string
): Promise<TavilySearchSet> {
  try {
    const res = await client.search(query, { maxResults: 5, searchDepth: "basic" });
    const results: TavilyResult[] = (res.results ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: (r.content ?? "").slice(0, 200),
      score: r.score ?? 0,
    }));
    return { topic, query, results };
  } catch {
    return { topic, query, results: [] };
  }
}

function makeClient(): ReturnType<typeof tavily> | null {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    console.warn("[tavily] TAVILY_API_KEY not set — skipping web search");
    return null;
  }
  return tavily({ apiKey: key });
}

export async function runDesperationSearches(idea: Idea): Promise<TavilySearchSet[]> {
  const client = makeClient();
  if (!client) return [];

  const painQuery = buildQuery([
    idea.targetCustomerWho ?? idea.targetCustomer,
    idea.problemStatement,
    "complaints workarounds",
  ]);

  const solutionsQuery = buildQuery([
    idea.targetCustomerWorkaround ?? idea.problemStatement,
    "alternatives tools people use",
  ]);

  return Promise.all([
    search(client, "customer-pain", painQuery),
    search(client, "existing-solutions", solutionsQuery),
  ]);
}

export async function runDeepMarketSearches(idea: Idea): Promise<TavilySearchSet[]> {
  const client = makeClient();
  if (!client) return [];

  const marketQuery = buildQuery([idea.industryId, idea.problemStatement, "market size TAM growth 2024"]);
  const competitorQuery = buildQuery([idea.problemStatement, "software tools competitors alternatives"]);

  return Promise.all([
    search(client, "market-size", marketQuery),
    search(client, "competitor-landscape", competitorQuery),
  ]);
}

export function buildMarketSignalsBlock(searchSets: TavilySearchSet[]): string {
  if (!searchSets.length) return "";

  const lines: string[] = ["REAL-WORLD MARKET SIGNALS (live web search):"];

  for (const set of searchSets) {
    if (!set.results.length) continue;
    lines.push(`\nQuery [${set.topic}]: "${set.query}"`);
    set.results.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.title}`);
      lines.push(`   ${r.snippet}`);
      lines.push(`   Source: ${r.url}`);
    });
  }

  lines.push(
    "\nUse these signals as concrete evidence when scoring desperationSignals and writing desperation.notes."
  );

  return lines.join("\n");
}
