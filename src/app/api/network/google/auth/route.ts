import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
].join(" ");

function buildState(userId: string): string {
  const timestamp = Date.now().toString();
  const signingKey = process.env.CLERK_SECRET_KEY ?? "";
  const data = `${userId}:${timestamp}`;
  const sig = createHmac("sha256", signingKey).update(data).digest("hex");
  // Encode as base64 so it survives URL round-trip
  return Buffer.from(JSON.stringify({ userId, timestamp, sig })).toString("base64url");
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 503 },
    );
  }

  const state = buildState(userId);
  const redirectUri = `${appUrl}/api/network/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
    access_type: "online",
    prompt: "select_account consent",
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({ url });
}
