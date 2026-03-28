import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reEvaluateIdea } from "@/lib/scoring/reeval";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { StoredValidationPlan, ValidationStep } from "@/lib/types/validation";

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
    include: { score: true },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!idea.score) {
    return NextResponse.json(
      { error: "Idea must be evaluated before re-evaluation" },
      { status: 400 }
    );
  }

  const validationPlan = await prisma.validationPlan.findUnique({
    where: { ideaId: id },
  });
  if (!validationPlan) {
    return NextResponse.json(
      { error: "Validation plan required before re-evaluation" },
      { status: 400 }
    );
  }

  const planContent = validationPlan.content as unknown as StoredValidationPlan;
  const allSteps = planContent.validationSteps as ValidationStep[];
  const completedSteps = allSteps.filter((s) => s.completed);

  // Require at least 50% of steps completed
  if (completedSteps.length / allSteps.length < 0.5) {
    return NextResponse.json(
      { error: `Complete at least ${Math.ceil(allSteps.length * 0.5)} of ${allSteps.length} validation steps before re-evaluating` },
      { status: 400 }
    );
  }

  // Require at least one step to have non-empty notes
  const hasNotes = completedSteps.some(
    (s) => s.supportingNotes?.trim() || s.contradictingNotes?.trim()
  );
  if (!hasNotes) {
    return NextResponse.json(
      { error: "Add notes to at least one completed step before re-evaluating" },
      { status: 400 }
    );
  }

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

  let reevalResult;
  try {
    reevalResult = await reEvaluateIdea(idea, typedMembers, idea.score, completedSteps);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Re-evaluation failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const updatedScore = await prisma.ideaScore.update({
    where: { ideaId: id },
    data: {
      reevalScore: reevalResult as object,
      reevalAt: new Date(),
    },
  });

  return NextResponse.json(updatedScore);
}
