"use client";

import { Clock } from "lucide-react";

interface TimeEstimateChipProps {
  timeToFirstCustomer: string;
  optimistic?: string;
  realistic?: string;
  pessimistic?: string;
}

export function TimeEstimateChip({
  timeToFirstCustomer,
  optimistic,
  realistic,
  pessimistic,
}: TimeEstimateChipProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-medium text-blue-700">Time to First Customer</span>
      </div>
      <p className="text-lg font-bold text-blue-800">{timeToFirstCustomer}</p>
      {(optimistic || realistic || pessimistic) && (
        <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
          {optimistic && (
            <div>
              <span className="block text-[10px] font-medium text-blue-500 uppercase tracking-wide">
                Optimistic
              </span>
              <span className="text-blue-700">{optimistic}</span>
            </div>
          )}
          {realistic && (
            <div>
              <span className="block text-[10px] font-medium text-blue-500 uppercase tracking-wide">
                Realistic
              </span>
              <span className="text-blue-700">{realistic}</span>
            </div>
          )}
          {pessimistic && (
            <div>
              <span className="block text-[10px] font-medium text-blue-500 uppercase tracking-wide">
                Pessimistic
              </span>
              <span className="text-blue-700">{pessimistic}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
