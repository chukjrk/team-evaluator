import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const industries = [
  // Technology
  { id: "enterprise-saas", label: "Enterprise SaaS" },
  { id: "consumer-apps", label: "Consumer Apps" },
  { id: "fintech-banking", label: "Fintech / Banking" },
  { id: "edtech", label: "EdTech" },
  { id: "healthcare-medtech", label: "Healthcare / MedTech" },
  { id: "biotech-pharma", label: "Biotech / Pharma" },
  // People & Workforce
  { id: "workforce-hrtech", label: "Workforce / HR Tech" },
  { id: "future-of-work", label: "Future of Work" },
  // Food & Agriculture
  { id: "food-beverage", label: "Food & Beverage" },
  { id: "foodtech-restauranttech", label: "FoodTech / RestaurantTech" },
  { id: "agriculture-agtech", label: "Agriculture / AgTech" },
  // Built World
  { id: "real-estate", label: "Real Estate" },
  { id: "construction-proptech", label: "Construction / PropTech" },
  { id: "climate-energy", label: "Climate / Energy" },
  { id: "hardware-manufacturing", label: "Hardware / Manufacturing" },
  // Commerce & Retail
  { id: "retail-ecommerce", label: "Retail / E-Commerce" },
  { id: "logistics-supply-chain", label: "Logistics / Supply Chain" },
  { id: "automotive-mobility", label: "Automotive / Mobility" },
  { id: "travel-hospitality", label: "Travel / Hospitality" },
  // Media & Community
  { id: "media-entertainment", label: "Media / Entertainment" },
  { id: "sports-fitness-wellness", label: "Sports / Fitness / Wellness" },
  { id: "social-impact-nonprofit", label: "Social Impact / Nonprofit" },
  { id: "government-civictech", label: "Government / Civic Tech" },
  // Emerging
  { id: "blockchain-web3", label: "Blockchain / Web3" },
  { id: "ar-vr-spatial", label: "AR / VR / Spatial" },
  // Catch-all
  { id: "other", label: "Other" },
];

async function main() {
  await prisma.industry.createMany({
    data: industries,
    skipDuplicates: true,
  });
  console.log(`Seeded ${industries.length} industries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
