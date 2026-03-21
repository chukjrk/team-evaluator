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

interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function IndustrySelect({
  value,
  onChange,
  placeholder = "Select industry...",
}: IndustrySelectProps) {
  const { data: industries = [] } = useSWR<IndustryOption[]>(
    "/api/industries",
    fetcher,
    { revalidateOnFocus: false },
  );

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {industries.map((industry) => (
          <SelectItem key={industry.id} value={industry.id}>
            {industry.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
