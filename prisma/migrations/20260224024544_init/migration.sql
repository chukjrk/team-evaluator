-- CreateEnum
CREATE TYPE "ConnectionStrength" AS ENUM ('WARM', 'MODERATE', 'COLD');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'SHARED');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CofounderProfile" (
    "id" TEXT NOT NULL,
    "background" TEXT NOT NULL DEFAULT '',
    "skills" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "CofounderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkEntry" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "estimatedContacts" INTEGER NOT NULL,
    "notableRoles" TEXT[],
    "connectionStrength" "ConnectionStrength" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "NetworkEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "targetCustomer" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "notes" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaScore" (
    "id" TEXT NOT NULL,
    "teamSkillScore" DOUBLE PRECISION NOT NULL,
    "networkScore" DOUBLE PRECISION NOT NULL,
    "ideaQualityScore" DOUBLE PRECISION NOT NULL,
    "teamIdeaFitScore" DOUBLE PRECISION NOT NULL,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "timeToFirstCustomer" TEXT NOT NULL,
    "aiNarrative" TEXT NOT NULL,
    "aiReasoning" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelVersion" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "ideaId" TEXT NOT NULL,

    CONSTRAINT "IdeaScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_inviteToken_key" ON "Workspace"("inviteToken");

-- CreateIndex
CREATE INDEX "WorkspaceMember_clerkUserId_idx" ON "WorkspaceMember"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_clerkUserId_key" ON "WorkspaceMember"("workspaceId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CofounderProfile_memberId_key" ON "CofounderProfile"("memberId");

-- CreateIndex
CREATE INDEX "Idea_workspaceId_visibility_idx" ON "Idea"("workspaceId", "visibility");

-- CreateIndex
CREATE INDEX "Idea_submitterId_idx" ON "Idea"("submitterId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaScore_ideaId_key" ON "IdeaScore"("ideaId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CofounderProfile" ADD CONSTRAINT "CofounderProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "WorkspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkEntry" ADD CONSTRAINT "NetworkEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CofounderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "WorkspaceMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaScore" ADD CONSTRAINT "IdeaScore_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
