import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: { profile: true },
  });
  if (!member?.profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contact = await prisma.contact.findFirst({
    where: { id, profileId: member.profile.id },
  });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
