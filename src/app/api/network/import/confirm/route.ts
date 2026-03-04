import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/constants/industries";

const groupSchema = z.object({
  industry: z.enum([...INDUSTRIES] as [string, ...string[]]),
  estimatedContacts: z.number().int().min(0).max(1_000_000),
  notableRoles: z.array(z.string().max(50)).max(10),
  connectionStrength: z.enum(["WARM", "MODERATE", "COLD"]),
});

const bodySchema = z.object({
  groups: z.array(groupSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: { profile: true },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  if (!member.profile) {
    return NextResponse.json({ error: "Complete your profile first" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { groups } = parsed.data;

  await prisma.networkEntry.createMany({
    data: groups.map((g) => ({
      ...g,
      profileId: member.profile!.id,
    })),
  });

  // Delete import session(s) for this member
  await prisma.networkImportSession.deleteMany({ where: { memberId: member.id } });

  return NextResponse.json({ created: groups.length });
}
