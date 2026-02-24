"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { IndustrySelect } from "@/components/shared/IndustrySelect";
import type { IndustryKey } from "@/lib/constants/industries";
import type { NetworkEntry } from "@prisma/client";

interface NetworkEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: NetworkEntry;
  onSaved: () => void;
}

export function NetworkEntryForm({
  open,
  onOpenChange,
  existing,
  onSaved,
}: NetworkEntryFormProps) {
  const [industry, setIndustry] = useState<IndustryKey>(
    (existing?.industry as IndustryKey) ?? ""
  );
  const [contacts, setContacts] = useState(
    existing?.estimatedContacts?.toString() ?? ""
  );
  const [strength, setStrength] = useState<"WARM" | "MODERATE" | "COLD">(
    existing?.connectionStrength ?? "MODERATE"
  );
  const [roleInput, setRoleInput] = useState("");
  const [roles, setRoles] = useState<string[]>(existing?.notableRoles ?? []);
  const [saving, setSaving] = useState(false);

  function addRole() {
    const trimmed = roleInput.trim();
    if (!trimmed || roles.includes(trimmed) || roles.length >= 10) return;
    setRoles([...roles, trimmed]);
    setRoleInput("");
  }

  function removeRole(role: string) {
    setRoles(roles.filter((r) => r !== role));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!industry) {
      toast.error("Please select an industry");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        industry,
        estimatedContacts: parseInt(contacts) || 0,
        notableRoles: roles,
        connectionStrength: strength,
      };

      const url = existing ? `/api/network/${existing.id}` : "/api/network";
      const method = existing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save");
        return;
      }

      toast.success(existing ? "Network entry updated" : "Network entry added");
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Edit Network Entry" : "Add Network Entry"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Industry</label>
            <IndustrySelect value={industry} onChange={setIndustry} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Estimated contacts
            </label>
            <Input
              type="number"
              min={0}
              max={1000000}
              value={contacts}
              onChange={(e) => setContacts(e.target.value)}
              placeholder="e.g. 200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Connection strength
            </label>
            <p className="text-xs text-zinc-400">
              How warm and accessible are these contacts?
            </p>
            <Select
              value={strength}
              onValueChange={(v) => setStrength(v as typeof strength)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WARM">
                  Warm — can get a reply within days
                </SelectItem>
                <SelectItem value="MODERATE">
                  Moderate — likely to respond with some effort
                </SelectItem>
                <SelectItem value="COLD">
                  Cold — loose connection, harder to reach
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Notable roles
            </label>
            <p className="text-xs text-zinc-400">
              Types of people in this network (e.g. &quot;CTOs&quot;, &quot;VCs&quot;, &quot;Hospital Admins&quot;).
            </p>
            <div className="flex gap-2">
              <Input
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="Add a role..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRole();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addRole}>
                Add
              </Button>
            </div>
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() => removeRole(role)}
                      className="opacity-60 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : existing ? "Update" : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
