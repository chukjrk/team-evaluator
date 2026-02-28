"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  // Fetch workspace name from token
  useEffect(() => {
    if (!token) return;
    fetch(`/api/workspace/preview?token=${token}`)
      .then((r) => r.json())
      .then((d) => setWorkspaceName(d.name ?? null))
      .catch(() => {});
  }, [token]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Invalid invite link.</p>
      </div>
    );
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    router.push(`/sign-up?redirect_url=/join?token=${token}`);
    return null;
  }

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.error?.includes("Already")) {
          router.push("/dashboard");
          return;
        }
        setError(data.error ?? "Failed to join workspace");
        return;
      }
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You&apos;ve been invited</CardTitle>
          <CardDescription>
            {workspaceName
              ? `Join "${workspaceName}" as a cofounder`
              : "Join a cofounder workspace"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <Button onClick={handleJoin} disabled={joining} className="w-full">
            {joining ? "Joining..." : "Accept Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinContent />
    </Suspense>
  );
}
