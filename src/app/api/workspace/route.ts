import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(60),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is already in a workspace
  const existing = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already a member of a workspace" },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";
  const name =
    clerkUser?.fullName ??
    clerkUser?.firstName ??
    email.split("@")[0] ??
    "Cofounder";

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      members: {
        create: {
          clerkUserId: userId,
          email,
          name,
        },
      },
    },
    include: { members: true },
  });

  return NextResponse.json(workspace, { status: 201 });
}

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
    return NextResponse.json(null);
  }

  return NextResponse.json(member.workspace);
}
