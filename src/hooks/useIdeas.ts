import useSWR from "swr";
import type { IdeaData } from "@/lib/types/idea";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useIdeas() {
  const { data, error, mutate, isLoading } = useSWR<IdeaData[]>(
    "/api/ideas",
    fetcher,
    { refreshInterval: 15_000 }
  );
  return { ideas: data ?? [], error, mutate, isLoading };
}
