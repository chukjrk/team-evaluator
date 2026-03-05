import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COMPOSITE_WEIGHTS = [
  { label: "Team Skill Coverage", weight: 0.25, description: "How broadly the team's skills span technical, business, and domain categories." },
  { label: "Network Strength", weight: 0.2, description: "Strength-weighted contact reach, blending network size with industry relevance." },
  { label: "Idea Quality (AI)", weight: 0.3, description: "Claude's assessment of problem clarity, market opportunity, and defensibility." },
  { label: "Team–Idea Fit (AI)", weight: 0.25, description: "How well the team's background and skills align with the specific idea." },
];

const TEAM_SKILL_WEIGHTS = [
  { label: "Technical skills", weight: 0.4 },
  { label: "Business skills", weight: 0.35 },
  { label: "Domain skills", weight: 0.25 },
];

const NETWORK_BLEND = [
  { label: "Network size (log scale)", weight: 0.6 },
  { label: "Industry relevance", weight: 0.4 },
];

const STRENGTH_MULTIPLIERS = [
  { label: "Warm connections", multiplier: "1.0×" },
  { label: "Moderate connections", multiplier: "0.6×" },
  { label: "Cold connections", multiplier: "0.25×" },
];

function WeightBar({ weight }: { weight: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-violet-500"
          style={{ width: `${weight * 100}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-zinc-700">
        {Math.round(weight * 100)}%
      </span>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Workspace Settings
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              How ideas are evaluated in your workspace.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Composite score */}
        <Card>
          <CardHeader>
            <CardTitle>Composite Score Weights</CardTitle>
            <CardDescription>
              Each idea receives a composite score from 0–100 by blending four
              sub-scores with the weights below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {COMPOSITE_WEIGHTS.map(({ label, weight, description }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">{label}</p>
                </div>
                <WeightBar weight={weight} />
                <p className="text-xs text-zinc-500">{description}</p>
              </div>
            ))}
            <p className="rounded-md bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs text-zinc-500">
              Formula:{" "}
              <span className="font-mono">
                score = 0.25 × TeamSkill + 0.20 × Network + 0.30 × IdeaQuality +
                0.25 × TeamFit
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Team Skill sub-weights */}
        <Card>
          <CardHeader>
            <CardTitle>Team Skill Category Weights</CardTitle>
            <CardDescription>
              Skill coverage is measured separately per category, then blended.
              A complementarity bonus (up to 10 pts) rewards non-overlapping
              skills across founders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TEAM_SKILL_WEIGHTS.map(({ label, weight }) => (
              <div key={label} className="space-y-1">
                <p className="text-sm font-medium text-zinc-800">{label}</p>
                <WeightBar weight={weight} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Network sub-weights */}
        <Card>
          <CardHeader>
            <CardTitle>Network Score Breakdown</CardTitle>
            <CardDescription>
              Contacts are strength-weighted before scoring. The final network
              score blends raw size (log scale, capped at ~500 contacts) with
              industry relevance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {NETWORK_BLEND.map(({ label, weight }) => (
                <div key={label} className="space-y-1">
                  <p className="text-sm font-medium text-zinc-800">{label}</p>
                  <WeightBar weight={weight} />
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-800">
                Connection strength multipliers
              </p>
              <div className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
                {STRENGTH_MULTIPLIERS.map(({ label, multiplier }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="text-sm text-zinc-700">{label}</span>
                    <span className="text-sm font-mono font-semibold text-zinc-900">
                      {multiplier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
