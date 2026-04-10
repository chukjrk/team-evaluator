-- AlterTable
ALTER TABLE "IdeaScore" ADD COLUMN     "desperationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pivotAt" TIMESTAMP(3),
ADD COLUMN     "pivotPlan" JSONB;
