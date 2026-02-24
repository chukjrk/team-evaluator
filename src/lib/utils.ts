import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
}

export function scoreBgColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

/** Returns an inline style for a gradient score bar fill. */
export function scoreBarGradient(score: number): { background: string } {
  if (score >= 75) {
    return { background: "linear-gradient(to right, #34d399, #0d9488)" }; // emerald → teal
  }
  if (score >= 50) {
    return { background: "linear-gradient(to right, #fbbf24, #f97316)" }; // amber → orange
  }
  return { background: "linear-gradient(to right, #fb7185, #e879f9)" }; // rose → fuchsia
}
