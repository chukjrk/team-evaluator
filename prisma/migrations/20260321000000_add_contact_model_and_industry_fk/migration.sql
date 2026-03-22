-- CreateTable: Industry lookup table
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- Seed all 26 industry rows as part of migration (ensures FK integrity)
INSERT INTO "Industry" ("id", "label") VALUES
    ('enterprise-saas',         'Enterprise SaaS'),
    ('consumer-apps',           'Consumer Apps'),
    ('fintech-banking',         'Fintech / Banking'),
    ('edtech',                  'EdTech'),
    ('healthcare-medtech',      'Healthcare / MedTech'),
    ('biotech-pharma',          'Biotech / Pharma'),
    ('workforce-hrtech',        'Workforce / HR Tech'),
    ('future-of-work',          'Future of Work'),
    ('food-beverage',           'Food & Beverage'),
    ('foodtech-restauranttech', 'FoodTech / RestaurantTech'),
    ('agriculture-agtech',      'Agriculture / AgTech'),
    ('real-estate',             'Real Estate'),
    ('construction-proptech',   'Construction / PropTech'),
    ('climate-energy',          'Climate / Energy'),
    ('hardware-manufacturing',  'Hardware / Manufacturing'),
    ('retail-ecommerce',        'Retail / E-Commerce'),
    ('logistics-supply-chain',  'Logistics / Supply Chain'),
    ('automotive-mobility',     'Automotive / Mobility'),
    ('travel-hospitality',      'Travel / Hospitality'),
    ('media-entertainment',     'Media / Entertainment'),
    ('sports-fitness-wellness', 'Sports / Fitness / Wellness'),
    ('social-impact-nonprofit', 'Social Impact / Nonprofit'),
    ('government-civictech',    'Government / Civic Tech'),
    ('blockchain-web3',         'Blockchain / Web3'),
    ('ar-vr-spatial',           'AR / VR / Spatial'),
    ('other',                   'Other');

-- Add industryId columns as nullable first (to handle existing rows safely)
ALTER TABLE "Idea" ADD COLUMN "industryId" TEXT;
ALTER TABLE "NetworkEntry" ADD COLUMN "industryId" TEXT;
ALTER TABLE "CompanyIndustryCache" ADD COLUMN "industryId" TEXT;

-- Backfill industryId from existing industry string column
UPDATE "Idea" SET "industryId" = "industry";
UPDATE "NetworkEntry" SET "industryId" = "industry";
UPDATE "CompanyIndustryCache" SET "industryId" = "industry";

-- Any rows with invalid industry values default to "other"
UPDATE "Idea" SET "industryId" = 'other' WHERE "industryId" NOT IN (SELECT id FROM "Industry");
UPDATE "NetworkEntry" SET "industryId" = 'other' WHERE "industryId" NOT IN (SELECT id FROM "Industry");
UPDATE "CompanyIndustryCache" SET "industryId" = 'other' WHERE "industryId" NOT IN (SELECT id FROM "Industry");

-- Make industryId NOT NULL now that all rows are populated
ALTER TABLE "Idea" ALTER COLUMN "industryId" SET NOT NULL;
ALTER TABLE "NetworkEntry" ALTER COLUMN "industryId" SET NOT NULL;
ALTER TABLE "CompanyIndustryCache" ALTER COLUMN "industryId" SET NOT NULL;

-- Drop old string columns
ALTER TABLE "Idea" DROP COLUMN "industry";
ALTER TABLE "NetworkEntry" DROP COLUMN "industry";
ALTER TABLE "CompanyIndustryCache" DROP COLUMN "industry";

-- Add FK constraints
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_industryId_fkey"
    FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NetworkEntry" ADD CONSTRAINT "NetworkEntry_industryId_fkey"
    FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompanyIndustryCache" ADD CONSTRAINT "CompanyIndustryCache_industryId_fkey"
    FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "NetworkEntry_industryId_idx" ON "NetworkEntry"("industryId");
CREATE INDEX "Idea_industryId_idx" ON "Idea"("industryId");

-- CreateEnum: ContactSource
CREATE TYPE "ContactSource" AS ENUM ('GOOGLE', 'LINKEDIN', 'MANUAL');

-- CreateTable: Contact
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "domain" TEXT,
    "position" TEXT,
    "industryId" TEXT,
    "connectionStrength" "ConnectionStrength" NOT NULL,
    "source" "ContactSource" NOT NULL,
    "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for Contact
CREATE INDEX "Contact_profileId_idx" ON "Contact"("profileId");
CREATE INDEX "Contact_domain_idx" ON "Contact"("domain");
CREATE INDEX "Contact_industryId_idx" ON "Contact"("industryId");

-- AddForeignKey for Contact
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_industryId_fkey"
    FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contact" ADD CONSTRAINT "Contact_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "CofounderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
