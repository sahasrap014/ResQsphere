import React, { useState } from "react";
import { cn } from "../utils/cn";

/* ----------------------------- Sparkline --------------------------- */

export function Sparkline({
  data,
  color = "#38bdf8",
  height = 22,
  width = 92,
  fill = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const gid = React.useId();
  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${width},${height} L0,${height} Z`} fill={`url(#${gid})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="1.8" fill={color} />
    </svg>
  );
}

/* ----------------------------- Bar chart --------------------------- */

export function BarChart({
  data,
  color = "#38bdf8",
  unit = "",
  height = 150,
  horizontal = false,
  colorFn,
}: {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
  height?: number;
  horizontal?: boolean;
  colorFn?: (d: { label: string; value: number }, i: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value)) * 1.1;
  const [hover, setHover] = useState<number | null>(null);

  if (horizontal) {
    return (
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="group grid grid-cols-[minmax(90px,1fr)_2.6fr_auto] items-center gap-2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="truncate text-[11px] text-fog-400">{d.label}</span>
            <div className="h-3 overflow-hidden rounded-[2px] bg-ink-800">
              <div
                className="h-full rounded-[2px] transition-all duration-500"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  background: colorFn ? colorFn(d, i) : color,
                  opacity: hover === null || hover === i ? 1 : 0.45,
                }}
              />
            </div>
            <span className="w-14 text-right font-mono text-[11px] text-fog-200">
              {d.value}
              <span className="ml-0.5 text-fog-500">{unit}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  const w = 100 / data.length;
  return (
    <div className="relative" style={{ height }}>
      <div className="flex h-[calc(100%-18px)] items-end gap-1">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="group relative flex h-full flex-1 flex-col justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ minWidth: `${w}%` }}
          >
            {hover === i && (
              <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-sm border border-line bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-fog-100">
                {d.value}
                {unit}
              </div>
            )}
            <div
              className="w-full rounded-t-[2px] transition-all duration-500"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: colorFn ? colorFn(d, i) : color,
                opacity: hover === null || hover === i ? 0.9 : 0.4,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1">
        {data.map((d) => (
          <div key={d.label} className="flex-1 truncate text-center text-[9px] text-fog-500">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Line chart --------------------------- */

export interface Series {
  name: string;
  color: string;
  points: (number | null)[];
}

export function LineChart({
  labels,
  series,
  height = 190,
  yUnit = "",
  xLabel,
  yLabel,
  area = false,
}: {
  labels: (string | number)[];
  series: Series[];
  height?: number;
  yUnit?: string;
  xLabel?: string;
  yLabel?: string;
  area?: boolean;
}) {
  const W = 520;
  const H = height;
  const pad = { l: 38, r: 12, t: 12, b: 26 };
  const all = series.flatMap((s) => s.points.filter((p): p is number => p != null && !Number.isNaN(p)));
  const min = Math.min(...all);
  const max = Math.max(...all);
  const lo = min - (max - min) * 0.12;
  const hi = max + (max - min) * 0.12;
  const x = (i: number) => pad.l + (i / (labels.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b);
  const ticks = 4;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = lo + ((hi - lo) * i) / ticks;
          return (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#16233a" strokeWidth="1" />
              <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="8.5" fill="#5f7593" fontFamily="monospace">
                {v >= 100 ? Math.round(v) : v.toFixed(hi - lo < 3 ? 2 : 1)}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="8.5" fill="#5f7593" fontFamily="monospace">
            {l}
          </text>
        ))}
        {series.map((s) => {
          const segs: string[] = [];
          let cur = "";
          s.points.forEach((p, i) => {
            if (p == null || Number.isNaN(p)) {
              if (cur) segs.push(cur);
              cur = "";
            } else {
              cur += `${cur ? "L" : "M"}${x(i)},${y(p)}`;
            }
          });
          if (cur) segs.push(cur);
          return (
            <g key={s.name}>
              {area && segs[0] && (
                <path
                  d={`${segs[0]} L${x(
                    s.points.reduce<number>((acc2, p, i2) => (p != null && !Number.isNaN(p) ? i2 : acc2), 0),
                  )},${H - pad.b} L${pad.l},${H - pad.b} Z`}
                  fill={s.color}
                  opacity="0.08"
                />
              )}
              {segs.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={s.color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
              ))}
              {s.points.map((p, i) =>
                p == null || Number.isNaN(p) ? null : <circle key={i} cx={x(i)} cy={y(p)} r={hover === i ? 3.2 : 2} fill={s.color} />,
              )}
            </g>
          );
        })}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />}
        {labels.map((_, i) => (
          <rect key={i} x={x(i) - 12} y={0} width={24} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-28 rounded-sm border border-line bg-ink-900/95 p-1.5 text-[10px]"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > labels.length / 2 ? "-108%" : "8%"})` }}
        >
          <div className="mb-1 font-mono text-fog-400">
            {xLabel ? `${xLabel} ` : ""}
            {labels[hover]}
          </div>
          {series.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1 text-fog-400">
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
              <span className="font-mono text-fog-100">
                {s.points[hover] == null || Number.isNaN(s.points[hover] as number) ? "—" : `${s.points[hover]}${yUnit}`}
              </span>
            </div>
          ))}
        </div>
      )}
      {yLabel && <span className="absolute top-0 left-0 font-mono text-[9px] text-fog-500">{yLabel}</span>}
    </div>
  );
}

/* ----------------------------- Donut ------------------------------- */

export function Donut({
  data,
  size = 132,
  thickness = 16,
  center,
  sub,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: string;
  sub?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#101b2f" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const el = (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={hover === i ? thickness + 3 : thickness}
              strokeDasharray={`${len - 1.5} ${c - len + 1.5}`}
              strokeDashoffset={-acc}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              opacity={hover === null || hover === i ? 1 : 0.4}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div className="min-w-0 flex-1">
        {(center || hover !== null) && (
          <div className="mb-2">
            <div className="font-mono text-[17px] leading-none font-semibold text-fog-100">
              {hover !== null ? data[hover].value : center}
            </div>
            <div className="mt-0.5 text-[10px] text-fog-500">{hover !== null ? data[hover].label : sub}</div>
          </div>
        )}
        <ul className="space-y-1">
          {data.map((d, i) => (
            <li
              key={d.label}
              className={cn("flex cursor-pointer items-center justify-between gap-2 text-[11px] transition-opacity", hover !== null && hover !== i && "opacity-45")}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-fog-400">
                <i className="h-2 w-2 shrink-0 rounded-[1px]" style={{ background: d.color }} />
                <span className="truncate">{d.label}</span>
              </span>
              <span className="font-mono text-fog-200">{((d.value / total) * 100).toFixed(0)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* --------------------------- Radial gauge --------------------------- */

export function Gauge({ value, label, color = "#38bdf8", size = 110 }: { value: number; label?: string; color?: string; size?: number }) {
  const r = size / 2 - 9;
  const c = Math.PI * r;
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path d={`M9,${size / 2} A${r},${r} 0 0 1 ${size - 9},${size / 2}`} fill="none" stroke="#101b2f" strokeWidth="8" strokeLinecap="round" />
        <path
          d={`M9,${size / 2} A${r},${r} 0 0 1 ${size - 9},${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="-mt-4 text-center">
        <div className="font-mono text-[18px] leading-none font-semibold" style={{ color }}>
          {value}
        </div>
        {label && <div className="mt-1 text-[9.5px] tracking-wider text-fog-500 uppercase">{label}</div>}
      </div>
    </div>
  );
}
