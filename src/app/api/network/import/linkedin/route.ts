import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { classifyContactGroups } from "@/lib/contacts/classify";

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

  const baseGroups = await classifyContactGroups(rows);
  const groups = baseGroups.map((g) => ({ ...g, connectionStrength: "WARM" as const }));

  return NextResponse.json({ groups });
}
