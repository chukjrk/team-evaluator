import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const visibilitySchema = z.object({
  visibility: z.enum(["PRIVATE", "WORKSPACE", "SHARED"]),
});

export async function PATCH(
  req: NextRequest,
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
  if (idea.submitterId !== member.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = visibilitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.idea.update({
    where: { id },
    data: { visibility: parsed.data.visibility },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      score: true,
    },
  });

  return NextResponse.json(updated);
}
