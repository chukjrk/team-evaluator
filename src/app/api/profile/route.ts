import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ALL_SKILLS } from "@/lib/constants/skills";

const profileSchema = z.object({
  background: z.string().max(2000),
  skills: z.array(z.enum([...ALL_SKILLS] as [string, ...string[]])),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: {
      profile: { include: { networkEntries: true } },
    },
  });

  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  return NextResponse.json(member.profile ?? null);
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const profile = await prisma.cofounderProfile.upsert({
    where: { memberId: member.id },
    create: {
      memberId: member.id,
      background: parsed.data.background,
      skills: parsed.data.skills,
    },
    update: {
      background: parsed.data.background,
      skills: parsed.data.skills,
    },
    include: { networkEntries: true },
  });

  return NextResponse.json(profile);
}
