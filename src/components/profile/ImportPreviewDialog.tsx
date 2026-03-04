"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRY_LABELS } from "@/lib/constants/industries";
import type { CategorizedGroup } from "@/lib/types/import";

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CategorizedGroup[];
  onSaved: () => void;
}

export function ImportPreviewDialog({
  open,
  onOpenChange,
  groups: initialGroups,
  onSaved,
}: ImportPreviewDialogProps) {
  const [groups, setGroups] = useState<CategorizedGroup[]>(initialGroups);
  const [saving, setSaving] = useState(false);

  // Sync when the dialog opens with new groups (useState only initializes once)
  useEffect(() => {
    if (open) setGroups(initialGroups);
  }, [open, initialGroups]);

  function updateStrength(
    index: number,
    strength: "WARM" | "MODERATE" | "COLD",
  ) {
    setGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, connectionStrength: strength } : g)),
    );
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    if (groups.length === 0) {
      toast.error("No groups to import");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/network/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to import");
        return;
      }

      const data = await res.json();
      toast.success(`Imported ${data.created} network group${data.created !== 1 ? "s" : ""}`);
      onSaved();
      onOpenChange(false);

      // Remove the google-import query param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("google-import");
      window.history.replaceState({}, "", url.toString());
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const STRENGTH_LABELS = {
    WARM: "Warm — can get a reply within days",
    MODERATE: "Moderate — likely to respond with some effort",
    COLD: "Cold — loose connection, harder to reach",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Import ({groups.length} groups)</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-zinc-500">
          Review the network groups identified from your contacts. Adjust
          connection strengths or remove groups before importing.
        </p>

        {groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            All groups removed. Nothing to import.
          </p>
        ) : (
          <div className="space-y-3 pt-2">
            {groups.map((g, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      {INDUSTRY_LABELS[g.industry as keyof typeof INDUSTRY_LABELS] ??
                        g.industry}
                    </span>
                    <span className="text-xs text-zinc-400">
                      ~{g.estimatedContacts.toLocaleString()} contacts
                    </span>
                  </div>
                  {g.notableRoles.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {g.notableRoles.join(", ")}
                    </p>
                  )}
                  <Select
                    value={g.connectionStrength}
                    onValueChange={(v) =>
                      updateStrength(i, v as "WARM" | "MODERATE" | "COLD")
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["WARM", "MODERATE", "COLD"] as const).map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {STRENGTH_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-600 shrink-0"
                  onClick={() => removeGroup(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || groups.length === 0}
          >
            {saving
              ? "Importing..."
              : `Import ${groups.length} group${groups.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
