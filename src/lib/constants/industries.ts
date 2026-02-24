export const INDUSTRIES = [
  "healthcare-medtech",
  "fintech-banking",
  "edtech",
  "enterprise-saas",
  "consumer-apps",
  "hardware-manufacturing",
  "real-estate",
  "logistics-supply-chain",
  "climate-energy",
  "media-entertainment",
  "other",
] as const;

export type IndustryKey = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABELS: Record<IndustryKey, string> = {
  "healthcare-medtech": "Healthcare / MedTech",
  "fintech-banking": "Fintech / Banking",
  edtech: "EdTech",
  "enterprise-saas": "Enterprise SaaS",
  "consumer-apps": "Consumer Apps",
  "hardware-manufacturing": "Hardware / Manufacturing",
  "real-estate": "Real Estate",
  "logistics-supply-chain": "Logistics / Supply Chain",
  "climate-energy": "Climate / Energy",
  "media-entertainment": "Media / Entertainment",
  other: "Other",
};
