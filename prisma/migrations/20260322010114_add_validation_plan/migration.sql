-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "embedding" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ValidationPlan" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelVersion" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "ideaId" TEXT NOT NULL,
    "triggeredById" TEXT NOT NULL,

    CONSTRAINT "ValidationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValidationPlan_ideaId_key" ON "ValidationPlan"("ideaId");

-- AddForeignKey
ALTER TABLE "ValidationPlan" ADD CONSTRAINT "ValidationPlan_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationPlan" ADD CONSTRAINT "ValidationPlan_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "WorkspaceMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
