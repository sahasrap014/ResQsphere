import { useMemo, useState } from "react";
import GeoMap from "../components/GeoMap";
import { BarChart } from "../components/charts";
import { Badge, Button, Empty, Input, PageHead, Panel, SourceTag, Tabs, Toggle } from "../components/ui";
import {
  EVENT_COLORS,
  RISK_COLORS,
  validCoordinate,
  type WellEvent,
} from "../data/nwis";
import { cn } from "../utils/cn";
import type { RouteId } from "../components/Shell";
import { useActiveWell } from "../state/ActiveWellContext";

/* =============================== NEARBY WELLS ============================== */

export function NearbyWells({ onNavigate }: { onNavigate: (r: RouteId) => void }) {
  const { activeWell, nearbyWells, historicalEvents } = useActiveWell();
  const [radius, setRadius] = useState(20);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState({ low: true, moderate: true, high: true });
  const [sort, setSort] = useState<"distance" | "risk" | "events">("distance");
  const [query, setQuery] = useState("");

  const hasCoords = validCoordinate(activeWell.lat, activeWell.lon);
  const rank = { high: 0, moderate: 1, low: 2 };

  const list = nearbyWells
    .filter(
      (w) =>
        (hasCoords ? w.distance <= radius : true) &&
        filter[w.risk] &&
        `${w.id} ${w.name} ${w.status} ${w.targetFormation}`.toLowerCase().includes(query.toLowerCase().trim()),
    )
    .sort((a, b) =>
      sort === "distance" ? a.distance - b.distance : sort === "risk" ? rank[a.risk] - rank[b.risk] : b.events - a.events,
    );

  const selectedWellId = selected || list[0]?.id || null;
  const well = nearbyWells.find((w) => w.id === selectedWellId);

  return (
    <div>
      <PageHead
        icon="◍"
        title="Nearby Historical Wells"
        subtitle={
          hasCoords
            ? `Offset wells identified from uploaded historical data; distances calculated from active well coordinates (${activeWell.lat?.toFixed(4)}°N, ${activeWell.lon?.toFixed(4)}°E).`
            : "Offset wells identified from uploaded historical data. Enter Active Well coordinates to compute exact proximity."
        }
        right={
          <div className="flex items-center gap-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search wells"
              className="mr-1 w-28"
            />
            {[5, 10, 20, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={cn(
                  "cursor-pointer rounded-sm border px-2 py-1 font-mono text-[10px] transition-colors",
                  radius === r
                    ? "border-sky-500/50 bg-sky-500/12 text-sky-300"
                    : "border-line-soft text-fog-500 hover:text-fog-300",
                )}
              >
                {r} km
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Interactive offset map"
          subtitle="OpenStreetMap GIS · Authoritative coordinates extracted from uploaded historical records"
          dense
          className="min-h-[560px]"
          right={<Badge tone="accent">{list.length} historical well(s)</Badge>}
        >
          <div className="h-[500px]">
            <GeoMap
              radiusKm={radius}
              selected={selectedWellId}
              onSelect={setSelected}
              filterRisk={filter}
              searchQuery={query}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line-soft px-3 py-2">
            {(["low", "moderate", "high"] as const).map((r) => (
              <Toggle
                key={r}
                checked={filter[r]}
                onChange={(v) => setFilter((f) => ({ ...f, [r]: v }))}
                label={`${r} risk`}
                color={RISK_COLORS[r]}
              />
            ))}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel
            title={`Offset wells (${list.length})`}
            dense
            right={
              <Tabs
                value={sort}
                onChange={setSort}
                tabs={[
                  { id: "distance", label: "Dist" },
                  { id: "risk", label: "Risk" },
                  { id: "events", label: "Events" },
                ]}
              />
            }
          >
            <div className="max-h-[248px] divide-y divide-line-soft overflow-y-auto">
              {list.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelected(w.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    selectedWellId === w.id ? "bg-sky-500/8" : "hover:bg-ink-800/60",
                  )}
                >
                  <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: RISK_COLORS[w.risk] }} />
                  <span className="w-20 shrink-0 truncate font-mono text-[11.5px] text-fog-100">{w.id}</span>
                  <span className="w-16 shrink-0 font-mono text-[10.5px] text-fog-400">
                    {w.distance > 0 ? `${w.distance} km` : validCoordinate(w.lat, w.lon) ? "0 km" : "No coords"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[10.5px] text-fog-500">{w.status}</span>
                  <span className="shrink-0 font-mono text-[10px] text-fog-400">{w.events} ev</span>
                </button>
              ))}
              {!list.length && (
                <div className="p-4 text-center text-[11px] text-fog-500">
                  {nearbyWells.length === 0
                    ? "No historical wells uploaded. Upload reports to populate."
                    : "No historical wells match the current filters."}
                </div>
              )}
            </div>
          </Panel>

          {well ? (
            <Panel title={`Well ${well.id}`} subtitle={well.name} right={<Badge tone={well.risk}>{well.risk} risk</Badge>}>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                {[
                  ["Distance", well.distance > 0 ? `${well.distance} km` : "Coordinates pending"],
                  ["Well type", well.type || "Not specified"],
                  ["Spud date", well.spud || "Not recorded"],
                  ["Total depth", well.td > 0 ? `${well.td.toLocaleString()} m` : "Not recorded"],
                  ["Status", well.status],
                  ["Avg ROP", well.avgRop > 0 ? `${well.avgRop} m/hr` : "Not recorded"],
                  ["Target", well.targetFormation || "Not specified"],
                  ["Total NPT", well.npt > 0 ? `${well.npt} hrs` : "0 hrs"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[9px] tracking-widest text-fog-500 uppercase">{k}</dt>
                    <dd className="mt-0.5 text-[11.5px] text-fog-200">{v}</dd>
                  </div>
                ))}
                <div className="col-span-2">
                  <dt className="text-[9px] tracking-widest text-fog-500 uppercase">Production</dt>
                  <dd className="mt-0.5 text-[11.5px] text-fog-200">{well.production || "Not recorded in uploaded data"}</dd>
                </div>
              </dl>

              <div className="mt-3 border-t border-line-soft pt-2.5">
                <div className="mb-1.5 font-mono text-[9.5px] tracking-widest text-fog-500 uppercase">
                  Historical incidents ({well.events})
                </div>
                <ul className="space-y-1">
                  {historicalEvents
                    .filter((e) => e.well === well.id)
                    .map((e) => (
                      <li key={e.id} className="flex items-center gap-2 rounded-sm border border-line-soft bg-ink-900/60 px-2 py-1">
                        <i className="h-1.5 w-1.5 rotate-45" style={{ background: EVENT_COLORS[e.type] }} />
                        <span className="flex-1 truncate text-[10.5px] text-fog-300">{e.type}</span>
                        <span className="font-mono text-[10px] text-fog-500">{e.depth} m</span>
                      </li>
                    ))}
                  {!historicalEvents.some((e) => e.well === well.id) && (
                    <li className="text-[11px] text-fog-500">No incident records indexed for this well.</li>
                  )}
                </ul>
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="primary" className="flex-1" onClick={() => onNavigate("historical")}>
                  View intelligence
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onNavigate("comparison")}>
                  Compare
                </Button>
              </div>
            </Panel>
          ) : (
            <Panel title="Well details">
              <div className="p-4 text-center text-[11.5px] text-fog-500">
                Select a historical well from the list to inspect its extracted records.
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================= HISTORICAL INTELLIGENCE ========================= */

export function HistoricalIntelligence() {
  const { analytics, documents } = useActiveWell();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const results = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return analytics.events;
    const depthMatch = s.match(/(\d{3,4})\s*m?/);
    const depth = depthMatch ? +depthMatch[1] : null;
    const nptMatch = s.match(/npt (?:over|above|>) ?(\d+)/);

    return analytics.events.filter((e) => {
      const text = `${e.well} ${e.type} ${e.formation} ${e.mitigation} ${e.summary} ${e.severity}`.toLowerCase();
      const words = s
        .replace(/\d+\s*m?/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !["show", "around", "with", "over"].includes(w));
      const textOk = !words.length || words.some((w) => text.includes(w));
      const depthOk = depth == null || Math.abs(e.depth - depth) <= 100;
      const nptOk = !nptMatch || e.npt > +nptMatch[1];
      return textOk && depthOk && nptOk;
    });
  }, [analytics.events, q]);

  const totalNpt = results.reduce((a, b) => a + b.npt, 0);

  return (
    <div>
      <PageHead
        icon="▤"
        title="Historical Intelligence Search"
        subtitle={`Institutional memory — ${analytics.events.length} extracted historical incidents across uploaded well records; every event retains source document traceability.`}
      />

      <Panel dense className="mb-3">
        <div className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-fog-500">⌕</span>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-7"
                placeholder='Search events, well names, depths, or problem types (e.g. "mud loss", "stuck pipe", "3200")...'
              />
            </div>
            {q && (
              <Button variant="ghost" onClick={() => setQ("")}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Panel>

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Matching records", `${results.length}`, `of ${analytics.events.length} extracted`],
          ["Wells involved", `${new Set(results.map((r) => r.well)).size}`, "historical well(s)"],
          ["Aggregate NPT", `${totalNpt.toFixed(1)}`, "hours"],
          ["High severity", `${results.filter((r) => r.severity === "high").length}`, "records"],
        ].map(([l, v, s]) => (
          <div key={l} className="rounded-md border border-line-soft bg-ink-850/70 px-3 py-2.5">
            <div className="text-[9px] tracking-[0.16em] text-fog-500 uppercase">{l}</div>
            <div className="mt-1 font-mono text-[19px] leading-none font-semibold text-fog-100">{v}</div>
            <div className="mt-1 text-[10px] text-fog-500">{s}</div>
          </div>
        ))}
      </div>

      <Panel title="Extracted historical records" subtitle="Well → depth → formation → problem → severity → mitigation → outcome" dense>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-line-soft bg-ink-900/70 text-[9px] tracking-[0.14em] text-fog-500 uppercase">
                {["Well", "Depth", "Formation", "Problem", "Severity", "NPT", "Mitigation", "Outcome", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((e) => (
                <ResultRow key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
              ))}
            </tbody>
          </table>
        </div>
        {!results.length && (
          <div className="p-8 text-center text-fog-500">
            {analytics.events.length === 0 ? (
              <div>
                <div className="text-[13px] font-medium text-fog-300">No historical events in repository</div>
                <p className="mt-1 text-[11px]">
                  {documents.length > 0
                    ? "Uploaded documents did not contain identifiable incident/event records."
                    : "Upload historical reports or a ZIP archive to populate event records."}
                </p>
              </div>
            ) : (
              <Empty icon="⌕" text="No historical events match this query." />
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ResultRow({ e, open, onToggle }: { e: WellEvent; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className={cn("border-b border-line-soft/60 text-[11.5px] transition-colors", open ? "bg-sky-500/6" : "hover:bg-ink-800/50")}>
        <td className="px-3 py-2 font-mono text-fog-100">{e.well}</td>
        <td className="px-3 py-2 font-mono text-fog-300">{e.depth > 0 ? `${e.depth} m` : "—"}</td>
        <td className="px-3 py-2 text-fog-400">{e.formation || "—"}</td>
        <td className="px-3 py-2">
          <span className="flex items-center gap-1.5 text-fog-200">
            <i className="h-1.5 w-1.5 rotate-45" style={{ background: EVENT_COLORS[e.type] }} />
            {e.type}
          </span>
        </td>
        <td className="px-3 py-2">
          <Badge tone={e.severity}>{e.severity}</Badge>
        </td>
        <td className="px-3 py-2 font-mono text-fog-300">{e.npt > 0 ? `${e.npt}h` : "—"}</td>
        <td className="max-w-[240px] truncate px-3 py-2 text-fog-400">{e.mitigation || "—"}</td>
        <td className="max-w-[200px] truncate px-3 py-2 text-fog-400">{e.outcome || "—"}</td>
        <td className="px-3 py-2">
          <button onClick={onToggle} className="cursor-pointer font-mono text-[10px] text-sky-400 hover:text-sky-300">
            {open ? "close" : "detail"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-ink-900/70">
          <td colSpan={9} className="px-3 py-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <div className="mb-1 font-mono text-[9px] tracking-widest text-fog-500 uppercase">Extracted narrative</div>
                <p className="text-[11.5px] leading-relaxed text-fog-300">{e.summary}</p>
              </div>
              <div>
                <div className="mb-1 font-mono text-[9px] tracking-widest text-fog-500 uppercase">Mitigation applied</div>
                <p className="text-[11.5px] leading-relaxed text-fog-300">{e.mitigation}</p>
              </div>
              <div>
                <div className="mb-1 font-mono text-[9px] tracking-widest text-fog-500 uppercase">Outcome & source</div>
                <p className="text-[11.5px] leading-relaxed text-fog-300">{e.outcome}</p>
                <div className="mt-1.5">
                  <SourceTag source={e.source} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ============================= WELL COMPARISON ============================= */

export function WellComparison() {
  const { activeWell, nearbyWells, historicalEvents } = useActiveWell();
  const [tab, setTab] = useState<"summary" | "event" | "production">("summary");
  const [picked, setPicked] = useState<string[]>(() => nearbyWells.slice(0, 3).map((w) => w.id));

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const comparedWells = nearbyWells.filter((w) => picked.includes(w.id));

  return (
    <div>
      <PageHead
        icon="⇄"
        title="Well Comparison"
        subtitle="Benchmark the active well against selected historical offset wells across parameters, stratigraphy, events, and production."
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Panel title="Select historical wells" dense>
          <div className="border-b border-line-soft bg-sky-500/6 px-3 py-2">
            <div className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="font-mono text-[11.5px] text-sky-300">{activeWell.id || "Active Well"}</span>
            </div>
            <div className="mt-0.5 text-[9.5px] text-fog-500">Active well · always included</div>
          </div>
          <div className="max-h-[420px] divide-y divide-line-soft overflow-y-auto">
            {nearbyWells.map((w) => (
              <label key={w.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-ink-800/60">
                <input
                  type="checkbox"
                  checked={picked.includes(w.id)}
                  onChange={() => toggle(w.id)}
                  className="accent-sky-500"
                />
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: RISK_COLORS[w.risk] }} />
                <span className="font-mono text-[11px] text-fog-200">{w.id}</span>
                <span className="ml-auto font-mono text-[9.5px] text-fog-500">
                  {w.distance > 0 ? `${w.distance} km` : ""}
                </span>
              </label>
            ))}
            {!nearbyWells.length && (
              <div className="p-3 text-[11px] text-fog-500">No historical wells uploaded.</div>
            )}
          </div>
        </Panel>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "summary", label: "Overview" },
                { id: "event", label: "Incidents & NPT" },
                { id: "production", label: "Production & Delivery" },
              ]}
            />
          </div>

          {tab === "summary" && (
            <Panel title="Well Attributes Comparison" subtitle="Derived directly from uploaded historical records">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-line-soft text-[9px] tracking-widest text-fog-500 uppercase">
                      <th className="py-2 pr-3 font-medium">Attribute</th>
                      <th className="px-3 py-2 font-medium text-sky-400">{activeWell.id || "Active Well"}</th>
                      {comparedWells.map((w) => (
                        <th key={w.id} className="px-3 py-2 font-medium text-fog-200">
                          {w.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Well Type", activeWell.type || "Development", ...comparedWells.map((w) => w.type || "Not recorded")],
                      [
                        "Total Depth (m)",
                        activeWell.plannedTd ? `${activeWell.plannedTd.toLocaleString()} (plan)` : "Not specified",
                        ...comparedWells.map((w) => (w.td > 0 ? w.td.toLocaleString() : "Not recorded")),
                      ],
                      ["Target Formation", activeWell.target || "Not specified", ...comparedWells.map((w) => w.targetFormation || "Not recorded")],
                      ["Distance from Active", "0.0 km", ...comparedWells.map((w) => (w.distance > 0 ? `${w.distance} km` : "Coordinates pending"))],
                      ["Historical Incidents", "—", ...comparedWells.map((w) => `${w.events}`)],
                      ["Total NPT (hrs)", "—", ...comparedWells.map((w) => (w.npt > 0 ? `${w.npt}` : "0.0"))],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-line-soft/60 text-[11.5px]">
                        <td className="py-2 pr-3 text-fog-400">{row[0]}</td>
                        <td className="px-3 py-2 font-mono text-sky-300">{row[1]}</td>
                        {row.slice(2).map((val, idx) => (
                          <td key={idx} className="px-3 py-2 font-mono text-fog-200">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {tab === "event" && (
            <Panel title="Historical Incidents & NPT Comparison">
              {comparedWells.length > 0 && comparedWells.some((w) => w.npt > 0) ? (
                <BarChart
                  horizontal
                  unit=" hrs"
                  data={comparedWells.map((w) => ({ label: `${w.id} · ${w.events} ev`, value: w.npt }))}
                  colorFn={(_, i) => RISK_COLORS[comparedWells[i]?.risk] || "#38bdf8"}
                />
              ) : (
                <div className="py-4 text-center text-[11.5px] text-fog-500">
                  {comparedWells.length === 0
                    ? "Select offset wells to compare incidents."
                    : "No NPT records reported for the selected wells."}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {comparedWells.map((w) => {
                  const evts = historicalEvents.filter((e) => e.well === w.id);
                  return (
                    <div key={w.id} className="rounded-sm border border-line-soft bg-ink-900/60 p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-fog-100">{w.id}</span>
                        <span className="font-mono text-[10px] text-fog-500">{w.npt} hrs NPT</span>
                      </div>
                      <ul className="space-y-1">
                        {evts.map((e) => (
                          <li key={e.id} className="flex items-center gap-2 text-[10.5px] text-fog-400">
                            <i className="h-1.5 w-1.5 rotate-45" style={{ background: EVENT_COLORS[e.type] }} />
                            <span className="flex-1 truncate">{e.type}</span>
                            <span className="font-mono text-fog-500">{e.depth} m</span>
                          </li>
                        ))}
                        {!evts.length && <li className="text-[10px] text-fog-500">No recorded incidents</li>}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {tab === "production" && (
            <Panel title="Production Records Comparison">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-line-soft text-[9px] tracking-widest text-fog-500 uppercase">
                      {["Well", "Status", "Total Depth", "Production Rate", "Source Data"].map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparedWells.map((w) => (
                      <tr key={w.id} className="border-b border-line-soft/60 text-[11.5px]">
                        <td className="px-3 py-2 font-mono text-fog-200">{w.id}</td>
                        <td className="px-3 py-2 text-fog-400">{w.status}</td>
                        <td className="px-3 py-2 font-mono text-fog-300">{w.td > 0 ? `${w.td} m` : "—"}</td>
                        <td className="px-3 py-2 text-fog-100">{w.production || "Insufficient Data"}</td>
                        <td className="px-3 py-2 text-[10.5px] text-fog-500">Uploaded report</td>
                      </tr>
                    ))}
                    {!comparedWells.length && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-fog-500">
                          Select wells to view production records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================== FORMATION CORRELATION ================== */

export function Correlation({ onNavigate }: { onNavigate?: (r: RouteId) => void } = {}) {
  const { activeWell, historicalFormations, historicalEvents, analytics } = useActiveWell();
  const [activeTab, setActiveTab] = useState<"parameters" | "formations">("parameters");
  const paramCorrelations = analytics.parameterCorrelations || [];

  const formationList = useMemo(() => {
    const names = [...new Set(historicalFormations.map((f) => f.name))];
    if (activeWell.target && !names.includes(activeWell.target)) {
      names.unshift(activeWell.target);
    }
    return names;
  }, [activeWell.target, historicalFormations]);

  const [formation, setFormation] = useState(formationList[0] || activeWell.target || "");
  const f = historicalFormations.find((x) => x.name.toLowerCase() === formation.toLowerCase());
  const evts = historicalEvents.filter((e) => e.formation && e.formation.toLowerCase().includes(formation.toLowerCase()));

  const totalNptInFormation = evts.reduce((s, e) => s + (e.npt || 0), 0);

  return (
    <div>
      <PageHead
        icon="≣"
        title="Formation & Parameter Correlation"
        subtitle="Correlate real-time drilling parameters and historical stratigraphy to anticipate borehole risks and events."
        right={
          <Tabs
            value={activeTab}
            onChange={(val) => setActiveTab(val as "parameters" | "formations")}
            tabs={[
              { id: "parameters", label: "Drilling Parameters" },
              { id: "formations", label: "Stratigraphic Formations" },
            ]}
          />
        }
      />

      {activeTab === "parameters" ? (
        <div className="space-y-3">
          <Panel
            title="Drilling Parameter Correlation & Geohazard Linkage"
            subtitle="Observed Parameter Change/Pattern → Associated Disruption/Risk (8 Core Monitored Channels)"
            dense
            right={
              <Badge tone="accent">{paramCorrelations.length} Correlated Channels</Badge>
            }
          >
            <div className="divide-y divide-line-soft">
              {paramCorrelations.map((corr) => {
                const isAnomaly = corr.status === "Active Anomaly";
                const isElevated = corr.status === "Elevated Trend";
                return (
                  <div
                    key={corr.id}
                    className={cn(
                      "flex flex-col gap-2.5 p-3.5 transition-colors md:flex-row md:items-center md:justify-between",
                      isAnomaly ? "bg-red-500/5" : isElevated ? "bg-amber-500/5" : "hover:bg-ink-800/40",
                    )}
                  >
                    <div className="min-w-[200px] shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-fog-100">{corr.parameter}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-mono text-[9px]",
                            isAnomaly
                              ? "bg-red-500/20 text-red-300"
                              : isElevated
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-ink-800 text-fog-400",
                          )}
                        >
                          {corr.status}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10.5px] text-fog-400">
                        {corr.currentValue !== null ? (
                          <span className="text-sky-300">
                            Streaming Value: {corr.currentValue} {corr.unit}
                          </span>
                        ) : (
                          <span className="text-fog-500 italic">No live telemetry stream</span>
                        )}
                      </div>
                    </div>

                    {/* Parameter → Observed Pattern → Associated Event/Risk */}
                    <div className="flex-1 md:px-4">
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11.5px]">
                        <span className="rounded bg-ink-900 px-1.5 py-0.5 font-semibold text-fog-200">
                          {corr.parameter}
                        </span>
                        <span className="text-sky-400 font-bold">→</span>
                        <span className="text-fog-300">{corr.observedPattern}</span>
                        <span className="text-sky-400 font-bold">→</span>
                        <span
                          className={cn(
                            "font-semibold",
                            isAnomaly ? "text-red-400" : isElevated ? "text-amber-400" : "text-fog-100",
                          )}
                        >
                          {corr.correlatedEvent}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-fog-400">
                        <span>Depth: <strong className="font-mono text-fog-200">{corr.relevantDepthInterval}</strong></span>
                        <span>Evidence: <strong className="font-mono text-fog-200">{corr.supportingEventsCount} offset event(s)</strong></span>
                        <span>Confidence: <strong className="font-mono text-sky-300">{corr.correlationStrength}% ({corr.confidenceLevel})</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {onNavigate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigate("mitigation")}
                          className="w-full font-mono text-[10px] md:w-auto"
                        >
                          Mitigation →
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      ) : (
        <>
          {formationList.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {formationList.map((name) => (
                <button
                  key={name}
                  onClick={() => setFormation(name)}
                  className={cn(
                    "cursor-pointer rounded-sm border px-2.5 py-1 text-[11px] transition-colors",
                    formation === name
                      ? "border-sky-500/50 bg-sky-500/12 text-sky-300"
                      : "border-line-soft text-fog-400 hover:text-fog-200",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-3 rounded-md border border-line-soft bg-ink-850/60 p-3 text-[11.5px] text-fog-400">
              No formation markers identified in uploaded records. Upload geological or mud logging reports containing stratigraphy.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel
              title="Formation profile"
              subtitle={
                f && (f.top > 0 || f.base > 0)
                  ? `${f.top}–${f.base} m MD · ${f.litho}`
                  : formation
                    ? `Stratigraphic interval: ${formation}`
                    : "No formation selected"
              }
            >
              <p className="text-[11.5px] leading-relaxed text-fog-400">
                {f?.note || "Geological and incident correlation from uploaded historical files."}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["Incidents Recorded", `${evts.length}`],
                  ["Total NPT", `${totalNptInFormation.toFixed(1)} hrs`],
                  ["Lithology", f?.litho || "reservoir"],
                  ["Supporting Wells", `${new Set(evts.map((e) => e.well)).size}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-sm border border-line-soft bg-ink-900/60 px-2 py-1.5">
                    <div className="text-[9px] tracking-widest text-fog-500 uppercase">{k}</div>
                    <div className="mt-0.5 font-mono text-[14px] text-fog-100">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-line-soft pt-2.5">
                <div className="mb-1.5 font-mono text-[9.5px] tracking-widest text-fog-500 uppercase">
                  Events recorded in this formation ({evts.length})
                </div>
                <ul className="space-y-1">
                  {evts.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 text-[10.5px] text-fog-400">
                      <i className="h-1.5 w-1.5 rotate-45" style={{ background: EVENT_COLORS[e.type] }} />
                      <span className="w-16 font-mono text-fog-300">{e.well}</span>
                      <span className="flex-1 truncate">{e.type}</span>
                      <span className="font-mono text-fog-500">{e.depth} m</span>
                    </li>
                  ))}
                  {!evts.length && (
                    <li className="text-[11px] text-fog-500">
                      No incidents recorded in this formation in uploaded historical records.
                    </li>
                  )}
                </ul>
              </div>
            </Panel>

            <Panel title="NPT by Formation (Historical Records)" subtitle="Where downtime was recorded">
              {historicalEvents.some((e) => e.npt > 0 && e.formation) ? (
                <BarChart
                  horizontal
                  unit=" hrs"
                  data={Object.entries(
                    historicalEvents.reduce<Record<string, number>>((acc, e) => {
                      if (e.formation && e.npt > 0) {
                        acc[e.formation] = (acc[e.formation] ?? 0) + e.npt;
                      }
                      return acc;
                    }, {}),
                  ).map(([label, value]) => ({ label, value }))}
                  colorFn={(d) => (d.label === formation ? "#38bdf8" : "#1f4a6b")}
                />
              ) : (
                <div className="flex h-36 items-center justify-center text-center text-[11px] text-fog-500">
                  Insufficient historical NPT data associated with formation markers.
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
