"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  SKILLS_TAXONOMY,
  SKILL_LABELS,
  CATEGORY_LABELS,
  type SkillKey,
} from "@/lib/constants/skills";
import { cn } from "@/lib/utils";

interface SkillSelectProps {
  value: SkillKey[];
  onChange: (value: SkillKey[]) => void;
}

export function SkillSelect({ value, onChange }: SkillSelectProps) {
  const [open, setOpen] = useState(false);

  function toggle(skill: SkillKey) {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else {
      onChange([...value, skill]);
    }
  }

  function remove(skill: SkillKey) {
    onChange(value.filter((s) => s !== skill));
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value.length === 0
              ? "Select skills..."
              : `${value.length} skill${value.length !== 1 ? "s" : ""} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search skills..." />
            <CommandList>
              <CommandEmpty>No skills found.</CommandEmpty>
              {(Object.keys(SKILLS_TAXONOMY) as Array<keyof typeof SKILLS_TAXONOMY>).map(
                (category) => (
                  <CommandGroup
                    key={category}
                    heading={CATEGORY_LABELS[category]}
                  >
                    {SKILLS_TAXONOMY[category].map((skill) => (
                      <CommandItem
                        key={skill}
                        value={skill}
                        onSelect={() => toggle(skill as SkillKey)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.includes(skill as SkillKey)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {SKILL_LABELS[skill as SkillKey]}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="gap-1 pr-1 text-xs"
            >
              {SKILL_LABELS[skill]}
              <button
                type="button"
                onClick={() => remove(skill)}
                className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
