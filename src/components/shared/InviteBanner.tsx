"use client";

import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function InviteBanner() {
  const { data } = useSWR<{ inviteUrl: string; workspaceName: string }>(
    "/api/workspace/invite",
    fetcher
  );
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!data?.inviteUrl) return;
    await navigator.clipboard.writeText(data.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!data?.inviteUrl) return null;

  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
        <Link2 className="h-3.5 w-3.5" />
        <span>Invite cofounders</span>
      </div>
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate rounded bg-white px-2 py-1 text-xs font-mono text-zinc-600 border border-zinc-200">
          {data.inviteUrl}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          className="h-7 w-7 p-0 shrink-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
