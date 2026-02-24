import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ideaId } = await params;

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  // Verify the idea belongs to this workspace
  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, workspaceId: member.workspaceId },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const score = await prisma.ideaScore.findUnique({ where: { ideaId } });
  if (!score) return NextResponse.json(null, { status: 200 });

  return NextResponse.json(score);
}
