import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeFullScore } from "@/lib/scoring";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { NetworkEntry } from "@prisma/client";

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

  // Only submitter can trigger evaluation
  if (idea.submitterId !== member.id) {
    return NextResponse.json({ error: "Only the idea submitter can evaluate" }, { status: 403 });
  }

  // Fetch all workspace members with profiles + network entries
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: member.workspaceId },
    include: {
      profile: {
        include: { networkEntries: true },
      },
    },
  });

  // Flatten all network entries across all members
  const allNetworkEntries: NetworkEntry[] = workspaceMembers.flatMap(
    (m) => m.profile?.networkEntries ?? []
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
        }
      : null,
  }));

  let scoreResult;
  try {
    scoreResult = await computeFullScore(idea, typedMembers, allNetworkEntries);
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
      compositeScore: scoreResult.compositeScore,
      timeToFirstCustomer: scoreResult.timeToFirstCustomer,
      aiNarrative: scoreResult.aiNarrative,
      aiReasoning: scoreResult.aiReasoning as object,
      generatedAt: new Date(),
    },
  });

  return NextResponse.json(score);
}
