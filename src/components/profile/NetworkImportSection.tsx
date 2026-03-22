"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Link2, FileText, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NetworkEntryForm } from "./NetworkEntryForm";
import { LinkedInImport } from "./LinkedInImport";
import { ImportPreviewDialog } from "./ImportPreviewDialog";
import { parseSessionData } from "@/lib/types/import";
import type { CategorizedGroup, StagedContact } from "@/lib/types/import";

interface NetworkImportSectionProps {
  onSaved: () => void;
}

export function NetworkImportSection({ onSaved }: NetworkImportSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [linkedInOpen, setLinkedInOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewGroups, setPreviewGroups] = useState<CategorizedGroup[]>([]);
  const [previewContacts, setPreviewContacts] = useState<StagedContact[]>([]);

  // On mount, check for ?google-import=<sessionId> in URL
  useEffect(() => {
    const importParam = searchParams.get("google-import");
    if (!importParam) return;

    if (importParam === "error") {
      toast.error("Google import failed. Please try again.");
      router.replace("/profile");
      return;
    }

    if (importParam === "empty") {
      toast.info("No professional contacts found in your Google account.");
      router.replace("/profile");
      return;
    }

    // Fetch the session groups
    fetch("/api/network/import/session")
      .then((r) => r.json())
      .then((data) => {
        const { groups, contacts } = parseSessionData(data.groups);
        if (groups.length > 0 || contacts.length > 0) {
          setPreviewGroups(groups);
          setPreviewContacts(contacts);
          setPreviewOpen(true);
        } else {
          toast.error("Import session expired. Please try again.");
          router.replace("/profile");
        }
      })
      .catch(() => {
        toast.error("Failed to load import data.");
        router.replace("/profile");
      });
  // Only run on mount (searchParams from useSearchParams is stable for this use case)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleImport() {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/network/google/auth");
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to start Google import");
        return;
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
      setGoogleLoading(false);
    }
  }

  function handlePreviewClose(open: boolean) {
    if (!open) {
      // Clean up URL param and session on dismiss
      router.replace("/profile");
      fetch("/api/network/import/session", { method: "DELETE" }).catch(() => {});
    }
    setPreviewOpen(open);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoogleImport}
          disabled={googleLoading}
        >
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          {googleLoading ? "Redirecting..." : "Import from Google"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setLinkedInOpen(true)}
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          LinkedIn CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setManualOpen(true)}
        >
          <PenLine className="mr-1.5 h-3.5 w-3.5" />
          Manual
        </Button>
      </div>

      <NetworkEntryForm
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSaved={onSaved}
      />

      <LinkedInImport
        open={linkedInOpen}
        onOpenChange={setLinkedInOpen}
        onSaved={onSaved}
      />

      <ImportPreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewClose}
        groups={previewGroups}
        contacts={previewContacts}
        onSaved={() => {
          router.replace("/profile");
          onSaved();
        }}
      />
    </>
  );
}
