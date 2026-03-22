"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FlaskConical,
  Search,
  Wrench,
  Handshake,
  Rocket,
  Clock,
  RefreshCw,
  Users,
  ClipboardList,
} from "lucide-react";
import type {
  StoredValidationPlan,
  ValidationStep,
  NetworkReachOut,
} from "@/lib/types/validation";

const PRIORITY_CONFIG = {
  critical: {
    node: "border-2 border-red-400 bg-red-50",
    iconBg: "bg-red-100 text-red-600",
    titleColor: "text-red-900",
    badge: "bg-red-100 text-red-700 border border-red-200",
    stemColor: "bg-red-200",
    label: "Critical",
  },
  high: {
    node: "border-2 border-orange-400 bg-orange-50",
    iconBg: "bg-orange-100 text-orange-600",
    titleColor: "text-orange-900",
    badge: "bg-orange-100 text-orange-700 border border-orange-200",
    stemColor: "bg-orange-200",
    label: "High",
  },
  medium: {
    node: "border border-zinc-300 bg-white",
    iconBg: "bg-zinc-100 text-zinc-500",
    titleColor: "text-zinc-800",
    badge: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    stemColor: "bg-zinc-200",
    label: "Medium",
  },
} as const;

const STEP_TYPE_ICONS: Record<ValidationStep["type"], React.ElementType> = {
  "customer-interview": MessageSquare,
  prototype: FlaskConical,
  "market-research": Search,
  technical: Wrench,
  partnership: Handshake,
  "mvp-test": Rocket,
};

const STEP_TYPE_LABELS: Record<ValidationStep["type"], string> = {
  "customer-interview": "Interview",
  prototype: "Prototype",
  "market-research": "Research",
  technical: "Technical",
  partnership: "Partnership",
  "mvp-test": "MVP Test",
};

const STRENGTH_STYLES: Record<NetworkReachOut["connectionStrength"], string> = {
  WARM: "bg-green-100 text-green-700",
  MODERATE: "bg-yellow-100 text-yellow-700",
  COLD: "bg-zinc-100 text-zinc-500",
};

interface ValidationPlanTreeProps {
  plan: StoredValidationPlan;
  generatedAt: string;
  triggeredByName: string;
}

export function ValidationPlanTree({
  plan,
  generatedAt,
  triggeredByName,
}: ValidationPlanTreeProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [checkedCriteria, setCheckedCriteria] = useState<Set<number>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const steps = plan.validationSteps;
  const totalSteps = steps.length;

  function toggleStep(order: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  }

  function toggleExpand(order: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  }

  function toggleCriterion(i: number) {
    setCheckedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const completedCount = checkedSteps.size;
  const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div className="space-y-6 px-4 py-5">
      {/* Progress bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-zinc-400 shrink-0 tabular-nums">
          {completedCount}/{totalSteps} steps done
        </span>
      </div>

      {/* Tree */}
      <div className="flex flex-col items-center">

        {/* Root: Hypothesis */}
        <div className="w-full max-w-[420px]">
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3 text-center shadow-sm">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
              Core Hypothesis
            </p>
            <p className="text-xs font-medium text-blue-900 leading-snug">
              {plan.hypothesis}
            </p>
          </div>
        </div>

        {/* Vertical stem from root to branch */}
        <div className="w-px h-8 bg-zinc-200" />

        {/* Steps row with tree connectors */}
        {totalSteps > 0 && (
          <div className="relative w-full">
            {/* Horizontal bar spanning from center of first to center of last step */}
            {totalSteps > 1 && (
              <div
                className="absolute top-0 h-px bg-zinc-200"
                style={{
                  left: `${100 / (2 * totalSteps)}%`,
                  right: `${100 / (2 * totalSteps)}%`,
                }}
              />
            )}

            <div className="flex gap-2.5">
              {steps.map((step) => {
                const config = PRIORITY_CONFIG[step.priority];
                const Icon = STEP_TYPE_ICONS[step.type] ?? ClipboardList;
                const isChecked = checkedSteps.has(step.order);
                const isExpanded = expandedSteps.has(step.order);

                return (
                  <div
                    key={step.order}
                    className="flex-1 flex flex-col items-center min-w-0"
                  >
                    {/* Vertical drop from horizontal bar */}
                    <div className="w-px h-8 bg-zinc-200" />

                    {/* Step node */}
                    <div
                      className={`w-full rounded-xl shadow-sm transition-all duration-200 ${config.node} ${
                        isChecked ? "opacity-55" : ""
                      }`}
                    >
                      <div className="p-2.5">
                        {/* Type icon + priority badge */}
                        <div className="flex items-center gap-1 flex-wrap mb-1.5">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${config.iconBg}`}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${config.badge}`}
                          >
                            {config.label}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-400">
                            {STEP_TYPE_LABELS[step.type]}
                          </span>
                        </div>

                        {/* Checkbox + title */}
                        <div className="flex items-start gap-1.5">
                          <button
                            onClick={() => toggleStep(step.order)}
                            className="mt-0.5 shrink-0 cursor-pointer hover:scale-110 transition-transform"
                            title={isChecked ? "Mark incomplete" : "Mark complete"}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-zinc-300" />
                            )}
                          </button>
                          <p
                            className={`text-[11px] font-semibold leading-tight ${config.titleColor} ${
                              isChecked ? "line-through" : ""
                            }`}
                          >
                            {step.title}
                          </p>
                        </div>

                        {/* Expand toggle */}
                        <button
                          onClick={() => toggleExpand(step.order)}
                          className="mt-2 w-full flex items-center justify-center gap-0.5 text-[9px] text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              Details
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded description */}
                      {isExpanded && (
                        <div className="border-t border-zinc-100 px-2.5 pb-2.5 pt-2">
                          <p className="text-[10px] text-zinc-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Network Reach-Outs */}
      {plan.networkReachOuts.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Network Reach-Outs
          </h4>
          <div className="space-y-2">
            {plan.networkReachOuts.map((r, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-200 bg-white p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      {r.contactName && (
                        <span className="text-xs font-semibold text-zinc-800">
                          {r.contactName}
                        </span>
                      )}
                      {r.position && (
                        <span className="text-[10px] text-zinc-400">{r.position}</span>
                      )}
                      {r.company && (
                        <span className="text-[10px] text-zinc-400">· {r.company}</span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5">
                      via{" "}
                      <span className="font-medium text-zinc-500">{r.cofounderName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                        STRENGTH_STYLES[r.connectionStrength]
                      }`}
                    >
                      {r.connectionStrength.charAt(0) +
                        r.connectionStrength.slice(1).toLowerCase()}
                    </span>
                    {r.priority === "high" && (
                      <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-700">
                        Priority
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  <span className="font-medium text-zinc-600">Why: </span>
                  {r.reason}
                </p>
                <div className="rounded-md bg-zinc-50 border border-zinc-100 px-2.5 py-1.5">
                  <p className="text-[9px] font-medium text-zinc-400 mb-0.5">
                    Outreach angle
                  </p>
                  <p className="text-[10px] text-zinc-600 italic leading-relaxed">
                    &ldquo;{r.outreachAngle}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Criteria — checkable */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2.5 flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3" />
          Success Criteria
        </h4>
        <div className="space-y-2">
          {plan.successCriteria.map((criterion, i) => {
            const done = checkedCriteria.has(i);
            return (
              <button
                key={i}
                onClick={() => toggleCriterion(i)}
                className="w-full flex items-start gap-2 text-left group rounded-lg border border-transparent hover:border-zinc-100 hover:bg-zinc-50 px-1.5 py-1 transition-colors"
              >
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                ) : (
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-300 group-hover:text-zinc-400 transition-colors" />
                )}
                <p
                  className={`text-[11px] leading-relaxed transition-colors ${
                    done ? "line-through text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {criterion}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
        <Clock className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400">
            Estimated Timeline
          </p>
          <p className="text-xs font-medium text-zinc-700 mt-0.5">
            {plan.estimatedTimeline}
          </p>
        </div>
      </div>

      {/* Re-evaluation Triggers */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <RefreshCw className="h-3 w-3 text-amber-500" />
          <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-600">
            Re-evaluate When...
          </p>
        </div>
        <ul className="space-y-1.5">
          {plan.reevaluationTriggers.map((trigger, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
              <p className="text-[11px] text-amber-800 leading-relaxed">{trigger}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <p className="text-[9px] text-zinc-400 text-center">
        Generated by {triggeredByName} on{" "}
        {new Date(generatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
