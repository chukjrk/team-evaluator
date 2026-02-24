import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/constants/industries";

const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  problemStatement: z.string().min(10).max(2000).optional(),
  targetCustomer: z.string().min(5).max(500).optional(),
  industry: z.enum([...INDUSTRIES] as [string, ...string[]]).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

async function resolveIdea(userId: string, ideaId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return { error: "Not a workspace member", status: 403 as const };

  const idea = await prisma.idea.findFirst({
    where: { id: ideaId, workspaceId: member.workspaceId },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      score: true,
    },
  });
  if (!idea) return { error: "Not found", status: 404 as const };

  return { idea, member };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await resolveIdea(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const { idea, member } = result;

  // Visibility check: private ideas only visible to submitter
  if (idea.visibility === "PRIVATE" && idea.submitterId !== member.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(idea);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await resolveIdea(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const { idea, member } = result;
  if (idea.submitterId !== member.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.idea.update({
    where: { id },
    data: parsed.data,
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      score: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await resolveIdea(userId, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const { idea, member } = result;
  if (idea.submitterId !== member.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.idea.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
