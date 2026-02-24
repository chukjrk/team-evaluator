"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IndustrySelect } from "@/components/shared/IndustrySelect";
import type { IndustryKey } from "@/lib/constants/industries";
import type { IdeaData } from "@/lib/types/idea";

interface IdeaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: IdeaData;
  onSaved: (idea: IdeaData) => void;
}

export function IdeaForm({ open, onOpenChange, existing, onSaved }: IdeaFormProps) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [problem, setProblem] = useState(existing?.problemStatement ?? "");
  const [targetCustomer, setTargetCustomer] = useState(existing?.targetCustomer ?? "");
  const [industry, setIndustry] = useState<IndustryKey>((existing?.industry as IndustryKey) ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!industry) {
      toast.error("Please select an industry");
      return;
    }
    setSaving(true);
    try {
      const payload = { title, problemStatement: problem, targetCustomer, industry, notes: notes || undefined };
      const url = existing ? `/api/ideas/${existing.id}` : "/api/ideas";
      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.formErrors?.[0] ?? "Failed to save idea");
        return;
      }

      toast.success(existing ? "Idea updated" : "Idea submitted");
      onSaved(data);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Idea" : "Submit a New Idea"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI scheduling tool for clinics"
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Problem statement
            </label>
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="What problem does this solve? Why does it exist now?"
              rows={3}
              required
              minLength={10}
              maxLength={2000}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Target customer
            </label>
            <Input
              value={targetCustomer}
              onChange={(e) => setTargetCustomer(e.target.value)}
              placeholder="e.g. Independent clinic owners with 3-10 staff"
              required
              minLength={5}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Industry</label>
            <IndustrySelect value={industry} onChange={setIndustry} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Notes{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else relevant — competitors, inspiration, assumptions..."
              rows={2}
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : existing ? "Update" : "Submit Idea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
