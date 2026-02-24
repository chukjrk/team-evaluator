"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SkillSelect } from "@/components/shared/SkillSelect";
import type { SkillKey } from "@/lib/constants/skills";

interface ProfileFormProps {
  initialBackground?: string;
  initialSkills?: SkillKey[];
  onSaved?: () => void;
}

export function ProfileForm({
  initialBackground = "",
  initialSkills = [],
  onSaved,
}: ProfileFormProps) {
  const [background, setBackground] = useState(initialBackground);
  const [skills, setSkills] = useState<SkillKey[]>(initialSkills);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background, skills }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error?.formErrors?.[0] ?? "Failed to save profile");
        return;
      }
      toast.success("Profile saved");
      onSaved?.();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Background</label>
        <p className="text-xs text-zinc-400">
          Describe your experience, education, and what domains you know well.
        </p>
        <Textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder="e.g. 8 years in enterprise software sales. Former PM at a Series B fintech. Deep knowledge of B2B procurement cycles and healthcare compliance..."
          rows={4}
          maxLength={2000}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Skills</label>
        <p className="text-xs text-zinc-400">
          Select all skills that apply to you across technical, business, and domain areas.
        </p>
        <SkillSelect value={skills} onChange={setSkills} />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
