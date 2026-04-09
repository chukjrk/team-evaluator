"use client";

import {
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
  MessageSquare,
  FlaskConical,
  Search,
  Wrench,
  Handshake,
  Rocket,
} from "lucide-react";
import { STEP_TYPE_LABELS, CONNECTION_STRENGTH_STYLES } from "@/lib/types/validation";
import type { StoredValidationPlan, ValidationStep } from "@/lib/types/validation";

interface ValidationPlanPanelProps {
  plan: StoredValidationPlan;
  generatedAt: string;
  triggeredByName: string;
}

const STEP_TYPE_ICONS = {
  "customer-interview": MessageSquare,
  prototype: FlaskConical,
  "market-research": Search,
  technical: Wrench,
  partnership: Handshake,
  "mvp-test": Rocket,
} satisfies Record<ValidationStep["type"], React.ElementType>;

const PRIORITY_STYLES: Record<ValidationStep["priority"], { badge: string }> = {
  critical: { badge: "bg-red-100 text-red-700 border-red-200" },
  high: { badge: "bg-orange-100 text-orange-700 border-orange-200" },
  medium: { badge: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};

export function ValidationPlanPanel({
  plan,
  generatedAt,
  triggeredByName,
}: ValidationPlanPanelProps) {
  return (
    <div className="space-y-5">
      {/* Hypothesis */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">
          Core Hypothesis to Validate
        </p>
        <p className="text-sm font-medium text-blue-900">{plan.hypothesis}</p>
      </div>

      {/* Validation Steps */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-700 mb-2.5">Validation Steps</h4>
        <div className="space-y-2">
          {plan.validationSteps.map((step) => {
            const Icon = STEP_TYPE_ICONS[step.type];
            const priorityStyle = PRIORITY_STYLES[step.priority] ?? PRIORITY_STYLES.medium;
            return (
              <div
                key={step.order}
                className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-800">{step.title}</span>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${priorityStyle.badge}`}
                    >
                      {step.priority}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                      {STEP_TYPE_LABELS[step.type]}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Contact Groups */}
      {(plan.networkContactGroups ?? []).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-700 mb-2.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Network Contacts
          </h4>
          <div className="space-y-4">
            {(plan.networkContactGroups ?? []).map((group) => (
              <div key={group.groupLabel}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                    {group.groupLabel}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                    {group.contacts.length}
                  </span>
                  {group.priority === "high" && (
                    <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                      High priority
                    </span>
                  )}
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
                {/* Summary */}
                <p className="text-[11px] text-zinc-500 leading-relaxed mb-1.5 pl-1">{group.summary}</p>
                {/* Outreach angle */}
                <div className="rounded-md bg-zinc-50 border border-zinc-100 px-2.5 py-1.5 mb-1.5">
                  <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Outreach angle</p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed italic">&ldquo;{group.outreachAngle}&rdquo;</p>
                </div>
                {/* Steps this group serves */}
                {group.forSteps.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 pl-1">
                    {group.forSteps.map((stepOrder) => {
                      const step = plan.validationSteps.find((s) => s.order === stepOrder);
                      return step ? (
                        <span key={stepOrder} className="rounded-full bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[10px] text-violet-700">
                          Step {stepOrder}: {step.title}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                {/* Contact rows */}
                <div className="space-y-1.5 pl-2 border-l-2 border-zinc-100">
                  {group.contacts.map((c, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {c.contactName && (
                            <span className="text-xs font-medium text-zinc-800">{c.contactName}</span>
                          )}
                          {c.position && (
                            <span className="text-[11px] text-zinc-400">{c.contactName ? "·" : ""} {c.position}</span>
                          )}
                          {c.company && (
                            <span className="text-[11px] text-zinc-400">· {c.company}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          via <span className="font-medium text-zinc-500">{c.cofounderName}</span>
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CONNECTION_STRENGTH_STYLES[c.connectionStrength]}`}>
                        {c.connectionStrength.charAt(0) + c.connectionStrength.slice(1).toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Criteria */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-700 mb-2.5 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Success Criteria
        </h4>
        <ul className="space-y-1.5">
          {plan.successCriteria.map((criterion, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              </span>
              <p className="text-[11px] text-zinc-600 leading-relaxed">{criterion}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline + Re-evaluation Triggers */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
          <Clock className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Estimated Timeline
            </p>
            <p className="text-xs font-medium text-zinc-700 mt-0.5">{plan.estimatedTimeline}</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <RefreshCw className="h-3 w-3 text-amber-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
              Re-evaluate When...
            </p>
          </div>
          <ul className="space-y-1">
            {plan.reevaluationTriggers.map((trigger, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                <p className="text-[11px] text-amber-800 leading-relaxed">{trigger}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[10px] text-zinc-400 text-center">
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
