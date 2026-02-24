import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — returns workspace name for a given invite token
// Used by the /join page to show the workspace name before user accepts
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { inviteToken: token },
    select: { name: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  return NextResponse.json({ name: workspace.name });
}
