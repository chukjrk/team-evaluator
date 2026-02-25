export const INDUSTRIES = [
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

export type IndustryKey = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABELS: Record<IndustryKey, string> = {
  // Technology
  "enterprise-saas": "Enterprise SaaS",
  "consumer-apps": "Consumer Apps",
  "fintech-banking": "Fintech / Banking",
  edtech: "EdTech",
  "healthcare-medtech": "Healthcare / MedTech",
  "biotech-pharma": "Biotech / Pharma",
  // People & Workforce
  "workforce-hrtech": "Workforce / HR Tech",
  "future-of-work": "Future of Work",
  // Food & Agriculture
  "food-beverage": "Food & Beverage",
  "foodtech-restauranttech": "FoodTech / RestaurantTech",
  "agriculture-agtech": "Agriculture / AgTech",
  // Built World
  "real-estate": "Real Estate",
  "construction-proptech": "Construction / PropTech",
  "climate-energy": "Climate / Energy",
  "hardware-manufacturing": "Hardware / Manufacturing",
  // Commerce & Retail
  "retail-ecommerce": "Retail / E-Commerce",
  "logistics-supply-chain": "Logistics / Supply Chain",
  "automotive-mobility": "Automotive / Mobility",
  "travel-hospitality": "Travel / Hospitality",
  // Media & Community
  "media-entertainment": "Media / Entertainment",
  "sports-fitness-wellness": "Sports / Fitness / Wellness",
  "social-impact-nonprofit": "Social Impact / Nonprofit",
  "government-civictech": "Government / Civic Tech",
  // Emerging
  "blockchain-web3": "Blockchain / Web3",
  "ar-vr-spatial": "AR / VR / Spatial",
  // Catch-all
  other: "Other",
};
