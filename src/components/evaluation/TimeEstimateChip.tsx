"use client";

import { Clock } from "lucide-react";

interface TimeEstimateChipProps {
  timeToFirstCustomer: string;
  optimistic?: string;
  realistic?: string;
}

export function TimeEstimateChip({
  timeToFirstCustomer,
  optimistic,
  realistic,
}: TimeEstimateChipProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-medium text-blue-700">Time to First Customer</span>
      </div>
      <p className="text-lg font-bold text-blue-800">{timeToFirstCustomer}</p>
      {(optimistic || realistic) && (
        <div className="mt-1 flex gap-4 text-xs text-blue-600">
          {optimistic && <span>Optimistic: {optimistic}</span>}
          {realistic && <span>Realistic: {realistic}</span>}
        </div>
      )}
    </div>
  );
}
