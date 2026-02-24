export const SKILLS_TAXONOMY = {
  technical: [
    "full-stack-dev",
    "mobile-dev",
    "ml-ai",
    "data-engineering",
    "devops-infra",
    "product-design-ux",
    "cybersecurity",
  ],
  business: [
    "sales",
    "marketing-growth",
    "finance-accounting",
    "operations",
    "fundraising-ir",
    "legal-compliance",
    "customer-success",
  ],
  domain: [
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
  "devops-infra": "DevOps / Infrastructure",
  "product-design-ux": "Product Design / UX",
  cybersecurity: "Cybersecurity",
  // Business
  sales: "Sales",
  "marketing-growth": "Marketing / Growth",
  "finance-accounting": "Finance / Accounting",
  operations: "Operations",
  "fundraising-ir": "Fundraising / Investor Relations",
  "legal-compliance": "Legal / Compliance",
  "customer-success": "Customer Success",
  // Domain
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
};

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  technical: "Technical",
  business: "Business",
  domain: "Domain",
};
