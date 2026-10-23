import { useMemo, useRef, useState } from "react";
import {
  EVENT_COLORS,
  RISK_COLORS,
  type RiskZone,
  type WellEvent,
} from "../data/nwis";
import { Badge, Toggle } from "./ui";
import { cn } from "../utils/cn";
import { useActiveWell } from "../state/ActiveWellContext";

const MIN_D = 1000;
const MAX_D = 4500;

const LITHO: Record<string, { fill: string; stroke: string; pattern: string }> = {
  sand: { fill: "#3a2f16", stroke: "#6b5320", pattern: "dots" },
  shale: { fill: "#1d2836", stroke: "#33455c", pattern: "lines" },
  clay: { fill: "#26232f", stroke: "#463f56", pattern: "lines" },
  coal: { fill: "#15171a", stroke: "#2a2e34", pattern: "solid" },
  limestone: { fill: "#1b3033", stroke: "#356166", pattern: "brick" },
  reservoir: { fill: "#3d2a12", stroke: "#9a6b1e", pattern: "dots" },
};

export type ProfileView = "risk" | "events" | "formation" | "comparison";

export default function DepthProfile({
  view,
  onSelectRisk,
  onSelectEvent,
  height = 470,
  compactControls = false,
}: {
  view: ProfileView;
  onSelectRisk?: (z: RiskZone) => void;
  onSelectEvent?: (e: WellEvent) => void;
  height?: number;
  compactControls?: boolean;
}) {
  const { activeWell, analytics, nearbyWells, historicalEvents, historicalFormations } = useActiveWell();
  const currentDepth = activeWell.liveParameters?.depth ?? 0;

  // Window bounds
  const [win, setWin] = useState<[number, number]>([2800, 3600]);
  const [show, setShow] = useState({ formations: true, events: true, risks: true });
  const [hoverEvt, setHoverEvt] = useState<WellEvent | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const dragRef = useRef<{ y: number; win: [number, number] } | null>(null);

  const [top, bot] = win;
  const span = bot - top;
  const yOf = (d: number) => ((d - top) / span) * height;

  const clampWin = (t: number, b: number): [number, number] => {
    const s = Math.max(80, Math.min(MAX_D - MIN_D, b - t));
    const nt = Math.max(MIN_D, Math.min(MAX_D - s, t));
    return [nt, nt + s];
  };

  const zoom = (factor: number) => {
    const c = (top + bot) / 2;
    const s = (bot - top) * factor;
    setWin(clampWin(c - s / 2, c + s / 2));
  };

  const step = span > 500 ? 100 : span > 250 ? 50 : span > 120 ? 25 : 10;
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let d = Math.ceil(top / step) * step; d <= bot; d += step) out.push(d);
    return out;
  }, [top, bot, step]);

  const visFormations = historicalFormations.filter((f) => f.base > top && f.top < bot);
  const visRisks = analytics.riskZones.filter((r) => r.base > top && r.top < bot);
  const activeEvents = historicalEvents.filter((e) => e.depth >= top - 5 && e.depth <= bot + 5);

  const showEvents = show.events && view !== "formation";
  const showRisks = show.risks && (view === "risk" || view === "comparison");
  const offsetWells = nearbyWells.slice(0, 3);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-3 py-2">
        <div className="flex items-center gap-3">
          <Toggle
            checked={show.formations}
            onChange={(v) => setShow((s) => ({ ...s, formations: v }))}
            label="Formations"
            color="#a16207"
          />
          <Toggle
            checked={show.events}
            onChange={(v) => setShow((s) => ({ ...s, events: v }))}
            label="Historical Incidents"
            color="#f5a524"
          />
          <Toggle
            checked={show.risks}
            onChange={(v) => setShow((s) => ({ ...s, risks: v }))}
            label="Predicted Risk"
            color="#ef4444"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {!compactControls && (
            <span className="font-mono text-[9.5px] text-fog-500">
              {top.toFixed(0)}–{bot.toFixed(0)} m
            </span>
          )}
          <div className="flex overflow-hidden rounded-sm border border-line">
            <button
              onClick={() => zoom(0.6)}
              className="h-5 w-6 cursor-pointer border-r border-line-soft text-[11px] text-fog-400 hover:bg-ink-750 hover:text-sky-300"
            >
              +
            </button>
            <button
              onClick={() => zoom(1.6)}
              className="h-5 w-6 cursor-pointer border-r border-line-soft text-[11px] text-fog-400 hover:bg-ink-750 hover:text-sky-300"
            >
              −
            </button>
            <button
              onClick={() => setWin([2800, 3600])}
              className="h-5 cursor-pointer px-1.5 font-mono text-[9px] text-fog-400 hover:bg-ink-750 hover:text-sky-300"
            >
              FIT
            </button>
          </div>
        </div>
      </div>

      {/* Profile view */}
      <div
        className="relative flex cursor-ns-resize overflow-hidden"
        style={{ height }}
        onWheel={(e) => {
          const f = e.deltaY > 0 ? 1.12 : 0.89;
          const c = (top + bot) / 2;
          const s = (bot - top) * f;
          setWin(clampWin(c - s / 2, c + s / 2));
        }}
        onMouseDown={(e) => (dragRef.current = { y: e.clientY, win })}
        onMouseMove={(e) => {
          if (!dragRef.current) return;
          const dy = ((e.clientY - dragRef.current.y) / height) * span;
          setWin(clampWin(dragRef.current.win[0] - dy, dragRef.current.win[1] - dy));
        }}
        onMouseUp={() => (dragRef.current = null)}
        onMouseLeave={() => (dragRef.current = null)}
      >
        {/* Depth axis */}
        <div className="relative w-[58px] shrink-0 border-r border-line-soft bg-ink-900/60">
          {ticks.map((d) => (
            <div key={d} className="absolute right-0 flex w-full items-center justify-end gap-1 pr-1.5" style={{ top: yOf(d) - 6 }}>
              <span className="font-mono text-[9.5px] text-fog-500">{d.toLocaleString()}</span>
              <i className="h-px w-1.5 bg-fog-500/60" />
            </div>
          ))}
          <div className="absolute top-1 left-1.5 font-mono text-[8.5px] tracking-widest text-fog-500/70">MD·m</div>
        </div>

        {/* Formation column */}
        {show.formations && (
          <div className="relative w-[104px] shrink-0 border-r border-line-soft bg-ink-950/40">
            {visFormations.length > 0 ? (
              visFormations.map((f) => {
                const y0 = Math.max(0, yOf(f.top));
                const y1 = Math.min(height, yOf(f.base));
                const l = LITHO[f.litho] || LITHO.reservoir;
                return (
                  <div
                    key={f.id}
                    className="group absolute right-0 left-0 overflow-hidden border-b border-black/50"
                    style={{ top: y0, height: Math.max(1, y1 - y0), background: l.fill }}
                    title={`${f.name} · ${f.top}–${f.base} m`}
                  >
                    <div className="relative px-1.5 py-1">
                      <div className="truncate text-[10px] leading-tight font-medium text-fog-100/90">{f.name}</div>
                      {y1 - y0 > 34 && (
                        <div className="mt-0.5 font-mono text-[8.5px] text-fog-300/70">
                          {f.top}–{f.base}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center p-2 text-center text-[9px] text-fog-500">
                No formation tops
              </div>
            )}
            <div className="pointer-events-none absolute top-1 right-1 font-mono text-[8px] tracking-wider text-fog-500/70">
              LITHO
            </div>
          </div>
        )}

        {/* Main track */}
        <div className="relative min-w-0 flex-1 bg-ink-900/30">
          <div className="tech-grid-fine pointer-events-none absolute inset-0 opacity-60" />

          {/* Risk bands */}
          {showRisks &&
            visRisks.map((r) => {
              const y0 = Math.max(0, yOf(r.top));
              const y1 = Math.min(height, yOf(r.base));
              const c = RISK_COLORS[r.level];
              const on = hoverZone === r.id;
              return (
                <div
                  key={r.id}
                  className="absolute right-0 left-0 cursor-pointer transition-all"
                  style={{
                    top: y0,
                    height: Math.max(3, y1 - y0),
                    background: `linear-gradient(90deg, ${c}${on ? "3a" : "22"}, ${c}0a)`,
                    borderTop: `1px solid ${c}`,
                    borderBottom: `1px dashed ${c}66`,
                  }}
                  onMouseEnter={() => setHoverZone(r.id)}
                  onMouseLeave={() => setHoverZone(null)}
                  onClick={() => onSelectRisk?.(r)}
                >
                  {y1 - y0 > 16 && (
                    <div className="absolute top-0.5 right-1.5 flex items-center gap-1.5">
                      <span className="font-mono text-[9px] tracking-wide" style={{ color: c }}>
                        {r.type.toUpperCase()} · {r.similarity}% EVIDENCE
                      </span>
                      <i className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                    </div>
                  )}
                </div>
              );
            })}

          {/* Casing shoe */}
          {activeWell.casingShoe && activeWell.casingShoe > top && activeWell.casingShoe < bot && (
            <div className="absolute right-0 left-0 flex items-center gap-1" style={{ top: yOf(activeWell.casingShoe) }}>
              <div
                className="h-px flex-1 bg-sky-600/50"
                style={{ backgroundImage: "repeating-linear-gradient(90deg,#0ea5e9 0 6px,transparent 6px 12px)" }}
              />
              <span className="font-mono text-[8.5px] text-sky-600">SHOE {activeWell.casingShoe} m</span>
            </div>
          )}

          {/* Trajectory */}
          {currentDepth > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <line
                x1="34%"
                x2="34%"
                y1="0"
                y2={Math.min(height, yOf(currentDepth))}
                stroke="#38bdf8"
                strokeWidth="2.5"
                opacity="0.85"
              />
            </svg>
          )}

          {/* Current depth marker */}
          {currentDepth > top && currentDepth < bot && (
            <div className="absolute right-0 left-0 z-20" style={{ top: yOf(currentDepth) }}>
              <div className="relative flex items-center">
                <div className="h-[1.5px] flex-1 bg-sky-400/80" />
                <div className="absolute left-[34%] -translate-x-1/2">
                  <span className="relative block h-3 w-3 rounded-full border-2 border-sky-300 bg-sky-500 shadow-[0_0_12px] shadow-sky-500/80" />
                </div>
                <div className="ml-1 flex items-center gap-1 rounded-sm border border-sky-500/50 bg-ink-950/90 px-1.5 py-0.5">
                  <span className="font-mono text-[9.5px] font-semibold tracking-wide text-sky-300">
                    BIT · {currentDepth.toFixed(0)} m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Historical events plotted along track */}
          {showEvents &&
            activeEvents.map((e, i) => {
              const y = yOf(e.depth);
              if (y < -6 || y > height + 6) return null;
              const col = EVENT_COLORS[e.type] || "#38bdf8";
              const lane = view === "events" ? 44 + (i % 5) * 11 : 46 + (i % 3) * 13;
              return (
                <button
                  key={e.id}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ top: y, left: `${lane}%` }}
                  onMouseEnter={() => setHoverEvt(e)}
                  onMouseLeave={() => setHoverEvt(null)}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onSelectEvent?.(e);
                  }}
                >
                  <span
                    className="block h-2.5 w-2.5 rotate-45 border transition-transform group-hover:scale-150"
                    style={{ background: col, borderColor: "#050d16" }}
                  />
                </button>
              );
            })}

          {/* Hover tooltip */}
          {hoverEvt && (
            <div
              className="pointer-events-none absolute z-30 w-56 rounded-sm border border-line bg-ink-950/97 p-2 shadow-xl"
              style={{
                top: Math.min(height - 96, Math.max(4, yOf(hoverEvt.depth) - 30)),
                left: "52%",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold" style={{ color: EVENT_COLORS[hoverEvt.type] }}>
                  {hoverEvt.type}
                </span>
                <span className="font-mono text-[9.5px] text-fog-400">
                  {hoverEvt.well} · {hoverEvt.depth} m
                </span>
              </div>
              <p className="mt-1 text-[10.5px] leading-snug text-fog-400">{hoverEvt.summary}</p>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-fog-500">
                <span>NPT {hoverEvt.npt} hrs</span>
                <span>{hoverEvt.source}</span>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute top-1 left-2 font-mono text-[8.5px] tracking-wider text-fog-500/70">
            {activeWell.id || "Active Well"} · TRACK
          </div>
        </div>

        {/* Offset comparison tracks */}
        {view === "comparison" &&
          offsetWells.map((w) => (
            <div key={w.id} className="relative w-[76px] shrink-0 border-l border-line-soft bg-ink-950/50">
              <div className="pointer-events-none absolute top-1 left-1.5 font-mono text-[8.5px] text-fog-400 truncate">
                {w.id}
              </div>
              <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-fog-500/25" />
              {historicalEvents
                .filter((e) => e.well === w.id && e.depth > top && e.depth < bot)
                .map((e) => (
                  <button
                    key={e.id}
                    className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ top: yOf(e.depth) }}
                    onMouseEnter={() => setHoverEvt(e)}
                    onMouseLeave={() => setHoverEvt(null)}
                    onClick={() => onSelectEvent?.(e)}
                  >
                    <span
                      className="block h-2 w-2 rotate-45 border border-ink-950"
                      style={{ background: EVENT_COLORS[e.type] }}
                    />
                  </button>
                ))}
            </div>
          ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-soft px-3 py-1.5">
        {(Object.keys(EVENT_COLORS) as (keyof typeof EVENT_COLORS)[]).slice(0, 5).map((k) => (
          <span key={k} className="flex items-center gap-1 font-mono text-[9px] text-fog-500">
            <i className="h-1.5 w-1.5 rotate-45" style={{ background: EVENT_COLORS[k] }} />
            {k}
          </span>
        ))}
        <span className="ml-auto font-mono text-[9px] text-fog-500">scroll = zoom · drag = pan</span>
      </div>
    </div>
  );
}

export function ProfileEvidence({
  zone,
  onOpenCases,
  onOpenMitigation,
}: {
  zone: RiskZone;
  onOpenCases?: () => void;
  onOpenMitigation?: () => void;
}) {
  const { historicalEvents } = useActiveWell();
  const cases = historicalEvents.filter(
    (e) => zone.wells.includes(e.well) && e.type === zone.type && Math.abs(e.depth - (zone.top + zone.base) / 2) < 120,
  );

  const totalNpt = zone.historicalEvidenceSummary?.nptTotal ?? cases.reduce((s, e) => s + e.npt, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-line-soft pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Badge tone={zone.level}>
              {zone.type} · {zone.level}
            </Badge>
            {zone.probability && (
              <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-sky-300">
                {zone.probability}% Probability
              </span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-fog-400">
            Interval: {zone.top}–{zone.base} m MD · Formation: {zone.formation || "Regional"}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricMini label="Evidence match" value={`${zone.similarity}%`} />
        <MetricMini label="Confidence" value={`${zone.confidence}%`} />
      </div>

      {/* 5-Stage Explainable Predictive Risk Chain (Requirement 4) */}
      <div className="rounded-sm border border-line-soft bg-ink-950/60 p-2.5">
        <div className="mb-2 text-[8.5px] uppercase tracking-wider text-sky-400 font-mono">
          Explainable Predictive Risk Chain
        </div>
        <div className="space-y-2 text-[11px]">
          {/* Step 1: Predicted Risk */}
          <div className="flex items-start gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500/20 font-mono text-[9px] font-bold text-red-400">
              1
            </span>
            <div>
              <span className="font-semibold text-fog-200">Predicted Risk:</span>{" "}
              <span className="text-red-300">{zone.type}</span> at {zone.top}–{zone.base} m MD in {zone.formation}
            </div>
          </div>

          <div className="ml-2 border-l border-line-soft pl-4 text-fog-500 text-[10px]">↓</div>

          {/* Step 2: Evidence */}
          <div className="flex items-start gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-mono text-[9px] font-bold text-amber-400">
              2
            </span>
            <div>
              <span className="font-semibold text-fog-200">Evidence:</span>{" "}
              <span className="text-fog-300">{zone.rationale}</span>
            </div>
          </div>

          <div className="ml-2 border-l border-line-soft pl-4 text-fog-500 text-[10px]">↓</div>

          {/* Step 3: Parameter Correlation */}
          <div className="flex items-start gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-mono text-[9px] font-bold text-sky-400">
              3
            </span>
            <div>
              <span className="font-semibold text-fog-200">Parameter Correlation:</span>{" "}
              <span className="text-sky-200 font-mono text-[10px]">
                {zone.parameterCorrelation?.relationship || "Torque / Drag anomalies verified across offset logs"}
              </span>
            </div>
          </div>

          <div className="ml-2 border-l border-line-soft pl-4 text-fog-500 text-[10px]">↓</div>

          {/* Step 4: Historical Incident */}
          <div className="flex items-start gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-mono text-[9px] font-bold text-violet-400">
              4
            </span>
            <div>
              <span className="font-semibold text-fog-200">Historical Incident:</span>{" "}
              <span className="text-fog-300">
                {cases.length > 0
                  ? `${cases.length} incident(s) across ${zone.wells.join(", ")} (${totalNpt} hrs NPT recorded)`
                  : `Documented offset disruption cluster in ${zone.wells.join(", ")}`}
              </span>
            </div>
          </div>

          <div className="ml-2 border-l border-line-soft pl-4 text-fog-500 text-[10px]">↓</div>

          {/* Step 5: Mitigation */}
          <div className="flex items-start gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono text-[9px] font-bold text-emerald-400">
              5
            </span>
            <div>
              <span className="font-semibold text-fog-200">Mitigation:</span>{" "}
              <span className="text-emerald-300">
                {zone.mitigationFlow?.action || zone.mitigation[0] || "Maintain established operational limits and mud treatment."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      {zone.contributingFactors && zone.contributingFactors.length > 0 && (
        <div className="rounded-sm border border-line-soft bg-ink-950/60 p-2.5">
          <div className="mb-1 text-[8.5px] uppercase tracking-wider text-fog-500">
            Contributing Factors
          </div>
          <ul className="space-y-1 text-[10.5px] text-fog-300">
            {zone.contributingFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-sky-400">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Supporting Historical Cases List */}
      <div>
        <div className="mb-1.5 flex items-center justify-between font-mono text-[9.5px] tracking-widest text-fog-500 uppercase">
          <span>Supporting historical events ({cases.length})</span>
          <span className="text-amber-400">{totalNpt > 0 ? `${totalNpt} hrs NPT` : ""}</span>
        </div>
        <ul className="space-y-1">
          {cases.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-sm border border-line-soft bg-ink-900/60 px-2 py-1">
              <span className="font-mono text-[10.5px] text-fog-200">{c.well}</span>
              <span className="font-mono text-[10px] text-fog-500">{c.depth} m</span>
              <span
                className={cn(
                  "font-mono text-[9.5px]",
                  c.severity === "high" ? "text-red-400" : c.severity === "moderate" ? "text-amber-400" : "text-emerald-400",
                )}
              >
                {c.npt} hrs NPT
              </span>
            </li>
          ))}
          {!cases.length && <li className="text-[11px] text-fog-500">Offset cluster incidents logged in uploaded reports.</li>}
        </ul>
      </div>

      {/* Action Links */}
      <div className="flex items-center gap-3 pt-1 font-mono text-[10.5px]">
        {onOpenCases && (
          <button onClick={onOpenCases} className="cursor-pointer text-sky-400 hover:text-sky-300">
            View cases →
          </button>
        )}
        {onOpenMitigation && (
          <button onClick={onOpenMitigation} className="cursor-pointer text-emerald-400 hover:text-emerald-300">
            Mitigation options →
          </button>
        )}
      </div>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line-soft bg-ink-900/60 px-2 py-1.5">
      <div className="text-[9px] tracking-wider text-fog-500 uppercase">{label}</div>
      <div className="font-mono text-[14px] text-fog-100">{value}</div>
    </div>
  );
}
