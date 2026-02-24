"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          router.push("/dashboard");
          return;
        }
        setError(data.error ?? "Failed to create workspace");
        return;
      }
      router.push("/profile");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Founding Eval
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Evaluate startup ideas with your cofounder team
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a workspace</CardTitle>
            <CardDescription>
              Start a new cofounder workspace. Share the invite link to bring in
              your cofounders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Workspace name
                </label>
                <Input
                  placeholder="e.g. Acme Team"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={60}
                />
              </div>
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Workspace"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-zinc-400">
          Joining an existing workspace?{" "}
          <span className="text-zinc-600">
            Ask a cofounder for the invite link.
          </span>
        </p>
      </div>
    </div>
  );
}
