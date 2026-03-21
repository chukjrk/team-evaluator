"use client";

import useSWR from "swr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IndustryOption {
  id: string;
  label: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface IdeaFilterState {
  industry: string;
  visibility: string;
}

interface IdeaFiltersProps {
  filters: IdeaFilterState;
  onChange: (filters: IdeaFilterState) => void;
}

export function IdeaFilters({ filters, onChange }: IdeaFiltersProps) {
  const { data: industries = [] } = useSWR<IndustryOption[]>(
    "/api/industries",
    fetcher,
    { revalidateOnFocus: false },
  );

  return (
    <div className="flex gap-2">
      <Select
        value={filters.industry}
        onValueChange={(v) => onChange({ ...filters, industry: v })}
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="Industry" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All industries</SelectItem>
          {industries.map((ind) => (
            <SelectItem key={ind.id} value={ind.id}>
              {ind.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.visibility}
        onValueChange={(v) => onChange({ ...filters, visibility: v })}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All ideas</SelectItem>
          <SelectItem value="WORKSPACE">Workspace</SelectItem>
          <SelectItem value="PRIVATE">Private</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
