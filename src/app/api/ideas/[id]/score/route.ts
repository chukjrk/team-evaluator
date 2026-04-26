import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeFullScore } from "@/lib/scoring";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { Contact, NetworkEntry } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const idea = await prisma.idea.findFirst({
    where: { id, workspaceId: member.workspaceId },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch all workspace members with profiles, network entries, and contacts
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: member.workspaceId },
    include: {
      profile: {
        include: {
          networkEntries: { include: { industry: { select: { id: true, label: true } } } },
          contacts: true,
        },
      },
    },
  });

  const allNetworkEntries: NetworkEntry[] = workspaceMembers.flatMap(
    (m) => m.profile?.networkEntries ?? []
  );

  const allContacts: Contact[] = workspaceMembers.flatMap(
    (m) => m.profile?.contacts ?? []
  );

  const typedMembers: MemberWithProfile[] = workspaceMembers.map((m) => ({
    id: m.id,
    clerkUserId: m.clerkUserId,
    email: m.email,
    name: m.name,
    profile: m.profile
      ? {
          id: m.profile.id,
          background: m.profile.background,
          skills: m.profile.skills as string[],
          updatedAt: m.profile.updatedAt,
          memberId: m.profile.memberId,
          networkEntries: m.profile.networkEntries,
          contacts: m.profile.contacts,
        }
      : null,
  }));

  let scoreResult;
  try {
    scoreResult = await computeFullScore(idea, typedMembers, allNetworkEntries, allContacts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  // Upsert score (replace any existing)
  const score = await prisma.ideaScore.upsert({
    where: { ideaId: id },
    create: {
      ideaId: id,
      teamSkillScore: scoreResult.teamSkillScore,
      networkScore: scoreResult.networkScore,
      ideaQualityScore: scoreResult.ideaQualityScore,
      teamIdeaFitScore: scoreResult.teamIdeaFitScore,
      desperationScore: scoreResult.desperationScore,
      compositeScore: scoreResult.compositeScore,
      timeToFirstCustomer: scoreResult.timeToFirstCustomer,
      aiNarrative: scoreResult.aiNarrative,
      aiReasoning: scoreResult.aiReasoning as object,
    },
    update: {
      teamSkillScore: scoreResult.teamSkillScore,
      networkScore: scoreResult.networkScore,
      ideaQualityScore: scoreResult.ideaQualityScore,
      teamIdeaFitScore: scoreResult.teamIdeaFitScore,
      desperationScore: scoreResult.desperationScore,
      compositeScore: scoreResult.compositeScore,
      timeToFirstCustomer: scoreResult.timeToFirstCustomer,
      aiNarrative: scoreResult.aiNarrative,
      aiReasoning: scoreResult.aiReasoning as object,
      generatedAt: new Date(),
      // Clear stale pivot and market research when re-scoring
      pivotPlan: Prisma.DbNull,
      pivotAt: null,
      marketResearch: Prisma.DbNull,
      marketResearchAt: null,
    },
  });

  return NextResponse.json(score);
}
