import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/constants/industries";
import type { CategorizedGroup } from "@/lib/types/import";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_INDUSTRIES: Set<string> = new Set(INDUSTRIES);

function stripFences(raw: string): string {
  if (raw.startsWith("```")) {
    return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return raw;
}

/**
 * Classifies company domains → industry keys.
 * Checks CompanyIndustryCache first; only sends uncached companies to Claude.
 * Writes new results back to cache before returning.
 *
 * @param domains - unique company domain strings (e.g. "stripe.com")
 * @returns Map of domain → industry key
 */
export async function classifyCompanyDomains(
  domains: string[],
): Promise<Map<string, string>> {
  if (domains.length === 0) return new Map();

  // Check cache
  const cached = await prisma.companyIndustryCache.findMany({
    where: { domain: { in: domains } },
  });

  const resultMap = new Map<string, string>(
    cached.map((c) => [c.domain, c.industry]),
  );

  const uncached = domains.filter((d) => !resultMap.has(d));

  if (uncached.length > 0) {
    // Process in chunks of 40 so the JSON response never exceeds token limits
    const CHUNK_SIZE = 40;
    const industryList = INDUSTRIES.join(", ");
    const toCache: Array<{ domain: string; industry: string }> = [];

    for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
      const chunk = uncached.slice(i, i + CHUNK_SIZE);
      const companyList = chunk.join(", ");

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Given these company domains, classify each into the most appropriate industry key.

Valid industry keys: ${industryList}

Company domains to classify: ${companyList}

Return ONLY a valid JSON object mapping each domain to an industry key. Use "other" only if truly no key fits.
Example: {"stripe.com": "fintech-banking", "notion.so": "enterprise-saas", "clevelandclinic.org": "healthcare-medtech"}

Do not include any text outside the JSON object.`,
          },
        ],
      });

      let raw = (message.content[0] as Anthropic.TextBlock).text.trim();
      raw = stripFences(raw);

      let parsed: Record<string, string>;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = Object.fromEntries(chunk.map((d) => [d, "other"]));
      }

      for (const domain of chunk) {
        const industry = VALID_INDUSTRIES.has(parsed[domain])
          ? parsed[domain]
          : "other";
        resultMap.set(domain, industry);
        toCache.push({ domain, industry });
      }
    }

    // Write to cache (upsert to handle races)
    if (toCache.length > 0) {
      await Promise.all(
        toCache.map((entry) =>
          prisma.companyIndustryCache.upsert({
            where: { domain: entry.domain },
            create: entry,
            update: { industry: entry.industry, cachedAt: new Date() },
          }),
        ),
      );
    }
  }

  return resultMap;
}

/**
 * Groups company+position pairs by industry, inferring roles.
 * Used for both Google explicit contacts and LinkedIn CSV rows.
 *
 * @param rows - array of {company, position} objects
 * @returns CategorizedGroup[] with connectionStrength omitted (caller sets it)
 */
export async function classifyContactGroups(
  rows: { company: string; position: string }[],
): Promise<Omit<CategorizedGroup, "connectionStrength">[]> {
  if (rows.length === 0) return [];

  const industryList = INDUSTRIES.join(", ");
  const rowsJson = JSON.stringify(rows.slice(0, 500));

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Given these contacts (company and position pairs), group them by industry and summarize.

Valid industry keys: ${industryList}

Contacts: ${rowsJson}

Return ONLY a valid JSON array of groups. Each group must have:
- industry: one of the valid industry keys
- estimatedContacts: integer count of contacts in this group
- notableRoles: array of up to 5 distinct role types observed (e.g. ["Software Engineers", "Product Managers"])

The total estimatedContacts across all groups must equal ${Math.min(rows.length, 500)}.
Use "other" for companies that don't fit any industry key.
Merge similar industries — prefer fewer, larger groups over many small ones.

Do not include any text outside the JSON array.`,
      },
    ],
  });

  let raw = (message.content[0] as Anthropic.TextBlock).text.trim();
  raw = stripFences(raw);

  let parsed: Array<{
    industry: string;
    estimatedContacts: number;
    notableRoles: string[];
  }>;

  try {
    parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Not an array");
  } catch {
    return [
      {
        industry: "other",
        estimatedContacts: Math.min(rows.length, 500),
        notableRoles: [],
      },
    ];
  }

  return parsed
    .filter((g) => typeof g.industry === "string" && typeof g.estimatedContacts === "number")
    .map((g) => ({
      industry: VALID_INDUSTRIES.has(g.industry) ? g.industry : "other",
      estimatedContacts: Math.max(0, Math.round(g.estimatedContacts)),
      notableRoles: Array.isArray(g.notableRoles) ? g.notableRoles.slice(0, 10) : [],
    }));
}
