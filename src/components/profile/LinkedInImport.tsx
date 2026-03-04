"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImportPreviewDialog } from "./ImportPreviewDialog";
import type { CategorizedGroup } from "@/lib/types/import";

interface LinkedInImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type Step = "instructions" | "upload" | "preview";

/**
 * Parses a LinkedIn Connections.csv file.
 * LinkedIn prepends several preamble lines before the actual header row.
 * We scan for the first row containing both "Company" and "Position" columns.
 */
function parseLinkedInCsv(
  text: string,
): { company: string; position: string }[] {
  const lines = text.split(/\r?\n/);

  // Find header row index
  let headerIdx = -1;
  let companyCol = -1;
  let positionCol = -1;

  for (let i = 0; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    const lower = cols.map((c) => c.toLowerCase());
    const ci = lower.findIndex((c) => c.includes("company"));
    const pi = lower.findIndex((c) => c.includes("position"));
    if (ci >= 0 && pi >= 0) {
      headerIdx = i;
      companyCol = ci;
      positionCol = pi;
      break;
    }
  }

  if (headerIdx < 0) return [];

  const rows: { company: string; position: string }[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvRow(lines[i]);
    const company = (cols[companyCol] ?? "").trim();
    const position = (cols[positionCol] ?? "").trim();
    if (company || position) {
      rows.push({ company, position });
    }
    if (rows.length >= 500) break;
  }

  return rows;
}

/** Simple CSV row parser that handles quoted fields. */
function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function LinkedInImport({
  open,
  onOpenChange,
  onSaved,
}: LinkedInImportProps) {
  const [step, setStep] = useState<Step>("instructions");
  const [uploading, setUploading] = useState(false);
  const [previewGroups, setPreviewGroups] = useState<CategorizedGroup[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleClose(val: boolean) {
    if (!val) {
      setStep("instructions");
      setUploading(false);
    }
    onOpenChange(val);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseLinkedInCsv(text);

      if (rows.length === 0) {
        toast.error(
          "No contacts found. Make sure you uploaded LinkedIn's Connections.csv file.",
        );
        return;
      }

      const res = await fetch("/api/network/import/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to classify contacts");
        return;
      }

      const data = await res.json();
      setPreviewGroups(data.groups);
      onOpenChange(false);
      setPreviewOpen(true);
    } catch {
      toast.error("Failed to parse CSV file");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import LinkedIn Connections</DialogTitle>
          </DialogHeader>

          {step === "instructions" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 space-y-2">
                <p className="font-medium text-zinc-900">
                  How to export your LinkedIn connections:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-600">
                  <li>
                    Go to{" "}
                    <span className="font-medium">linkedin.com</span> → click
                    your profile photo → <span className="font-medium">Settings & Privacy</span>
                  </li>
                  <li>
                    Click <span className="font-medium">Data Privacy</span> →{" "}
                    <span className="font-medium">Get a copy of your data</span>
                  </li>
                  <li>
                    Select <span className="font-medium">Connections</span> only
                    → click <span className="font-medium">Request archive</span>
                  </li>
                  <li>
                    Check your email for the download link{" "}
                    <span className="text-zinc-400">(usually &lt; 5 min)</span>
                  </li>
                  <li>
                    Download the ZIP, open it, and upload{" "}
                    <span className="font-medium">Connections.csv</span> below
                  </li>
                </ol>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep("upload")}>
                  I have my CSV
                </Button>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                Upload your <span className="font-medium">Connections.csv</span>{" "}
                file from the LinkedIn data export ZIP.
              </p>

              <label className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 p-8 cursor-pointer hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
                <Upload className="h-8 w-8 text-zinc-400" />
                <span className="text-sm text-zinc-500">
                  {uploading ? "Processing..." : "Click to upload Connections.csv"}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleFile}
                />
              </label>

              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("instructions")}
                  disabled={uploading}
                >
                  Back
                </Button>
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        groups={previewGroups}
        onSaved={() => {
          setPreviewOpen(false);
          setStep("instructions");
          onSaved();
        }}
      />
    </>
  );
}
