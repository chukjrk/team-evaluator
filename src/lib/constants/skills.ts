export const SKILLS_TAXONOMY = {
  technical: [
    "full-stack-dev",
    "mobile-dev",
    "ml-ai",
    "data-engineering",
    "data-science-analytics",
    "devops-infra",
    "product-design-ux",
    "cybersecurity",
    "blockchain-web3",
    "ar-vr-spatial",
    "embedded-iot",
  ],
  business: [
    "sales",
    "marketing-growth",
    "finance-accounting",
    "operations",
    "product-management",
    "fundraising-ir",
    "legal-compliance",
    "customer-success",
    "hr-people-ops",
    "supply-chain-mgmt",
    "partnerships-bizdev",
    "brand-comms",
  ],
  domain: [
    // Technology
    "healthcare-medtech",
    "fintech-banking",
    "edtech",
    "enterprise-saas",
    "consumer-apps",
    "biotech-pharma",
    // People & Workforce
    "workforce-hrtech",
    "future-of-work",
    // Food & Agriculture
    "food-beverage",
    "foodtech-restauranttech",
    "agriculture-agtech",
    // Built World
    "hardware-manufacturing",
    "real-estate",
    "construction-proptech",
    "climate-energy",
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
  ],
} as const;

export type SkillCategory = keyof typeof SKILLS_TAXONOMY;
export type SkillKey =
  (typeof SKILLS_TAXONOMY)[SkillCategory][number];

export const ALL_SKILLS: SkillKey[] = [
  ...SKILLS_TAXONOMY.technical,
  ...SKILLS_TAXONOMY.business,
  ...SKILLS_TAXONOMY.domain,
];

export const SKILL_LABELS: Record<SkillKey, string> = {
  // Technical
  "full-stack-dev": "Full-Stack Development",
  "mobile-dev": "Mobile Development",
  "ml-ai": "Machine Learning / AI",
  "data-engineering": "Data Engineering",
  "data-science-analytics": "Data Science / Analytics",
  "devops-infra": "DevOps / Infrastructure",
  "product-design-ux": "Product Design / UX",
  cybersecurity: "Cybersecurity",
  "blockchain-web3": "Blockchain / Web3",
  "ar-vr-spatial": "AR / VR / Spatial",
  "embedded-iot": "Embedded Systems / IoT",
  // Business
  sales: "Sales",
  "marketing-growth": "Marketing / Growth",
  "finance-accounting": "Finance / Accounting",
  operations: "Operations",
  "product-management": "Product Management",
  "fundraising-ir": "Fundraising / Investor Relations",
  "legal-compliance": "Legal / Compliance",
  "customer-success": "Customer Success",
  "hr-people-ops": "HR / People Operations",
  "supply-chain-mgmt": "Supply Chain Management",
  "partnerships-bizdev": "Partnerships / Biz Dev",
  "brand-comms": "Brand & Communications",
  // Domain — Technology
  "healthcare-medtech": "Healthcare / MedTech",
  "fintech-banking": "Fintech / Banking",
  edtech: "EdTech",
  "enterprise-saas": "Enterprise SaaS",
  "consumer-apps": "Consumer Apps",
  "biotech-pharma": "Biotech / Pharma",
  // Domain — People & Workforce
  "workforce-hrtech": "Workforce / HR Tech",
  "future-of-work": "Future of Work",
  // Domain — Food & Agriculture
  "food-beverage": "Food & Beverage",
  "foodtech-restauranttech": "FoodTech / RestaurantTech",
  "agriculture-agtech": "Agriculture / AgTech",
  // Domain — Built World
  "hardware-manufacturing": "Hardware / Manufacturing",
  "real-estate": "Real Estate",
  "construction-proptech": "Construction / PropTech",
  "climate-energy": "Climate / Energy",
  // Domain — Commerce & Retail
  "retail-ecommerce": "Retail / E-Commerce",
  "logistics-supply-chain": "Logistics / Supply Chain",
  "automotive-mobility": "Automotive / Mobility",
  "travel-hospitality": "Travel / Hospitality",
  // Domain — Media & Community
  "media-entertainment": "Media / Entertainment",
  "sports-fitness-wellness": "Sports / Fitness / Wellness",
  "social-impact-nonprofit": "Social Impact / Nonprofit",
  "government-civictech": "Government / Civic Tech",
};

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  technical: "Technical",
  business: "Business",
  domain: "Domain",
};
