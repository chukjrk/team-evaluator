import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });

  if (!member) {
    return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: member.workspaceId },
    include: {
      profile: {
        include: { networkEntries: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(members);
}
