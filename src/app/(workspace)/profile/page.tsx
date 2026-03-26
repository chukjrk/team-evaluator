"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { NetworkEntryForm } from "@/components/profile/NetworkEntryForm";
import { NetworkImportSection } from "@/components/profile/NetworkImportSection";
import { NetworkGraph } from "@/components/profile/NetworkGraph";
import { InviteBanner } from "@/components/shared/InviteBanner";
import type { SkillKey } from "@/lib/constants/skills";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NetworkEntryWithIndustry {
  id: string;
  industryId: string;
  industry: { id: string; label: string };
  estimatedContacts: number;
  notableRoles: string[];
  connectionStrength: "WARM" | "MODERATE" | "COLD";
}

interface ProfileData {
  background: string;
  skills: SkillKey[];
  networkEntries: NetworkEntryWithIndustry[];
}


export default function ProfilePage() {
  const router = useRouter();
  const { data: profile, mutate } = useSWR<ProfileData>("/api/profile", fetcher);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NetworkEntryWithIndustry | undefined>();

  async function deleteEntry(id: string) {
    const res = await fetch(`/api/network/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Entry removed");
      mutate();
    } else {
      toast.error("Failed to delete entry");
    }
  }

  function openEditEntry(entry: NetworkEntryWithIndustry) {
    setEditingEntry(entry);
    setEditFormOpen(true);
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10">
      <div className="mx-auto max-w-2xl space-y-8 px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
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

        {/* Invite */}
        <InviteBanner />

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
          <CardHeader>
            <CardTitle className="text-base">Your Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Suspense>
              <NetworkImportSection onSaved={() => mutate()} />
            </Suspense>
            <NetworkGraph
              entries={profile?.networkEntries ?? []}
              onEdit={openEditEntry}
              onDelete={deleteEntry}
            />
          </CardContent>
        </Card>
      </div>

      <NetworkEntryForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        existing={editingEntry}
        onSaved={() => mutate()}
      />
    </div>
  );
}
