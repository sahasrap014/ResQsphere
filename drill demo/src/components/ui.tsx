import React from "react";
import { cn } from "../utils/cn";

/* ------------------------------ Panel ------------------------------ */

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
  bodyClass,
  dense,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClass?: string;
  dense?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative flex flex-col rounded-md border border-line-soft bg-ink-850/80 backdrop-blur-[2px]",
        className,
      )}
    >
      {(title || right) && (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-[11px] font-semibold tracking-[0.14em] text-fog-300 uppercase">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-fog-500">{subtitle}</p>}
          </div>
          {right && <div className="flex shrink-0 items-center gap-1.5">{right}</div>}
        </header>
      )}
      <div className={cn(dense ? "" : "p-3.5", "min-h-0 flex-1", bodyClass)}>{children}</div>
    </section>
  );
}

/* ------------------------------ Badge ------------------------------ */

const toneMap = {
  neutral: "border-line text-fog-300 bg-ink-800",
  accent: "border-sky-500/40 text-sky-300 bg-sky-500/10",
  low: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  moderate: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  high: "border-red-500/40 text-red-300 bg-red-500/10",
  violet: "border-violet-500/40 text-violet-300 bg-violet-500/10",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase",
        toneMap[tone],
        className,
      )}
    >
      {dot && <i className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ------------------------------ Button ----------------------------- */

export function Button({
  children,
  variant = "ghost",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary:
      "bg-sky-500 text-ink-950 hover:bg-sky-400 border border-sky-400 font-semibold shadow-[0_0_20px_-6px] shadow-sky-500/60",
    ghost: "text-fog-300 hover:text-fog-100 hover:bg-ink-750 border border-transparent",
    outline: "border border-line text-fog-300 hover:border-sky-500/50 hover:text-sky-300 bg-ink-800/60",
    danger: "border border-red-500/50 text-red-300 hover:bg-red-500/10 bg-red-500/5",
    subtle: "bg-ink-750 border border-line-soft text-fog-300 hover:text-fog-100 hover:border-line",
  };
  const sizes = {
    sm: "h-6 px-2 text-[10px] tracking-wider uppercase",
    md: "h-8 px-3 text-[11px] tracking-wide",
    lg: "h-10 px-5 text-[13px]",
  };
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Tabs ------------------------------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-sm border border-line-soft bg-ink-900 p-0.5", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "cursor-pointer rounded-[3px] px-2.5 py-1 text-[10.5px] font-medium tracking-wider uppercase transition-colors",
            value === t.id ? "bg-sky-500/15 text-sky-300" : "text-fog-500 hover:text-fog-300",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Toggle ----------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
  color,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="group inline-flex cursor-pointer items-center gap-1.5 text-[10.5px] tracking-wide text-fog-400 transition-colors hover:text-fog-200"
    >
      <span
        className={cn(
          "flex h-3 w-3 items-center justify-center rounded-[2px] border transition-colors",
          checked ? "border-transparent" : "border-line bg-ink-900",
        )}
        style={checked ? { background: color ?? "#38bdf8" } : undefined}
      >
        {checked && (
          <svg viewBox="0 0 10 10" className="h-2 w-2 text-ink-950">
            <path d="M1.5 5.2 4 7.5 8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

/* ------------------------------ Fields ----------------------------- */

export function Field({
  label,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center gap-1 text-[10px] font-medium tracking-[0.12em] text-fog-400 uppercase">
        {label}
        {required && <i className="text-sky-400 not-italic">*</i>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-fog-500">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-sm border border-line-soft bg-ink-900/80 px-2.5 py-1.5 text-[12.5px] text-fog-100 outline-none transition-colors placeholder:text-fog-500/70 focus:border-sky-500/60 focus:bg-ink-900";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "cursor-pointer", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "resize-none", props.className)} />;
}

/* ------------------------------ Stat ------------------------------- */

export function Stat({
  label,
  value,
  unit,
  trend,
  tone = "neutral",
  children,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  trend?: number;
  tone?: keyof typeof toneMap;
  children?: React.ReactNode;
}) {
  const tint = { neutral: "text-fog-100", accent: "text-sky-300", low: "text-emerald-300", moderate: "text-amber-300", high: "text-red-300", violet: "text-violet-300" }[tone];
  return (
    <div className="min-w-0">
      <div className="text-[9.5px] font-medium tracking-[0.16em] text-fog-500 uppercase">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("font-mono text-[19px] leading-none font-semibold", tint)}>{value}</span>
        {unit && <span className="text-[10.5px] text-fog-500">{unit}</span>}
        {trend !== undefined && trend !== 0 && (
          <span className={cn("ml-0.5 font-mono text-[10px]", trend > 0 ? "text-amber-400" : "text-sky-400")}>
            {trend > 0 ? "▲" : "▼"}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* --------------------------- Section head -------------------------- */

export function PageHead({
  title,
  subtitle,
  right,
  icon,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-fog-100">
          {icon && <span className="text-[15px] opacity-80">{icon}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-fog-500">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

/* ---------------------------- Evidence tag ------------------------- */

export function SourceTag({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-fog-500">
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-sky-500/70">
        <path d="M3 1h4l3 3v7H3z" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M7 1v3h3" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      {source}
    </span>
  );
}

export function Meter({ value, tone = "#38bdf8", height = 4 }: { value: number; tone?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-ink-700" style={{ height }}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, value)}%`, background: tone }} />
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="my-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-line-soft" />
      {label && <span className="font-mono text-[9.5px] tracking-[0.18em] text-fog-500 uppercase">{label}</span>}
      <div className="h-px flex-1 bg-line-soft" />
    </div>
  );
}

export function Empty({ icon = "◇", text }: { icon?: string; text: string }) {
  return (
    <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2 text-center">
      <span className="text-xl text-fog-500/60">{icon}</span>
      <p className="max-w-xs text-[11.5px] text-fog-500">{text}</p>
    </div>
  );
}
