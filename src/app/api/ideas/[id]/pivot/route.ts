import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePivotPlan } from "@/lib/scoring/pivot";
import type { MemberWithProfile } from "@/lib/types/profile";

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
      { error: "Idea must be evaluated before generating a pivot analysis" },
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

  let pivotPlan;
  try {
    pivotPlan = await generatePivotPlan(idea, idea.score, typedMembers);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pivot analysis failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const updated = await prisma.ideaScore.update({
    where: { ideaId: id },
    data: {
      pivotPlan: pivotPlan as object,
      pivotAt: new Date(),
    },
  });

  return NextResponse.json({ pivotPlan: updated.pivotPlan, pivotAt: updated.pivotAt });
}
