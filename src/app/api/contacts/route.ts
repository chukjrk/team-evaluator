import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRY_IDS } from "@/lib/constants/industries";

const createContactSchema = z.object({
  name: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  domain: z.string().max(253).optional(),
  position: z.string().max(200).optional(),
  industryId: z
    .string()
    .refine((v) => (INDUSTRY_IDS as readonly string[]).includes(v), {
      message: "Invalid industry",
    })
    .optional(),
  connectionStrength: z.enum(["WARM", "MODERATE", "COLD"]),
});

async function getMemberProfile(userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: { profile: true },
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await getMemberProfile(userId);
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  if (!member.profile) return NextResponse.json([]);

  const contacts = await prisma.contact.findMany({
    where: { profileId: member.profile.id },
    include: { industry: { select: { id: true, label: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await getMemberProfile(userId);
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  if (!member.profile) {
    return NextResponse.json({ error: "Complete your profile first" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contact = await prisma.contact.create({
    data: {
      ...parsed.data,
      source: "MANUAL",
      embedding: [],
      profileId: member.profile.id,
    },
    include: { industry: { select: { id: true, label: true } } },
  });

  return NextResponse.json(contact, { status: 201 });
}
