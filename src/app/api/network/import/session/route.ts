import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getMember(userId: string) {
  return prisma.workspaceMember.findFirst({ where: { clerkUserId: userId } });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await getMember(userId);
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const session = await prisma.networkImportSession.findFirst({
    where: { memberId: member.id, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });

  return NextResponse.json({ groups: session?.groups ?? null });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await getMember(userId);
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  await prisma.networkImportSession.deleteMany({ where: { memberId: member.id } });

  return NextResponse.json({ ok: true });
}
