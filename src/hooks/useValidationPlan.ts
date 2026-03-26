import useSWR from "swr";
import type { ValidationPlanResponse } from "@/lib/types/validation";

const fetcher = async (url: string): Promise<ValidationPlanResponse | null> => {
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  // Guard against error JSON objects being treated as valid plan data
  if (data && typeof data === "object" && "error" in data) return null;
  return data;
};

export function useValidationPlan(ideaId: string | null) {
  const { data, mutate, isLoading } = useSWR<ValidationPlanResponse | null>(
    ideaId ? `/api/ideas/${ideaId}/validation-plan` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      // Stop retrying on error — plan absence is not an error worth retrying
      onErrorRetry: () => {},
    }
  );
  return { plan: data ?? null, mutate, isLoading };
}
