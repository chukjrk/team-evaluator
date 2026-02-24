import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/constants/industries";

const networkEntrySchema = z.object({
  industry: z.enum([...INDUSTRIES] as [string, ...string[]]),
  estimatedContacts: z.number().int().min(0).max(1_000_000),
  notableRoles: z.array(z.string().max(50)).max(10),
  connectionStrength: z.enum(["WARM", "MODERATE", "COLD"]),
});

async function getMemberProfile(userId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: { profile: true },
  });
  return member;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await getMemberProfile(userId);
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  if (!member.profile) return NextResponse.json([]);

  const entries = await prisma.networkEntry.findMany({
    where: { profileId: member.profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await getMemberProfile(userId);
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  if (!member.profile) return NextResponse.json({ error: "Complete your profile first" }, { status: 409 });

  const body = await req.json();
  const parsed = networkEntrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const entry = await prisma.networkEntry.create({
    data: { ...parsed.data, profileId: member.profile.id },
  });

  return NextResponse.json(entry, { status: 201 });
}
