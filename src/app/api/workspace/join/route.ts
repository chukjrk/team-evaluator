import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const joinSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check if already in a workspace
  const existingMember = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (existingMember) {
    return NextResponse.json(
      { error: "Already a member of a workspace" },
      { status: 409 }
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { inviteToken: parsed.data.token },
    include: { members: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
  }

  if (workspace.members.length >= 3) {
    return NextResponse.json(
      { error: "Workspace is full (max 3 members for MVP)" },
      { status: 409 }
    );
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
  const name =
    clerkUser?.fullName ??
    clerkUser?.firstName ??
    email.split("@")[0] ??
    "Cofounder";

  const member = await prisma.workspaceMember.create({
    data: {
      clerkUserId: userId,
      email,
      name,
      workspaceId: workspace.id,
    },
  });

  return NextResponse.json({ member, workspaceName: workspace.name }, { status: 201 });
}
