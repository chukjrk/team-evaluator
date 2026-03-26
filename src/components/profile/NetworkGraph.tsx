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
  WARM: { fill: "#bbf7d0", stroke: "#16a34a", text: "#15803d", label: "Warm", lineColor: "#86efac", glow: "rgba(22,163,74,0.35)" },
  MODERATE: { fill: "#fef08a", stroke: "#ca8a04", text: "#92400e", label: "Moderate", lineColor: "#fde047", glow: "rgba(202,138,4,0.35)" },
  COLD: { fill: "#e4e4e7", stroke: "#71717a", text: "#52525b", label: "Cold", lineColor: "#d4d4d8", glow: "rgba(113,113,122,0.3)" },
} as const;

const CENTER_R = 26;
const MIN_NODE_R = 8;
const MAX_NODE_R = 42;
const RING_CAP = 6;
const PAD = 30;

interface NodePos {
  x: number;
  y: number;
  r: number;
  orbitR: number;
  baseAngle: number;
  entry: NetworkEntry;
}

function scaleRadius(contacts: number, maxContacts: number): number {
  if (maxContacts === 0) return MIN_NODE_R;
  const t = Math.sqrt(contacts) / Math.sqrt(maxContacts);
  return MIN_NODE_R + t * (MAX_NODE_R - MIN_NODE_R);
}

function layoutNodes(
  entries: NetworkEntry[],
  cx: number,
  cy: number,
  orbitMin: number,
  orbitStep: number,
): NodePos[] {
  if (entries.length === 0) return [];
  const maxContacts = Math.max(...entries.map((e) => e.estimatedContacts), 1);
  const sorted = [...entries].sort((a, b) => b.estimatedContacts - a.estimatedContacts);

  const rings: NetworkEntry[][] = [];
  let i = 0;
  while (i < sorted.length) {
    rings.push(sorted.slice(i, i + RING_CAP));
    i += RING_CAP;
  }

  const positions: NodePos[] = [];
  rings.forEach((ring, ringIdx) => {
    const orbitR = orbitMin + ringIdx * orbitStep;
    ring.forEach((entry, j) => {
      const angle = (2 * Math.PI * j) / ring.length - Math.PI / 2;
      positions.push({
        x: cx + orbitR * Math.cos(angle),
        y: cy + orbitR * Math.sin(angle),
        r: scaleRadius(entry.estimatedContacts, maxContacts),
        orbitR,
        baseAngle: angle,
        entry,
      });
    });
  });
  return positions;
}

function truncate(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NetworkGraph({ entries, onEdit, onDelete }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(520);

  // Per-node angle overrides from drag
  const [nodeAngles, setNodeAngles] = useState<Record<string, number>>({});

  // Interaction state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [popover, setPopover] = useState<{
    svgX: number;
    svgY: number;
    r: number;
    entry: NetworkEntry;
  } | null>(null);

  // Refs for drag (avoid stale closures in global handlers)
  const draggingRef = useRef<{ id: string; orbitR: number } | null>(null);
  const didDragRef = useRef(false);
  const layoutRef = useRef({ cx: 0, cy: 0, svgSize: 0 });

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((es) => setWidth(es[0].contentRect.width));
    ro.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // ── Layout computation ────────────────────────────────────────────────────
  const ringCount = Math.ceil(entries.length / RING_CAP);
  const availableR = width / 2 - MAX_NODE_R - PAD;
  const orbitMin = Math.max(70, Math.min(100, availableR / Math.max(ringCount, 1)));
  const orbitStep = ringCount > 1 ? (availableR - orbitMin) / (ringCount - 1) : 0;
  const maxOrbit = orbitMin + (ringCount - 1) * orbitStep;
  const svgSize = (maxOrbit + MAX_NODE_R + PAD) * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  // Keep layoutRef current for global handlers
  layoutRef.current = { cx, cy, svgSize };

  const baseNodes = useMemo(
    () => layoutNodes(entries, cx, cy, orbitMin, orbitStep),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, cx, cy, orbitMin, orbitStep],
  );

  // Apply dragged angle overrides
  const nodes = useMemo(() => {
    return baseNodes.map((node) => {
      const angle = nodeAngles[node.entry.id];
      if (angle !== undefined) {
        return {
          ...node,
          x: cx + node.orbitR * Math.cos(angle),
          y: cy + node.orbitR * Math.sin(angle),
        };
      }
      return node;
    });
  }, [baseNodes, nodeAngles, cx, cy]);

  // ── Global pointer handlers (registered once via empty deps + refs) ───────
  useEffect(() => {
    function svgCoords(clientX: number, clientY: number) {
      const el = svgRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const { svgSize } = layoutRef.current;
      return {
        x: ((clientX - rect.left) / rect.width) * svgSize,
        y: ((clientY - rect.top) / rect.height) * svgSize,
      };
    }

    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      didDragRef.current = true;
      const { id, orbitR } = draggingRef.current;
      const { cx, cy } = layoutRef.current;
      const pt = svgCoords(e.clientX, e.clientY);
      const angle = Math.atan2(pt.y - cy, pt.x - cx);
      setNodeAngles((prev) => ({ ...prev, [id]: angle }));
      // Keep popover pinned to node if open
      setPopover((prev) =>
        prev?.entry.id === id
          ? { ...prev, svgX: cx + orbitR * Math.cos(angle), svgY: cy + orbitR * Math.sin(angle) }
          : prev,
      );
    }

    function onPointerUp() {
      if (draggingRef.current) {
        draggingRef.current = null;
        setIsDragging(false);
      }
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []); // intentionally empty — uses refs

  // ── Helpers ───────────────────────────────────────────────────────────────
  const scale = width / svgSize; // SVG → container px

  function toContainerPx(svgVal: number) {
    return svgVal * scale;
  }

  function startDrag(e: React.PointerEvent, node: NodePos) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    didDragRef.current = false;
    draggingRef.current = { id: node.entry.id, orbitR: node.orbitR };
    setIsDragging(true);
    setHoveredId(node.entry.id);
  }

  function handleNodeClick(node: NodePos) {
    if (didDragRef.current) { didDragRef.current = false; return; }
    if (selected === node.entry.id) {
      setSelected(null);
      setPopover(null);
    } else {
      setSelected(node.entry.id);
      setPopover({ svgX: node.x, svgY: node.y, r: node.r, entry: node.entry });
    }
  }

  // ── Legend stats ──────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mt-2 space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-end">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
          <span className="font-semibold text-zinc-700">
            {entries.length} {entries.length === 1 ? "segment" : "segments"} · ~{total.toLocaleString()} contacts
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

      {/* Graph container */}
      <div
        ref={containerRef}
        className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50"
        style={{ cursor: isDragging ? "grabbing" : "default" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          width={width}
          height={width}
          style={{ touchAction: "none", display: "block" }}
          onClick={(e) => {
            if (
              (e.target as SVGElement).tagName === "svg" ||
              (e.target as SVGElement).id === "graph-bg"
            ) {
              setSelected(null);
              setPopover(null);
            }
          }}
        >
          {/* SVG filter defs for glow */}
          <defs>
            {(["WARM", "MODERATE", "COLD"] as const).map((s) => (
              <filter key={s} id={`glow-${s}`} x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={STRENGTH_CONFIG[s].stroke} floodOpacity="0.5" />
              </filter>
            ))}
          </defs>

          <rect id="graph-bg" x={0} y={0} width={svgSize} height={svgSize} fill="transparent" />

          {/* Orbit rings */}
          {Array.from({ length: ringCount }, (_, i) => (
            <circle
              key={i}
              cx={cx} cy={cy}
              r={orbitMin + i * orbitStep}
              fill="none"
              stroke="#e4e4e7"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          ))}

          {/* Edges */}
          {nodes.map((node) => {
            const cfg = STRENGTH_CONFIG[node.entry.connectionStrength];
            const isActive = node.entry.id === hoveredId || node.entry.id === selected;
            const dimmed = hoveredId !== null && !isDragging && node.entry.id !== hoveredId;
            return (
              <line
                key={`line-${node.entry.id}`}
                x1={cx} y1={cy} x2={node.x} y2={node.y}
                stroke={isActive ? cfg.stroke : cfg.lineColor}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeDasharray={node.entry.connectionStrength === "COLD" ? "5 4" : undefined}
                opacity={dimmed ? 0.2 : 1}
                style={{ transition: "opacity 0.2s ease, stroke 0.15s ease, stroke-width 0.15s ease" }}
              />
            );
          })}

          {/* Industry nodes */}
          {nodes.map((node) => {
            const cfg = STRENGTH_CONFIG[node.entry.connectionStrength];
            const isHovered = node.entry.id === hoveredId;
            const isSelected = node.entry.id === selected;
            const dimmed = hoveredId !== null && !isDragging && !isHovered;
            const label = truncate(node.entry.industry.label, 13);
            const contactsLabel =
              node.entry.estimatedContacts >= 1000
                ? `${(node.entry.estimatedContacts / 1000).toFixed(1)}k`
                : `${node.entry.estimatedContacts}`;

            return (
              <g
                key={node.entry.id}
                // Outer g: positions the node
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: isDragging && isHovered ? "grabbing" : "grab" }}
                onPointerDown={(e) => startDrag(e, node)}
                onClick={() => handleNodeClick(node)}
                onPointerEnter={() => { if (!isDragging) setHoveredId(node.entry.id); }}
                onPointerLeave={() => { if (!isDragging) setHoveredId(null); }}
              >
                {/* Inner g: scale + glow transitions */}
                <g
                  style={{
                    transformOrigin: "0 0",
                    transform: isHovered ? "scale(1.13)" : "scale(1)",
                    transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease",
                    opacity: dimmed ? 0.35 : 1,
                    filter: isHovered
                      ? `drop-shadow(0 0 7px ${cfg.glow}) drop-shadow(0 0 14px ${cfg.glow})`
                      : undefined,
                  }}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle r={node.r + 5} fill="none" stroke={cfg.stroke} strokeWidth={2} opacity={0.5} />
                  )}
                  {/* Main circle */}
                  <circle
                    r={node.r}
                    fill={cfg.fill}
                    stroke={cfg.stroke}
                    strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                  />
                  {/* Labels — hidden on tiny nodes; tooltip covers them */}
                  {node.r >= 18 && (
                    <text
                      y={-Math.round(node.r * 0.28)}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={cfg.text}
                      fontSize={node.r > 30 ? 10 : 8}
                      fontWeight={600}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {label}
                    </text>
                  )}
                  {node.r >= 14 && (
                    <text
                      y={node.r >= 18 ? Math.round(node.r * 0.3) : 0}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={cfg.text}
                      fontSize={node.r > 30 ? 11 : 8}
                      fontWeight={500}
                      opacity={0.85}
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {contactsLabel}
                    </text>
                  )}
                </g>
              </g>
            );
          })}

          {/* Center node (always on top) */}
          <circle cx={cx} cy={cy} r={CENTER_R} fill="#1c1917" />
          <text
            x={cx} y={cy + 1}
            textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize={12} fontWeight={700}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            You
          </text>
        </svg>

        {/* Hover tooltip */}
        {hoveredId && !isDragging && !selected && (() => {
          const node = nodes.find((n) => n.entry.id === hoveredId);
          if (!node) return null;
          const cfg = STRENGTH_CONFIG[node.entry.connectionStrength];
          const tipX = toContainerPx(node.x);
          const tipY = toContainerPx(node.y - node.r);
          return (
            <div
              className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-md backdrop-blur-sm"
              style={{
                left: Math.min(Math.max(tipX - 70, 6), width - 150),
                top: Math.max(tipY - 52, 6),
                maxWidth: 144,
              }}
            >
              <p className="font-semibold text-zinc-800 truncate">{node.entry.industry.label}</p>
              <p className="mt-0.5" style={{ color: cfg.text }}>
                {cfg.label} · ~{node.entry.estimatedContacts.toLocaleString()}
              </p>
              {node.entry.notableRoles.length > 0 && (
                <p className="mt-0.5 text-zinc-400 truncate">{node.entry.notableRoles.slice(0, 3).join(", ")}</p>
              )}
              <p className="mt-1 text-zinc-300 italic">click to manage</p>
            </div>
          );
        })()}

        {/* Click popover (edit / delete) */}
        {popover && !isDragging && (
          <div
            className="absolute z-20 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-lg text-xs"
            style={{
              left: Math.min(Math.max(toContainerPx(popover.svgX) - 90, 6), width - 190),
              top: toContainerPx(popover.svgY + popover.r) + 10,
              width: 184,
            }}
          >
            <p className="font-semibold text-zinc-800 mb-0.5 truncate">{popover.entry.industry.label}</p>
            <p className="text-zinc-500 mb-1">
              ~{popover.entry.estimatedContacts.toLocaleString()} contacts ·{" "}
              <span style={{ color: STRENGTH_CONFIG[popover.entry.connectionStrength].text }}>
                {STRENGTH_CONFIG[popover.entry.connectionStrength].label}
              </span>
            </p>
            {popover.entry.notableRoles.length > 0 && (
              <p className="text-zinc-400 mb-1.5 truncate">{popover.entry.notableRoles.join(", ")}</p>
            )}
            <div className="flex gap-1.5 pt-1 border-t border-zinc-100">
              <Button
                variant="ghost" size="sm"
                className="h-6 px-2 text-xs gap-1 flex-1"
                onClick={() => { setSelected(null); setPopover(null); onEdit(popover.entry); }}
              >
                <Pencil className="h-3 w-3" /> Edit
              </Button>
              <Button
                variant="ghost" size="sm"
                className="h-6 px-2 text-xs gap-1 flex-1 text-red-500 hover:text-red-600"
                onClick={() => { setSelected(null); setPopover(null); onDelete(popover.entry.id); }}
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
