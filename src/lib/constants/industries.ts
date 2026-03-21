// Industry IDs — these are the slugs used as PKs in the Industry table.
// Labels are stored in the DB; use GET /api/industries for UI display.
export const INDUSTRY_IDS = [
  // Technology
  "enterprise-saas",
  "consumer-apps",
  "fintech-banking",
  "edtech",
  "healthcare-medtech",
  "biotech-pharma",
  // People & Workforce
  "workforce-hrtech",
  "future-of-work",
  // Food & Agriculture
  "food-beverage",
  "foodtech-restauranttech",
  "agriculture-agtech",
  // Built World
  "real-estate",
  "construction-proptech",
  "climate-energy",
  "hardware-manufacturing",
  // Commerce & Retail
  "retail-ecommerce",
  "logistics-supply-chain",
  "automotive-mobility",
  "travel-hospitality",
  // Media & Community
  "media-entertainment",
  "sports-fitness-wellness",
  "social-impact-nonprofit",
  "government-civictech",
  // Emerging
  "blockchain-web3",
  "ar-vr-spatial",
  // Catch-all
  "other",
] as const;

export type IndustryId = (typeof INDUSTRY_IDS)[number];
