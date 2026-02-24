import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: { workspace: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const inviteUrl = `${protocol}://${host}/join?token=${member.workspace.inviteToken}`;

  return NextResponse.json({
    inviteUrl,
    workspaceName: member.workspace.name,
    token: member.workspace.inviteToken,
  });
}
