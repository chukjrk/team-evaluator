"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRIES, INDUSTRY_LABELS } from "@/lib/constants/industries";

export interface IdeaFilterState {
  industry: string;
  visibility: string;
}

interface IdeaFiltersProps {
  filters: IdeaFilterState;
  onChange: (filters: IdeaFilterState) => void;
}

export function IdeaFilters({ filters, onChange }: IdeaFiltersProps) {
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
          {INDUSTRIES.map((ind) => (
            <SelectItem key={ind} value={ind}>
              {INDUSTRY_LABELS[ind]}
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
