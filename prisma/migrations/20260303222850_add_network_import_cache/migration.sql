-- CreateTable
CREATE TABLE "CompanyIndustryCache" (
    "domain" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyIndustryCache_pkey" PRIMARY KEY ("domain")
);

-- CreateTable
CREATE TABLE "NetworkImportSession" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "groups" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkImportSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NetworkImportSession" ADD CONSTRAINT "NetworkImportSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "WorkspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
