import type { Contact, NetworkEntry } from "@prisma/client";
import { clamp } from "@/lib/utils";

const STRENGTH_MULTIPLIER: Record<string, number> = {
  WARM: 1.0,
  MODERATE: 0.6,
  COLD: 0.25,
};

// Contacts needed to hit ~100% of the size score (log scale)
const CONTACT_SCALE = 500;

/**
 * Score from aggregated NetworkEntry records (legacy / manual aggregate entries).
 * Each entry represents an estimated count of contacts in an industry.
 */
export function computeNetworkScore(
  allEntries: NetworkEntry[],
  ideaIndustryId: string
): number {
  if (allEntries.length === 0) return 0;

  // Step 1: Strength-weighted total contacts
  const weightedTotal = allEntries.reduce((sum, entry) => {
    const multiplier = STRENGTH_MULTIPLIER[entry.connectionStrength] ?? 0.25;
    return sum + entry.estimatedContacts * multiplier;
  }, 0);

  if (weightedTotal === 0) return 0;

  // Step 2: Size score via log scale (avoids runaway scores)
  const sizeScore =
    Math.min(
      Math.log10(weightedTotal + 1) / Math.log10(CONTACT_SCALE + 1),
      1
    ) * 100;

  // Step 3: Relevance — fraction of weighted contacts in the idea's industry
  const relevantWeighted = allEntries
    .filter((e) => e.industryId === ideaIndustryId)
    .reduce((sum, e) => {
      const multiplier = STRENGTH_MULTIPLIER[e.connectionStrength] ?? 0.25;
      return sum + e.estimatedContacts * multiplier;
    }, 0);

  const relevanceRatio = relevantWeighted / weightedTotal;

  // Step 4: Blend — 60% size, 40% relevance
  const rawScore = 0.6 * sizeScore + 0.4 * (relevanceRatio * 100);
  return clamp(rawScore, 0, 100);
}

/**
 * Score from individual Contact records (each record = 1 real person).
 */
export function computeNetworkScoreFromContacts(
  contacts: Contact[],
  ideaIndustryId: string
): number {
  if (contacts.length === 0) return 0;

  // Step 1: Strength-weighted total (each contact = 1 person)
  const weightedTotal = contacts.reduce((sum, c) => {
    const multiplier = STRENGTH_MULTIPLIER[c.connectionStrength] ?? 0.25;
    return sum + multiplier;
  }, 0);

  if (weightedTotal === 0) return 0;

  // Step 2: Size score via log scale
  const sizeScore =
    Math.min(
      Math.log10(weightedTotal + 1) / Math.log10(CONTACT_SCALE + 1),
      1
    ) * 100;

  // Step 3: Relevance — fraction of weighted contacts in the idea's industry
  const relevantWeighted = contacts
    .filter((c) => c.industryId === ideaIndustryId)
    .reduce((sum, c) => {
      const multiplier = STRENGTH_MULTIPLIER[c.connectionStrength] ?? 0.25;
      return sum + multiplier;
    }, 0);

  const relevanceRatio = relevantWeighted / weightedTotal;

  // Step 4: Blend — 60% size, 40% relevance
  const rawScore = 0.6 * sizeScore + 0.4 * (relevanceRatio * 100);
  return clamp(rawScore, 0, 100);
}

/**
 * Hybrid scorer: prefers individual Contact records when available,
 * falls back to aggregated NetworkEntry records for backward compatibility.
 */
export function computeNetworkScoreHybrid(
  contacts: Contact[],
  entries: NetworkEntry[],
  ideaIndustryId: string
): number {
  if (contacts.length > 0) {
    return computeNetworkScoreFromContacts(contacts, ideaIndustryId);
  }
  return computeNetworkScore(entries, ideaIndustryId);
}
