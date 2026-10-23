import { useState } from "react";
import { cn } from "../utils/cn";
import { useActiveWell } from "../state/ActiveWellContext";

export type RouteId =
  | "dashboard"
  | "nearby"
  | "historical"
  | "comparison"
  | "correlation"
  | "alerts"
  | "forecast"
  | "mitigation"
  | "assistant"
  | "zones"
  | "location"
  | "npt"
  | "cost"
  | "upload"
  | "reports"
  | "settings"
  | "evidence";

export const NAV: { group: string; items: { id: RouteId; label: string; icon: string }[] }[] = [
  { group: "Command Center", items: [{ id: "dashboard", label: "Dashboard", icon: "◉" }] },
  {
    group: "Well Intelligence",
    items: [
      { id: "nearby", label: "Nearby Wells", icon: "◍" },
      { id: "historical", label: "Historical Intelligence", icon: "▤" },
      { id: "comparison", label: "Well Comparison", icon: "⇄" },
      { id: "correlation", label: "Formation Correlation", icon: "≣" },
    ],
  },
  {
    group: "Real-Time AI",
    items: [
      { id: "alerts", label: "Alert Center", icon: "△" },
      { id: "forecast", label: "Risk Forecast", icon: "◈" },
      { id: "mitigation", label: "Mitigation Engine", icon: "⚕" },
      { id: "assistant", label: "AI Drilling Assistant", icon: "✦" },
    ],
  },
  {
    group: "Planning",
    items: [
      { id: "zones", label: "High-Potential Zones", icon: "◇" },
      { id: "location", label: "Location Recommendation", icon: "⌖" },
    ],
  },
  {
    group: "Optimization",
    items: [
      { id: "npt", label: "NPT Intelligence", icon: "◷" },
      { id: "cost", label: "Cost Efficiency", icon: "₹" },
    ],
  },
  {
    group: "Tools",
    items: [
      { id: "upload", label: "Data Upload", icon: "↥" },
      { id: "reports", label: "Reports & Export", icon: "▣" },
      { id: "settings", label: "Settings", icon: "⚙" },
    ],
  },
];

/* ------------------------------ Sidebar ---------------------------- */

export function Sidebar({
  route,
  onNavigate,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  route: RouteId;
  onNavigate: (r: RouteId) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { analytics, documents, allHistoricalWells, historicalEvents } = useActiveWell();
  const critical = analytics.alerts.filter((a) => a.level === "critical").length;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={cn(
          "z-50 flex shrink-0 flex-col border-r border-line-soft bg-ink-900/95 transition-[width] duration-200",
          collapsed ? "w-[56px]" : "w-[214px]",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-line-soft px-3">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-sky-500/50 bg-sky-500/10">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-sky-400">
              <path d="M10 1v18M4 6l6-4 6 4M4 6v8l6 4 6-4V6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[14px] leading-none font-bold tracking-[0.16em] text-fog-100">NWIS</div>
              <div className="mt-0.5 truncate text-[8.5px] tracking-wider text-fog-500 uppercase">
                Historical Intelligence
              </div>
            </div>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto py-2">
          {NAV.map((g) => (
            <div key={g.group} className="mb-1.5">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[8.5px] font-semibold tracking-[0.2em] text-fog-500/70 uppercase">
                  {g.group}
                </div>
              )}
              {collapsed && <div className="mx-3 my-2 h-px bg-line-soft" />}
              <ul>
                {g.items.map((it) => {
                  const active = route === it.id;
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => {
                          onNavigate(it.id);
                          onCloseMobile();
                        }}
                        title={collapsed ? it.label : undefined}
                        className={cn(
                          "group relative flex w-full cursor-pointer items-center gap-2.5 px-3 py-[7px] text-left text-[12px] transition-colors",
                          active ? "bg-sky-500/10 text-sky-300" : "text-fog-400 hover:bg-ink-800 hover:text-fog-200",
                        )}
                      >
                        {active && <span className="absolute top-0 bottom-0 left-0 w-[2px] bg-sky-400" />}
                        <span className={cn("w-4 shrink-0 text-center text-[12px]", active ? "text-sky-400" : "text-fog-500")}>
                          {it.icon}
                        </span>
                        {!collapsed && <span className="truncate">{it.label}</span>}
                        {!collapsed && it.id === "alerts" && critical > 0 && (
                          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/20 px-1 font-mono text-[9px] text-red-300">
                            {critical}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line-soft p-2">
          {!collapsed && (
            <div className="mb-2 rounded-sm border border-line-soft bg-ink-850 p-2">
              <div className="flex items-center justify-between text-[9px] tracking-wider text-fog-500 uppercase">
                <span>Knowledge Base</span>
                <span className="text-emerald-400">{documents.length ? "100% Real" : "Empty"}</span>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
                {[
                  ["Docs", documents.length],
                  ["Wells", allHistoricalWells.length],
                  ["Events", historicalEvents.length],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <div className="font-mono text-[12px] text-fog-200">{v}</div>
                    <div className="text-[8px] tracking-wider text-fog-500 uppercase">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="hidden w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-line-soft py-1 text-[10px] text-fog-500 transition-colors hover:text-sky-300 lg:flex"
          >
            {collapsed ? "»" : "« Collapse"}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------- Header ---------------------------- */

export function Header({
  onSearch,
  onMobileMenu,
  onNavigate,
  seconds,
}: {
  onSearch: () => void;
  onMobileMenu: () => void;
  onNavigate: (r: RouteId) => void;
  seconds: number;
}) {
  const { activeWell, analytics, documents } = useActiveWell();
  const [notifOpen, setNotifOpen] = useState(false);
  const activeDepth = activeWell.liveParameters?.depth;

  return (
    <header className="relative z-30 flex h-[52px] shrink-0 items-center gap-3 border-b border-line-soft bg-ink-900/90 px-3 backdrop-blur">
      <button onClick={onMobileMenu} className="cursor-pointer rounded-sm border border-line-soft px-2 py-1 text-fog-400 lg:hidden">
        ☰
      </button>

      <div className="hidden items-center gap-2.5 md:flex">
        <div className="flex flex-col">
          <span className="text-[11px] leading-none font-semibold tracking-[0.18em] text-fog-100">NWIS</span>
          <span className="mt-0.5 text-[8.5px] tracking-wider text-fog-500 uppercase">Nearby Wells Intelligence</span>
        </div>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-line-soft md:block" />

      {/* Well context strip */}
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
        <HeadItem label="Active Well" value={activeWell.id || "Not configured"} accent />
        <HeadItem label="Field" value={activeWell.field || "—"} />
        <HeadItem label="Depth" value={activeDepth !== undefined ? `${activeDepth} m` : "—"} mono />
        <HeadItem label="Reservoir" value={activeWell.target || "—"} />
        <HeadItem label="Section" value={activeWell.section || "—"} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-500/8 px-2 py-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 blink" />
          <span className="font-mono text-[9.5px] tracking-wider text-emerald-300">HISTORICAL ENGINE</span>
          <span className="font-mono text-[9px] text-emerald-500/70">{seconds}s</span>
        </div>

        <button
          onClick={onSearch}
          className="flex cursor-pointer items-center gap-2 rounded-sm border border-line-soft bg-ink-850 px-2 py-1 text-fog-500 transition-colors hover:border-sky-500/40 hover:text-fog-300"
        >
          <svg viewBox="0 0 14 14" className="h-3 w-3">
            <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.2 9.2 12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="hidden font-mono text-[10px] xl:inline">Search knowledge base</span>
          <kbd className="hidden rounded-[2px] border border-line px-1 font-mono text-[8.5px] xl:inline">⌘K</kbd>
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative cursor-pointer rounded-sm border border-line-soft bg-ink-850 px-2 py-1.5 text-fog-400 transition-colors hover:text-sky-300"
          >
            <svg viewBox="0 0 14 14" className="h-3 w-3">
              <path
                d="M7 1.5a3.6 3.6 0 0 0-3.6 3.6v2.3L2.2 9.6h9.6L10.6 7.4V5.1A3.6 3.6 0 0 0 7 1.5ZM5.6 11a1.5 1.5 0 0 0 2.8 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
            {analytics.alerts.length > 0 && (
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
          {notifOpen && (
            <div className="fade-up absolute top-full right-0 mt-1.5 w-80 rounded-md border border-line bg-ink-850 shadow-2xl">
              <div className="flex items-center justify-between border-b border-line-soft px-3 py-2">
                <span className="text-[10px] tracking-widest text-fog-400 uppercase">Historical Alerts</span>
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    onNavigate("alerts");
                  }}
                  className="cursor-pointer font-mono text-[10px] text-sky-400"
                >
                  Alert center →
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {analytics.alerts.map((a) => (
                  <li key={a.id} className="flex gap-2 border-b border-line-soft/60 px-3 py-2 last:border-0">
                    <i
                      className={cn(
                        "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                        a.level === "critical" ? "bg-red-500" : a.level === "warning" ? "bg-amber-500" : "bg-sky-500",
                      )}
                    />
                    <div className="min-w-0">
                      <div className="text-[11.5px] text-fog-200">{a.title}</div>
                      <div className="mt-0.5 truncate text-[10px] text-fog-500">{a.detail}</div>
                      <div className="mt-0.5 font-mono text-[9px] text-fog-500/80">
                        {a.wells.length} supporting well(s)
                      </div>
                    </div>
                  </li>
                ))}
                {!analytics.alerts.length && (
                  <li className="p-3 text-center text-[11px] text-fog-500">No active historical alerts.</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate("upload")}
          title="Historical repository documents"
          className="hidden cursor-pointer items-center gap-1.5 rounded-sm border border-line-soft bg-ink-850 px-2 py-1 sm:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span className="font-mono text-[9.5px] text-fog-400">{documents.length} DOCS</span>
        </button>

        <button
          onClick={() => onNavigate("settings")}
          className="cursor-pointer rounded-sm border border-line-soft bg-ink-850 px-2 py-1.5 text-fog-400 transition-colors hover:text-sky-300"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}

function HeadItem({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="min-w-0 shrink-0">
      <div className="text-[8.5px] tracking-[0.16em] text-fog-500 uppercase">{label}</div>
      <div className={cn("truncate text-[12px] leading-tight", mono && "font-mono", accent ? "font-semibold text-sky-300" : "text-fog-200")}>
        {value}
      </div>
    </div>
  );
}
