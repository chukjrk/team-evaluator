import useSWR from "swr";
import type { SkillKey } from "@/lib/constants/skills";
import type { NetworkEntry } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProfileData {
  id: string;
  background: string;
  skills: SkillKey[];
  networkEntries: NetworkEntry[];
  updatedAt: string;
}

export function useProfile() {
  const { data, error, mutate, isLoading } = useSWR<ProfileData | null>(
    "/api/profile",
    fetcher
  );
  return { profile: data, error, mutate, isLoading };
}
