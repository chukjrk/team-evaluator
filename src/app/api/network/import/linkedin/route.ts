import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { classifyContactGroups, classifyContactsPerRow } from "@/lib/contacts/classify";
import type { StagedContact } from "@/lib/types/import";

const bodySchema = z.object({
  rows: z
    .array(
      z.object({
        company: z.string().max(200),
        position: z.string().max(200),
      }),
    )
    .min(1)
    .max(500),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { rows } = parsed.data;

  // Run both classifications in parallel: aggregate groups + per-row industries
  const [baseGroups, perRowIndustries] = await Promise.all([
    classifyContactGroups(rows),
    classifyContactsPerRow(rows),
  ]);

  const groups = baseGroups.map((g) => ({ ...g, connectionStrength: "WARM" as const }));

  const contacts: StagedContact[] = rows.map((row, i) => ({
    company: row.company || undefined,
    position: row.position || undefined,
    industryId: perRowIndustries[i] || undefined,
    connectionStrength: "WARM",
    source: "LINKEDIN",
  }));

  return NextResponse.json({ groups, contacts });
}
