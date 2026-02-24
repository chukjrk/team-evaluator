import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/constants/industries";

const updateSchema = z.object({
  industry: z.enum([...INDUSTRIES] as [string, ...string[]]).optional(),
  estimatedContacts: z.number().int().min(0).max(1_000_000).optional(),
  notableRoles: z.array(z.string().max(50)).max(10).optional(),
  connectionStrength: z.enum(["WARM", "MODERATE", "COLD"]).optional(),
});

async function resolveOwnership(userId: string, entryId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: { profile: true },
  });
  if (!member?.profile) return null;

  const entry = await prisma.networkEntry.findFirst({
    where: { id: entryId, profileId: member.profile.id },
  });
  return entry;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await resolveOwnership(userId, id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.networkEntry.update({
    where: { id },
    data: parsed.data,
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
  const entry = await resolveOwnership(userId, id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.networkEntry.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
