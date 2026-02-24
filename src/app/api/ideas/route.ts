import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/constants/industries";

const createIdeaSchema = z.object({
  title: z.string().min(3).max(100),
  problemStatement: z.string().min(10).max(2000),
  targetCustomer: z.string().min(5).max(500),
  industry: z.enum([...INDUSTRIES] as [string, ...string[]]),
  notes: z.string().max(1000).optional(),
  visibility: z.enum(["PRIVATE", "WORKSPACE"]).default("PRIVATE"),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const ideas = await prisma.idea.findMany({
    where: {
      workspaceId: member.workspaceId,
      OR: [
        { visibility: "WORKSPACE" },
        { submitterId: member.id },
      ],
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      score: true,
    },
    orderBy: [
      { score: { compositeScore: "desc" } },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const body = await req.json();
  const parsed = createIdeaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const idea = await prisma.idea.create({
    data: {
      ...parsed.data,
      workspaceId: member.workspaceId,
      submitterId: member.id,
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      score: true,
    },
  });

  return NextResponse.json(idea, { status: 201 });
}
