import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { PERSONAL_DOMAINS, extractDomain } from "@/lib/contacts/domains";
import { classifyCompanyDomains, classifyContactGroups } from "@/lib/contacts/classify";
import type { CategorizedGroup } from "@/lib/types/import";

const TEN_MINUTES_MS = 10 * 60 * 1000;

// ─── State verification ───────────────────────────────────────────────────────

function verifyState(
  state: string,
  expectedUserId: string,
): { ok: boolean; reason?: string } {
  let parsed: { userId: string; timestamp: string; sig: string };
  try {
    parsed = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return { ok: false, reason: "invalid state encoding" };
  }

  if (parsed.userId !== expectedUserId) {
    return { ok: false, reason: "user mismatch" };
  }

  const age = Date.now() - parseInt(parsed.timestamp, 10);
  if (age > TEN_MINUTES_MS) {
    return { ok: false, reason: "state expired" };
  }

  const signingKey = process.env.CLERK_SECRET_KEY ?? "";
  const data = `${parsed.userId}:${parsed.timestamp}`;
  const expected = createHmac("sha256", signingKey).update(data).digest("hex");
  if (expected !== parsed.sig) {
    return { ok: false, reason: "signature mismatch" };
  }

  return { ok: true };
}

// ─── Token exchange ───────────────────────────────────────────────────────────

async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) return null;
  return res.json();
}

// ─── Google People API helpers ────────────────────────────────────────────────

interface GooglePerson {
  emailAddresses?: Array<{ value: string }>;
  organizations?: Array<{ name?: string }>;
  occupations?: Array<{ value: string }>;
}

async function fetchAllPages(
  url: string,
  token: string,
  pageTokenField: string,
  resourceKey: string,
  extraParams: Record<string, string>,
): Promise<GooglePerson[]> {
  const results: GooglePerson[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "1000", ...extraParams });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${url}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    const people: GooglePerson[] = data[resourceKey] ?? [];
    results.push(...people);
    pageToken = data[pageTokenField];
  } while (pageToken);

  return results;
}

// ─── Contact processing ───────────────────────────────────────────────────────

async function processContacts(
  explicit: GooglePerson[],
  other: GooglePerson[],
): Promise<CategorizedGroup[]> {
  // Explicit contacts with company/position → WARM
  const warmRows: { company: string; position: string }[] = [];
  // Contacts with only domain → MODERATE
  const moderateDomains: string[] = [];

  for (const person of explicit) {
    const company = person.organizations?.[0]?.name?.trim();
    const position = person.occupations?.[0]?.value?.trim() ?? "";
    const email = person.emailAddresses?.[0]?.value ?? "";
    const domain = email ? extractDomain(email) : "";

    if (company) {
      warmRows.push({ company, position });
    } else if (domain && !PERSONAL_DOMAINS.has(domain)) {
      moderateDomains.push(domain);
    }
  }

  for (const person of other) {
    const email = person.emailAddresses?.[0]?.value ?? "";
    if (!email) continue;
    const domain = extractDomain(email);
    if (domain && !PERSONAL_DOMAINS.has(domain)) {
      moderateDomains.push(domain);
    }
  }

  // Classify warm rows by company+position
  const warmGroups = await classifyContactGroups(warmRows);

  // Classify moderate domains
  const uniqueModerateDomains = [...new Set(moderateDomains)];
  const domainMap = await classifyCompanyDomains(uniqueModerateDomains);

  // Aggregate moderate contacts by industry
  const moderateByIndustry = new Map<string, number>();
  for (const domain of moderateDomains) {
    const industry = domainMap.get(domain) ?? "other";
    moderateByIndustry.set(industry, (moderateByIndustry.get(industry) ?? 0) + 1);
  }

  const groups: CategorizedGroup[] = [
    ...warmGroups.map((g) => ({ ...g, connectionStrength: "WARM" as const })),
    ...Array.from(moderateByIndustry.entries()).map(([industry, count]) => ({
      industry,
      estimatedContacts: count,
      notableRoles: [] as string[],
      connectionStrength: "MODERATE" as const,
    })),
  ];

  // Merge groups with the same (industry, connectionStrength)
  const merged = new Map<string, CategorizedGroup>();
  for (const g of groups) {
    const key = `${g.industry}|${g.connectionStrength}`;
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.estimatedContacts += g.estimatedContacts;
      const roleSet = new Set([...existing.notableRoles, ...g.notableRoles]);
      existing.notableRoles = [...roleSet].slice(0, 10);
    } else {
      merged.set(key, { ...g });
    }
  }

  return [...merged.values()];
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state || !userId) {
    return NextResponse.redirect(`${appUrl}/profile?google-import=error`);
  }

  const stateCheck = verifyState(state, userId);
  if (!stateCheck.ok) {
    return NextResponse.redirect(`${appUrl}/profile?google-import=error`);
  }

  // Look up workspace member
  const member = await prisma.workspaceMember.findFirst({
    where: { clerkUserId: userId },
  });
  if (!member) {
    return NextResponse.redirect(`${appUrl}/profile?google-import=error`);
  }

  // Exchange code for token
  const redirectUri = `${appUrl}/api/network/google/callback`;
  const tokenData = await exchangeCode(code, redirectUri);
  if (!tokenData?.access_token) {
    return NextResponse.redirect(`${appUrl}/profile?google-import=error`);
  }

  const token = tokenData.access_token;

  // Fetch contacts in parallel
  const [explicit, other] = await Promise.all([
    fetchAllPages(
      "https://people.googleapis.com/v1/people/me/connections",
      token,
      "nextPageToken",
      "connections",
      { personFields: "names,emailAddresses,organizations,occupations" },
    ),
    fetchAllPages(
      "https://people.googleapis.com/v1/otherContacts",
      token,
      "nextPageToken",
      "otherContacts",
      { readMask: "names,emailAddresses" },
    ),
  ]);

  // Classify and group
  const groups = await processContacts(explicit, other);

  if (groups.length === 0) {
    return NextResponse.redirect(`${appUrl}/profile?google-import=empty`);
  }

  // Write session (expires in 1 hour)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const session = await prisma.networkImportSession.create({
    data: {
      memberId: member.id,
      groups: groups as object,
      expiresAt,
    },
  });

  return NextResponse.redirect(`${appUrl}/profile?google-import=${session.id}`);
}
