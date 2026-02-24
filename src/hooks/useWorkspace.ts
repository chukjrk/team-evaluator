import useSWR from "swr";
import type { MemberWithProfile } from "@/lib/types/profile";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMembers() {
  const { data, error, mutate, isLoading } = useSWR<MemberWithProfile[]>(
    "/api/members",
    fetcher,
    { refreshInterval: 30_000 }
  );
  return { members: data ?? [], error, mutate, isLoading };
}

export function useWorkspaceInfo() {
  const { data, error, isLoading } = useSWR<{ id: string; name: string }>(
    "/api/workspace",
    fetcher
  );
  return { workspace: data, error, isLoading };
}
