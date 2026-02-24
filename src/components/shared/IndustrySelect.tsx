"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDUSTRIES, INDUSTRY_LABELS, type IndustryKey } from "@/lib/constants/industries";

interface IndustrySelectProps {
  value: string;
  onChange: (value: IndustryKey) => void;
  placeholder?: string;
}

export function IndustrySelect({
  value,
  onChange,
  placeholder = "Select industry...",
}: IndustrySelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {INDUSTRIES.map((industry) => (
          <SelectItem key={industry} value={industry}>
            {INDUSTRY_LABELS[industry]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
