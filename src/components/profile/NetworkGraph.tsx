"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NetworkEntry {
  id: string;
  industryId: string;
  industry: { id: string; label: string };
  estimatedContacts: number;
  notableRoles: string[];
  connectionStrength: "WARM" | "MODERATE" | "COLD";
}

interface Props {
  entries: NetworkEntry[];
  onEdit: (entry: NetworkEntry) => void;
  onDelete: (id: string) => void;
}

const STRENGTH_CONFIG = {
  WARM: { fill: "#bbf7d0", stroke: "#16a34a", text: "#15803d", label: "Warm" },
  MODERATE: { fill: "#fef08a", stroke: "#ca8a04", text: "#92400e", label: "Moderate" },
  COLD: { fill: "#e4e4e7", stroke: "#71717a", text: "#52525b", label: "Cold" },
} as const;

const INDUSTRY_ORDER = [
  "enterprise-saas", "consumer-apps",
  "media-entertainment", "ar-vr-spatial",
  "blockchain-web3", "fintech-banking",
  "retail-ecommerce", "logistics-supply-chain",
  "automotive-mobility", "travel-hospitality",
  "food-beverage", "foodtech-restauranttech",
  "agriculture-agtech", "climate-energy",
  "real-estate", "construction-proptech",
  "hardware-manufacturing", "healthcare-medtech",
  "biotech-pharma", "sports-fitness-wellness",
  "edtech", "workforce-hrtech",
  "future-of-work", "government-civictech",
  "social-impact-nonprofit", "other",
];

function industryOrderIndex(id: string): number {
  const idx = INDUSTRY_ORDER.indexOf(id);
  return idx === -1 ? INDUSTRY_ORDER.length : idx;
}

// SVG geometry — labels live within the viewBox, no overflow needed
const SVG_SIZE = 560;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const MAX_R = 138; // radar chart radius
const MIN_DATA_R = MAX_R * 0.08; // floor so all segments are at least visible
const GRID_LEVELS = 4;
// Stagger labels: even axes closer, odd axes farther out
const LABEL_R_NEAR = MAX_R + 18;
const LABEL_R_FAR = MAX_R + 34;
const DOT_R = 3; // fixed tiny dot — size info already encoded by radial distance

function axisAngle(i: number, n: number): number {
  return (2 * Math.PI * i) / n - Math.PI / 2;
}

function polarToXY(angle: number, r: number): [number, number] {
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function dataRadius(contacts: number, max: number): number {
  return Math.max((contacts / Math.max(max, 1)) * MAX_R, MIN_DATA_R);
}

function labelAnchor(angle: number): "start" | "middle" | "end" {
  const cos = Math.cos(angle);
  if (cos > 0.25) return "start";
  if (cos < -0.25) return "end";
  return "middle";
}

function formatLabel(label: string): string {
  return label
    .replace(" / E-Commerce", "")
    .replace(" / Supply Chain", "")
    .replace(" / Pharma", "")
    .replace("& Wellness", "")
    .replace(" / Nonprofit", "")
    .replace("Restaurant", "Rest.");
}

function truncate(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NetworkGraph({ entries, onEdit, onDelete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popover, setPopover] = useState<{
    entry: NetworkEntry;
    px: number;
    py: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((es) => setWidth(es[0].contentRect.width));
    ro.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const scale = width / SVG_SIZE;

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) => industryOrderIndex(a.industryId) - industryOrderIndex(b.industryId),
      ),
    [entries],
  );

  const n = sorted.length;
  const maxContacts = useMemo(
    () => Math.max(...sorted.map((e) => e.estimatedContacts), 1),
    [sorted],
  );

  const points = useMemo(() => {
    return sorted.map((entry, i) => {
      const angle = axisAngle(i, n);
      const dr = dataRadius(entry.estimatedContacts, maxContacts);
      const [x, y] = polarToXY(angle, dr);
      // Stagger labels: odd axes go farther out
      const labelR = i % 2 === 1 ? LABEL_R_FAR : LABEL_R_NEAR;
      const [lx, ly] = polarToXY(angle, labelR);
      const anchor = labelAnchor(angle);
      return { entry, i, angle, dr, x, y, lx, ly, anchor };
    });
  }, [sorted, n, maxContacts]);

  const dataPolygon = useMemo(() => {
    if (n < 2) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
  }, [points, n]);

  const outerPolygon = useMemo(() => {
    if (n < 3) return "";
    return (
      Array.from({ length: n }, (_, i) => {
        const [x, y] = polarToXY(axisAngle(i, n), MAX_R);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      }).join(" ") + " Z"
    );
  }, [n]);

  const gridPolygons = useMemo(() => {
    if (n < 3) return [];
    return Array.from({ length: GRID_LEVELS }, (_, level) => {
      const r = (MAX_R * (level + 1)) / GRID_LEVELS;
      return (
        Array.from({ length: n }, (_, i) => {
          const [x, y] = polarToXY(axisAngle(i, n), r);
          return `${i === 0 ? "M" : "L"}${x},${y}`;
        }).join(" ") + " Z"
      );
    });
  }, [n]);

  const total = entries.reduce((s, e) => s + e.estimatedContacts, 0);
  const strengths = (["WARM", "MODERATE", "COLD"] as const).filter((s) =>
    entries.some((e) => e.connectionStrength === s),
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-400 py-4">
        No network entries yet. Add segments of your network to help score idea-network fit.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-end">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
          <span className="font-semibold text-zinc-700">
            {entries.length} {entries.length === 1 ? "segment" : "segments"} ·{" "}
            ~{total.toLocaleString()} contacts
          </span>
          <span className="text-zinc-300 hidden sm:inline">|</span>
          {strengths.map((s) => {
            const cfg = STRENGTH_CONFIG[s];
            const cnt = entries
              .filter((e) => e.connectionStrength === s)
              .reduce((sum, e) => sum + e.estimatedContacts, 0);
            return (
              <span key={s} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border"
                  style={{ background: cfg.fill, borderColor: cfg.stroke }}
                />
                <span style={{ color: cfg.text }} className="font-medium">{cfg.label}</span>
                <span className="text-zinc-400">~{cnt.toLocaleString()}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Radar chart — fully self-contained, no overflow */}
      <div
        ref={containerRef}
        className="relative flex w-full items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50"
      >
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          width={width}
          height={width}
          style={{ display: "block" }}
          onClick={(e) => {
            if ((e.target as SVGElement).tagName === "svg") setPopover(null);
          }}
        >
          <defs>
            <radialGradient id="net-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
            </radialGradient>
          </defs>

          {/* Background polygon */}
          {n >= 3 && <path d={outerPolygon} fill="#f0f0f1" stroke="none" />}

          {/* Grid rings */}
          {gridPolygons.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i === GRID_LEVELS - 1 ? "#d4d4d8" : "#e4e4e7"}
              strokeWidth={i === GRID_LEVELS - 1 ? 1.25 : 0.75}
            />
          ))}

          {/* Axis spokes */}
          {points.map((p) => {
            const [ax, ay] = polarToXY(p.angle, MAX_R);
            const isHov = p.entry.id === hoveredId;
            return (
              <line
                key={`axis-${p.entry.id}`}
                x1={CX} y1={CY} x2={ax} y2={ay}
                stroke={isHov ? "#a1a1aa" : "#e4e4e7"}
                strokeWidth={isHov ? 1.5 : 0.75}
                style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
              />
            );
          })}

          {/* Ring scale labels */}
          {n >= 3 &&
            Array.from({ length: GRID_LEVELS }, (_, i) => {
              const r = (MAX_R * (i + 1)) / GRID_LEVELS;
              const val = Math.round((maxContacts * (i + 1)) / GRID_LEVELS);
              const label = val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : `${val}`;
              return (
                <text
                  key={`ring-${i}`}
                  x={CX + 4} y={CY - r + 2}
                  fontSize={7.5} fill="#b4b4b8"
                  dominantBaseline="auto"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {label}
                </text>
              );
            })}

          {/* Data polygon */}
          {n >= 3 && (
            <path
              d={dataPolygon}
              fill="url(#net-fill)"
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          )}
          {n === 2 && (
            <line
              x1={points[0].x} y1={points[0].y}
              x2={points[1].x} y2={points[1].y}
              stroke="#60a5fa" strokeWidth={1.5}
            />
          )}

          {/* Axis labels — hover-interactive */}
          {points.map((p) => {
            const isHov = p.entry.id === hoveredId;
            const isSel = popover?.entry.id === p.entry.id;
            const cfg = STRENGTH_CONFIG[p.entry.connectionStrength];
            const label = truncate(formatLabel(p.entry.industry.label), 17);
            return (
              <text
                key={`label-${p.entry.id}`}
                x={p.lx} y={p.ly}
                textAnchor={p.anchor}
                dominantBaseline="middle"
                fontSize={9}
                fontWeight={isHov || isSel ? 700 : 500}
                fill={isHov || isSel ? cfg.text : "#71717a"}
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "fill 0.15s, font-weight 0.15s",
                }}
                onPointerEnter={() => setHoveredId(p.entry.id)}
                onPointerLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopover(
                    popover?.entry.id === p.entry.id
                      ? null
                      : { entry: p.entry, px: p.x * scale, py: p.y * scale },
                  );
                }}
              >
                {label}
              </text>
            );
          })}

          {/* Data point dots — tiny markers at each data position */}
          {points.map((p) => {
            const cfg = STRENGTH_CONFIG[p.entry.connectionStrength];
            const isHov = p.entry.id === hoveredId;
            const isSel = popover?.entry.id === p.entry.id;
            return (
              <circle
                key={`dot-${p.entry.id}`}
                cx={p.x} cy={p.y}
                r={isHov || isSel ? DOT_R + 1.5 : DOT_R}
                fill={cfg.fill}
                stroke={cfg.stroke}
                strokeWidth={1.5}
                style={{ cursor: "pointer", transition: "r 0.15s" }}
                onPointerEnter={() => setHoveredId(p.entry.id)}
                onPointerLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopover(
                    popover?.entry.id === p.entry.id
                      ? null
                      : { entry: p.entry, px: p.x * scale, py: p.y * scale },
                  );
                }}
              />
            );
          })}

          {/* Center point */}
          <circle cx={CX} cy={CY} r={2.5} fill="#a1a1aa" />
        </svg>

        {/* Hover tooltip — triggered by dot or label */}
        {hoveredId && !popover &&
          (() => {
            const p = points.find((pt) => pt.entry.id === hoveredId);
            if (!p) return null;
            const cfg = STRENGTH_CONFIG[p.entry.connectionStrength];
            const tipX = p.x * scale;
            const tipY = p.y * scale;
            return (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-md backdrop-blur-sm"
                style={{
                  left: Math.min(Math.max(tipX - 70, 6), width - 154),
                  top: Math.max(tipY - 62, 6),
                  maxWidth: 148,
                }}
              >
                <p className="font-semibold text-zinc-800 truncate">{p.entry.industry.label}</p>
                <p className="mt-0.5" style={{ color: cfg.text }}>
                  {cfg.label} · ~{p.entry.estimatedContacts.toLocaleString()} contacts
                </p>
                {p.entry.notableRoles.length > 0 && (
                  <p className="mt-0.5 text-zinc-400 truncate">
                    {p.entry.notableRoles.slice(0, 3).join(", ")}
                  </p>
                )}
                <p className="mt-1 text-zinc-300 italic">click to manage</p>
              </div>
            );
          })()}

        {/* Click popover (edit / delete) */}
        {popover && (
          <div
            className="absolute z-20 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-lg text-xs"
            style={{
              left: Math.min(Math.max(popover.px - 90, 6), width - 190),
              top: popover.py + (DOT_R + 2) * scale + 6,
              width: 184,
            }}
          >
            <p className="font-semibold text-zinc-800 mb-0.5 truncate">
              {popover.entry.industry.label}
            </p>
            <p className="text-zinc-500 mb-1">
              ~{popover.entry.estimatedContacts.toLocaleString()} contacts ·{" "}
              <span style={{ color: STRENGTH_CONFIG[popover.entry.connectionStrength].text }}>
                {STRENGTH_CONFIG[popover.entry.connectionStrength].label}
              </span>
            </p>
            {popover.entry.notableRoles.length > 0 && (
              <p className="text-zinc-400 mb-1.5 truncate">
                {popover.entry.notableRoles.join(", ")}
              </p>
            )}
            <div className="flex gap-1.5 pt-1 border-t border-zinc-100">
              <Button
                variant="ghost" size="sm"
                className="h-6 px-2 text-xs gap-1 flex-1"
                onClick={() => { setPopover(null); onEdit(popover.entry); }}
              >
                <Pencil className="h-3 w-3" /> Edit
              </Button>
              <Button
                variant="ghost" size="sm"
                className="h-6 px-2 text-xs gap-1 flex-1 text-red-500 hover:text-red-600"
                onClick={() => { setPopover(null); onDelete(popover.entry.id); }}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
