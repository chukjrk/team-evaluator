"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { NetworkEntryForm } from "@/components/profile/NetworkEntryForm";
import { INDUSTRY_LABELS } from "@/lib/constants/industries";
import type { SkillKey } from "@/lib/constants/skills";
import type { NetworkEntry } from "@prisma/client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProfileData {
  background: string;
  skills: SkillKey[];
  networkEntries: NetworkEntry[];
}

const STRENGTH_LABELS = {
  WARM: "Warm",
  MODERATE: "Moderate",
  COLD: "Cold",
} as const;

const STRENGTH_COLORS = {
  WARM: "bg-green-100 text-green-700",
  MODERATE: "bg-yellow-100 text-yellow-700",
  COLD: "bg-zinc-100 text-zinc-600",
} as const;

export default function ProfilePage() {
  const router = useRouter();
  const { data: profile, mutate } = useSWR<ProfileData>("/api/profile", fetcher);
  const [networkFormOpen, setNetworkFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NetworkEntry | undefined>();

  async function deleteEntry(id: string) {
    const res = await fetch(`/api/network/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Entry removed");
      mutate();
    } else {
      toast.error("Failed to delete entry");
    }
  }

  function openNewEntry() {
    setEditingEntry(undefined);
    setNetworkFormOpen(true);
  }

  function openEditEntry(entry: NetworkEntry) {
    setEditingEntry(entry);
    setNetworkFormOpen(true);
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10">
      <div className="mx-auto max-w-2xl space-y-8 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Your Profile</h1>
            <p className="text-sm text-zinc-500">
              Fill in your background, skills, and network to power the scoring
              engine.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>

        {/* Profile / Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Background & Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialBackground={profile?.background}
              initialSkills={profile?.skills}
              onSaved={() => mutate()}
            />
          </CardContent>
        </Card>

        {/* Network Entries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your Network</CardTitle>
            <Button size="sm" onClick={openNewEntry}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Entry
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!profile?.networkEntries?.length && (
              <p className="text-sm text-zinc-400">
                No network entries yet. Add segments of your network to help
                score idea-network fit.
              </p>
            )}
            {profile?.networkEntries?.map((entry, i) => (
              <div key={entry.id}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-800">
                        {INDUSTRY_LABELS[entry.industry as keyof typeof INDUSTRY_LABELS] ??
                          entry.industry}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STRENGTH_COLORS[entry.connectionStrength]}`}
                      >
                        {STRENGTH_LABELS[entry.connectionStrength]}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      ~{entry.estimatedContacts.toLocaleString()} contacts
                      {entry.notableRoles.length > 0 &&
                        ` · ${entry.notableRoles.join(", ")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditEntry(entry)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <NetworkEntryForm
        open={networkFormOpen}
        onOpenChange={setNetworkFormOpen}
        existing={editingEntry}
        onSaved={() => mutate()}
      />
    </div>
  );
}
