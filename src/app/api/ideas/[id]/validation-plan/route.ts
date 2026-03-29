import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateValidationPlan } from "@/lib/scoring/validation";
import type { MemberWithProfile } from "@/lib/types/profile";
import type { StoredValidationPlan } from "@/lib/types/validation";
import type { Contact, NetworkEntry } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const idea = await prisma.idea.findFirst({
    where: { id, workspaceId: member.workspaceId },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plan = await prisma.validationPlan.findUnique({
    where: { ideaId: id },
    include: { triggeredBy: { select: { name: true } } },
  });

  return NextResponse.json(plan ?? null);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let additionalContext: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.additionalContext === "string" && body.additionalContext.trim()) {
      additionalContext = body.additionalContext.trim();
    }
  } catch {
    // body is optional — ignore parse errors
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const idea = await prisma.idea.findFirst({
    where: { id, workspaceId: member.workspaceId },
    include: { score: true },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!idea.score) {
    return NextResponse.json(
      { error: "Idea must be evaluated before generating a validation plan" },
      { status: 400 }
    );
  }

  // Fetch all workspace members with profiles, network entries, and contacts
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: member.workspaceId },
    include: {
      profile: {
        include: {
          networkEntries: { include: { industry: { select: { id: true, label: true } } } },
          contacts: true,
        },
      },
    },
  });

  const allNetworkEntries: NetworkEntry[] = workspaceMembers.flatMap(
    (m) => m.profile?.networkEntries ?? []
  );
  const allContacts: Contact[] = workspaceMembers.flatMap(
    (m) => m.profile?.contacts ?? []
  );

  const typedMembers: MemberWithProfile[] = workspaceMembers.map((m) => ({
    id: m.id,
    clerkUserId: m.clerkUserId,
    email: m.email,
    name: m.name,
    profile: m.profile
      ? {
          id: m.profile.id,
          background: m.profile.background,
          skills: m.profile.skills as string[],
          updatedAt: m.profile.updatedAt,
          memberId: m.profile.memberId,
          networkEntries: m.profile.networkEntries,
          contacts: m.profile.contacts,
        }
      : null,
  }));

  console.log("[validation-plan route] members fetched:", workspaceMembers.length);
  console.log("[validation-plan route] calling generateValidationPlan...");

  let planContent;
  try {
    planContent = await generateValidationPlan(
      idea,
      idea.score,
      typedMembers,
      allContacts,
      allNetworkEntries,
      additionalContext
    );
  } catch (err) {
    console.error("[validation-plan route] generateValidationPlan threw:", err);
    const message = err instanceof Error ? err.message : "Validation plan generation failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  console.log("[validation-plan route] plan generated, upserting to DB...");

  const plan = await prisma.validationPlan.upsert({
    where: { ideaId: id },
    create: {
      ideaId: id,
      triggeredById: member.id,
      content: planContent as object,
    },
    update: {
      triggeredById: member.id,
      content: planContent as object,
      generatedAt: new Date(),
    },
    include: { triggeredBy: { select: { name: true } } },
  });

  return NextResponse.json(plan);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const body = await req.json();
  const { stepOrder, completed, supportingNotes, contradictingNotes, dataSources } = body;
  if (typeof stepOrder !== "number") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (completed !== undefined && typeof completed !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (supportingNotes !== undefined && typeof supportingNotes !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (contradictingNotes !== undefined && typeof contradictingNotes !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (dataSources !== undefined && typeof dataSources !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });

  const idea = await prisma.idea.findFirst({
    where: { id, workspaceId: member.workspaceId },
  });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.validationPlan.findUnique({ where: { ideaId: id } });
  if (!existing) return NextResponse.json({ error: "No validation plan" }, { status: 404 });

  const content = existing.content as unknown as StoredValidationPlan;
  const updatedContent: StoredValidationPlan = {
    ...content,
    validationSteps: content.validationSteps.map((s) => {
      if (s.order !== stepOrder) return s;
      const updated = { ...s };
      if (completed !== undefined) updated.completed = completed;
      if (supportingNotes !== undefined) updated.supportingNotes = supportingNotes;
      if (contradictingNotes !== undefined) updated.contradictingNotes = contradictingNotes;
      if (dataSources !== undefined) updated.dataSources = dataSources;
      return updated;
    }),
  };

  const plan = await prisma.validationPlan.update({
    where: { ideaId: id },
    data: { content: updatedContent as object },
    include: { triggeredBy: { select: { name: true } } },
  });

  return NextResponse.json(plan);
}
