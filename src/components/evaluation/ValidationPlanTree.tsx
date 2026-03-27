"use client";

import { useState } from "react";
import {
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
  StickyNote,
} from "lucide-react";
import type {
  StoredValidationPlan,
  ValidationStep,
  NetworkReachOut,
} from "@/lib/types/validation";

const PRIORITY_CONFIG = {
  critical: {
    node: "border border-green-300 bg-white",
    iconBg: "bg-green-100 text-green-800",
    titleColor: "text-zinc-900",
    badge: "bg-green-100 text-green-800 border border-green-200",
    label: "Critical",
  },
  high: {
    node: "border border-green-200 bg-white",
    iconBg: "bg-green-50 text-green-600",
    titleColor: "text-zinc-800",
    badge: "bg-green-50 text-green-600 border border-green-100",
    label: "High",
  },
  medium: {
    node: "border border-zinc-200 bg-white",
    iconBg: "bg-zinc-50 text-zinc-400",
    titleColor: "text-zinc-700",
    badge: "bg-zinc-50 text-zinc-400 border border-zinc-200",
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

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      onClick={onChange}
      title={label}
      className="shrink-0 cursor-pointer focus:outline-none"
    >
      <div
        className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
          checked
            ? "border-violet-500 bg-violet-500"
            : "border-zinc-300 bg-white hover:border-zinc-400"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

type StepView = "details" | "notes";

interface ValidationPlanTreeProps {
  plan: StoredValidationPlan;
  generatedAt: string;
  triggeredByName: string;
  onStepToggle?: (stepOrder: number, completed: boolean) => void;
  onStepNotesChange?: (stepOrder: number, notes: string) => void;
}

export function ValidationPlanTree({
  plan,
  generatedAt,
  triggeredByName,
  onStepToggle,
  onStepNotesChange,
}: ValidationPlanTreeProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(
    () => new Set(plan.validationSteps.filter((s) => s.completed).map((s) => s.order))
  );
  // null = collapsed, 'details' | 'notes' = expanded with that view active
  const [stepView, setStepView] = useState<Map<number, StepView>>(new Map());
  const [localNotes, setLocalNotes] = useState<Map<number, string>>(
    () => new Map(plan.validationSteps.map((s) => [s.order, s.notes ?? ""]))
  );

  const steps = plan.validationSteps;
  const totalSteps = steps.length;

  function toggleStep(order: number) {
    const willBeCompleted = !checkedSteps.has(order);
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
    onStepToggle?.(order, willBeCompleted);
  }

  function toggleDetails(order: number) {
    setStepView((prev) => {
      const next = new Map(prev);
      if (next.get(order) === "details") next.delete(order);
      else next.set(order, "details");
      return next;
    });
  }

  function openNotes(order: number) {
    setStepView((prev) => {
      const next = new Map(prev);
      if (next.get(order) === "notes") next.delete(order);
      else next.set(order, "notes");
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
        <span className="text-xs font-medium text-zinc-400 shrink-0 tabular-nums">
          {completedCount}/{totalSteps} steps done
        </span>
      </div>

      {/* Hypothesis */}
      <div className="rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
          Core Hypothesis
        </p>
        <p className="text-sm font-medium text-blue-900 leading-snug">
          {plan.hypothesis}
        </p>
      </div>

      {/* Validation Steps — vertical stepper */}
      {totalSteps > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3 flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Validation Steps
          </h4>
          <div className="relative">
            {/* Vertical guide line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-zinc-200" />

            <div className="space-y-3">
              {steps.map((step) => {
                const config = PRIORITY_CONFIG[step.priority];
                const Icon = STEP_TYPE_ICONS[step.type] ?? ClipboardList;
                const isChecked = checkedSteps.has(step.order);
                const activeView = stepView.get(step.order) ?? null;
                const hasNotes = !!(localNotes.get(step.order) ?? step.notes);

                return (
                  <div key={step.order} className="flex gap-3">
                    {/* Step icon circle */}
                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isChecked
                          ? "border-violet-300 bg-violet-500"
                          : `border-zinc-200 ${config.iconBg}`
                      }`}
                    >
                      {isChecked ? (
                        <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Step card */}
                    <div
                      className={`flex-1 min-w-0 rounded-xl shadow-sm transition-all duration-200 ${config.node} ${
                        isChecked ? "opacity-55" : ""
                      }`}
                    >
                      <div className="p-3">
                        {/* Badges row */}
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badge}`}>
                            {config.label}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                            {STEP_TYPE_LABELS[step.type]}
                          </span>
                        </div>

                        {/* Checkbox + title */}
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            <Checkbox
                              checked={isChecked}
                              onChange={() => toggleStep(step.order)}
                              label={isChecked ? "Mark incomplete" : "Mark complete"}
                            />
                          </div>
                          <p
                            className={`text-sm font-semibold leading-snug ${config.titleColor} ${
                              isChecked ? "line-through" : ""
                            }`}
                          >
                            {step.title}
                          </p>
                        </div>

                        {/* Controls row: expand toggle + notes icon */}
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            onClick={() => toggleDetails(step.order)}
                            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                          >
                            {activeView === "details" ? (
                              <><ChevronUp className="h-3 w-3" />Hide details</>
                            ) : (
                              <><ChevronDown className="h-3 w-3" />Show details</>
                            )}
                          </button>
                          <button
                            onClick={() => openNotes(step.order)}
                            title={activeView === "notes" ? "Close notes" : "Add notes"}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors cursor-pointer ${
                              activeView === "notes"
                                ? "bg-amber-100 text-amber-700"
                                : hasNotes
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-zinc-400 hover:text-zinc-600"
                            }`}
                          >
                            <StickyNote className="h-3 w-3" />
                            {hasNotes && activeView !== "notes" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded: details view */}
                      {activeView === "details" && (
                        <div className="border-t border-zinc-100 px-3 pb-3 pt-2 space-y-2.5">
                          <ul className="space-y-1">
                            {step.description
                              .split(/(?<=\.)\s+/)
                              .filter(Boolean)
                              .map((sentence, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                                  <p className="text-xs text-zinc-600 leading-relaxed">{sentence}</p>
                                </li>
                              ))}
                          </ul>
                          {plan.successCriteria[step.order - 1] && (
                            <div className="rounded-md bg-green-50 border border-green-100 px-2.5 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1">
                                Success Criterion
                              </p>
                              <p className="text-xs text-green-800 leading-relaxed">
                                {plan.successCriteria[step.order - 1]}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expanded: notes view */}
                      {activeView === "notes" && (
                        <div className="border-t border-zinc-100 px-3 pb-3 pt-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-1.5">
                            Notes
                          </p>
                          <textarea
                            value={localNotes.get(step.order) ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalNotes((prev) => new Map(prev).set(step.order, val));
                            }}
                            onBlur={(e) => onStepNotesChange?.(step.order, e.target.value)}
                            placeholder="Record what you learned, who you spoke to, outcomes…"
                            rows={4}
                            className="w-full resize-none rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-700 placeholder-zinc-300 focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-200 transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Network Reach-Outs */}
      {plan.networkReachOuts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
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
                        <span className="text-sm font-semibold text-zinc-800">
                          {r.contactName}
                        </span>
                      )}
                      {r.position && (
                        <span className="text-xs text-zinc-600">{r.position}</span>
                      )}
                      {r.company && (
                        <span className="text-xs text-zinc-600">· {r.company}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      via{" "}
                      <span className="font-medium text-zinc-700">{r.cofounderName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                        STRENGTH_STYLES[r.connectionStrength]
                      }`}
                    >
                      {r.connectionStrength.charAt(0) +
                        r.connectionStrength.slice(1).toLowerCase()}
                    </span>
                    {r.priority === "high" && (
                      <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[11px] font-medium text-orange-700">
                        Priority
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  <span className="font-medium text-zinc-700">Why: </span>
                  {r.reason}
                </p>
                <div className="rounded-md bg-zinc-50 border border-zinc-100 px-2.5 py-1.5">
                  <p className="text-[11px] font-medium text-zinc-600 mb-0.5">
                    Outreach angle
                  </p>
                  <p className="text-xs text-zinc-700 italic leading-relaxed">
                    &ldquo;{r.outreachAngle}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
        <Clock className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Estimated Timeline
          </p>
          <p className="text-sm font-medium text-zinc-700 mt-0.5">
            {plan.estimatedTimeline}
          </p>
        </div>
      </div>

      {/* Re-evaluation Triggers */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">
            Re-evaluate When...
          </p>
        </div>
        <ul className="space-y-1.5">
          {plan.reevaluationTriggers.map((trigger, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
              <p className="text-xs text-amber-800 leading-relaxed">{trigger}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <p className="text-[11px] text-zinc-400 text-center">
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
