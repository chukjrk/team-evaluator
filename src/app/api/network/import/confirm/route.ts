import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INDUSTRY_IDS } from "@/lib/constants/industries";

const groupSchema = z.object({
  industryId: z.string().refine((v) => (INDUSTRY_IDS as readonly string[]).includes(v), {
    message: "Invalid industry",
  }),
  estimatedContacts: z.number().int().min(0).max(1_000_000),
  notableRoles: z.array(z.string().max(50)).max(10),
  connectionStrength: z.enum(["WARM", "MODERATE", "COLD"]),
});

const contactSchema = z.object({
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
  source: z.enum(["GOOGLE", "LINKEDIN", "MANUAL"]),
});

const bodySchema = z.object({
  groups: z.array(groupSchema).min(1).max(100),
  contacts: z.array(contactSchema).max(5000).optional().default([]),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
    include: { profile: true },
  });
  if (!member) return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  if (!member.profile) {
    return NextResponse.json({ error: "Complete your profile first" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { groups, contacts } = parsed.data;

  // Create aggregate NetworkEntry records (kept for backward compat + scoring fallback)
  await prisma.networkEntry.createMany({
    data: groups.map((g) => ({
      ...g,
      profileId: member.profile!.id,
    })),
  });

  // Create individual Contact records
  let contactsCreated = 0;
  if (contacts.length > 0) {
    await prisma.contact.createMany({
      data: contacts.map((c) => ({
        ...c,
        profileId: member.profile!.id,
        embedding: [],
      })),
    });
    contactsCreated = contacts.length;
  }

  // Delete import session(s) for this member
  await prisma.networkImportSession.deleteMany({ where: { memberId: member.id } });

  return NextResponse.json({ created: groups.length, contactsCreated });
}
