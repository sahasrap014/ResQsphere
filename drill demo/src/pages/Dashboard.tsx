import { useState } from "react";
import GeoMap, { MapLegend } from "../components/GeoMap";
import DepthProfile, { ProfileEvidence, type ProfileView } from "../components/DepthProfile";
import { BarChart, Donut, LineChart } from "../components/charts";
import { Badge, Button, Panel, Tabs } from "../components/ui";
import { EVENT_COLORS, validCoordinate, type RiskZone, type WellEvent } from "../data/nwis";
import { cn } from "../utils/cn";
import type { RouteId } from "../components/Shell";
import { useActiveWell } from "../state/ActiveWellContext";

const RADII = [5, 10, 20] as const;

const CHANNEL_DEFS = [
  { key: "depth", label: "Bit Depth", unit: "m", decimals: 1 },
  { key: "rop", label: "ROP", unit: "m/hr", decimals: 1 },
  { key: "wob", label: "WOB", unit: "kN", decimals: 0 },
  { key: "torque", label: "Torque", unit: "kN·m", decimals: 1 },
  { key: "rpm", label: "RPM", unit: "rpm", decimals: 0 },
  { key: "spp", label: "SPP", unit: "bar", decimals: 0 },
  { key: "flow", label: "Mud Flow", unit: "lpm", decimals: 0 },
  { key: "mw", label: "Mud Weight", unit: "SG", decimals: 2 },
];

export default function Dashboard({
  onNavigate,
  onAskAI,
}: {
  onNavigate: (r: RouteId) => void;
  onAskAI: () => void;
  onViewEvidence: (id: string) => void;
}) {
  const { activeWell, nearbyWells, analytics } = useActiveWell();
  const [radius, setRadius] = useState<number>(10);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<ProfileView>("risk");
  const [zone, setZone] = useState<RiskZone | null>(null);
  const [evt, setEvt] = useState<WellEvent | null>(null);

  const hasCoords = validCoordinate(activeWell.lat, activeWell.lon);
  const inRadius = hasCoords ? nearbyWells.filter((w) => w.distance <= radius) : nearbyWells;

  const liveParamsEntered = Object.keys(activeWell.liveParameters || {}).length > 0;
  const currentDepth = activeWell.liveParameters?.depth ?? 0;

  const riskZones = analytics.riskZones as RiskZone[];
  const paramCorrelations = analytics.parameterCorrelations || [];
  const proactiveAlerts = analytics.proactiveAlerts || [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="order-1 space-y-3 xl:col-start-1 xl:row-start-1">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Nearby Wells Panel */}
            <Panel
              title={activeWell.field ? `Nearby Wells — ${activeWell.field}` : "Nearby Historical Wells"}
              subtitle={
                hasCoords
                  ? `${inRadius.length} historical offset well(s) within ${radius} km`
                  : `${inRadius.length} historical offset well(s) uploaded`
              }
              dense
              className="min-h-[420px]"
              right={
                <div className="flex items-center gap-1">
                  {RADII.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={cn(
                        "cursor-pointer rounded-sm border px-1.5 py-0.5 font-mono text-[9.5px] transition-colors",
                        radius === r
                          ? "border-sky-500/50 bg-sky-500/12 text-sky-300"
                          : "border-line-soft text-fog-500 hover:text-fog-300",
                      )}
                    >
                      {r}km
                    </button>
                  ))}
                  <button
                    onClick={() => onNavigate("nearby")}
                    className="ml-1 cursor-pointer rounded-sm border border-line-soft px-1.5 py-0.5 font-mono text-[9.5px] text-fog-500 hover:text-sky-300"
                  >
                    EXPAND
                  </button>
                </div>
              }
            >
              <div className="relative h-[400px]">
                <GeoMap
                  radiusKm={radius}
                  selected={selected}
                  onSelect={setSelected}
                  compact
                  onNavigateToProfile={() => onNavigate("correlation")}
                />
              </div>
              <div className="border-t border-line-soft px-3 py-1.5">
                <MapLegend />
              </div>
            </Panel>

            {/* Depth Profile Panel */}
            <Panel
              title="2D Depth · Formation · Risk Profile"
              subtitle="What has happened at this depth before — and what is coming next"
              dense
              className="min-h-[420px]"
              right={
                <Tabs
                  value={view}
                  onChange={setView}
                  tabs={[
                    { id: "risk", label: "Risk" },
                    { id: "events", label: "Events" },
                    { id: "formation", label: "Formation" },
                    { id: "comparison", label: "Compare" },
                  ]}
                />
              }
            >
              <DepthProfile view={view} height={370} onSelectRisk={setZone} onSelectEvent={setEvt} />
            </Panel>
          </div>
        </div>

        {/* Real Drilling Parameters */}
        <div className="order-3 space-y-3 xl:col-start-1 xl:row-start-2">
          <Panel
            title="Current Drilling Parameters"
            subtitle={liveParamsEntered ? "User-entered rig parameters / stream" : "Awaiting parameter stream or manual input"}
            dense
            right={
              <div className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", liveParamsEntered ? "bg-emerald-400 blink" : "bg-fog-500")} />
                <span className={cn("font-mono text-[9.5px]", liveParamsEntered ? "text-emerald-400" : "text-fog-500")}>
                  {liveParamsEntered ? "CONNECTED" : "AWAITING DATA"}
                </span>
              </div>
            }
          >
            <div className="grid grid-cols-2 divide-x divide-y divide-line-soft sm:grid-cols-4 lg:grid-cols-8">
              {CHANNEL_DEFS.map((def) => {
                const val = activeWell.liveParameters?.[def.key];
                return (
                  <div key={def.key} className="px-3 py-2.5">
                    <div className="text-[8.5px] tracking-[0.16em] text-fog-500 uppercase">{def.label}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="font-mono text-[16px] leading-none font-semibold text-fog-100">
                        {val !== undefined ? val.toLocaleString(undefined, { minimumFractionDigits: def.decimals, maximumFractionDigits: def.decimals }) : "—"}
                      </span>
                      <span className="text-[9px] text-fog-500">{def.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Requirement 2: Dedicated Drilling Parameter Correlation Section */}
          <Panel
            title="Drilling Parameter Correlation & Risk Mapping"
            subtitle="Correlating rig telemetry & logs: Parameter → Observed Pattern → Associated Event/Risk"
            dense
            right={
              <Badge tone="accent">
                {paramCorrelations.length} Correlated Parameters
              </Badge>
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
                      "flex flex-col gap-2 p-3 transition-colors md:flex-row md:items-center md:justify-between",
                      isAnomaly ? "bg-red-500/5" : isElevated ? "bg-amber-500/5" : "hover:bg-ink-800/40",
                    )}
                  >
                    <div className="min-w-[180px] shrink-0">
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
                      <div className="mt-0.5 font-mono text-[10px] text-fog-400">
                        {corr.currentValue !== null ? (
                          <span className="text-sky-300">
                            Current: {corr.currentValue} {corr.unit}
                          </span>
                        ) : (
                          <span className="text-fog-500 italic">No live telemetry stream</span>
                        )}
                      </div>
                    </div>

                    {/* Parameter → Observed Pattern → Associated Event/Risk */}
                    <div className="flex-1 md:px-3">
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                        <span className="rounded bg-ink-900 px-1.5 py-0.5 font-semibold text-fog-200">
                          {corr.parameter.split(" ")[0]}
                        </span>
                        <span className="text-sky-400">→</span>
                        <span className="text-fog-300">{corr.observedPattern}</span>
                        <span className="text-sky-400">→</span>
                        <span className={cn("font-semibold", isAnomaly ? "text-red-400" : isElevated ? "text-amber-400" : "text-fog-100")}>
                          {corr.correlatedEvent}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-fog-400">
                        <span>Depth: <strong className="font-mono text-fog-200">{corr.relevantDepthInterval}</strong></span>
                        <span>Evidence: <strong className="font-mono text-fog-200">{corr.supportingEventsCount} offset event(s)</strong></span>
                        <span>Confidence: <strong className="font-mono text-sky-300">{corr.correlationStrength}% ({corr.confidenceLevel})</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigate("mitigation")}
                        className="w-full font-mono text-[10px] md:w-auto"
                      >
                        Mitigation →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Requirement 3: Dedicated Proactive Alerts Section */}
          <Panel
            title="Proactive Look-Ahead Alerts"
            subtitle="Predictive look-ahead advisory before problem depth is reached (50–300 m forward window)"
            dense
            right={
              <div className="flex items-center gap-1.5 font-mono text-[9.5px]">
                <Badge tone="high">
                  {proactiveAlerts.filter((a) => a.severity === "High").length} High
                </Badge>
                <Badge tone="moderate">
                  {proactiveAlerts.filter((a) => a.severity === "Medium").length} Medium
                </Badge>
              </div>
            }
          >
            {proactiveAlerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-line-soft bg-ink-900/80 font-mono text-[9px] uppercase tracking-wider text-fog-500">
                      <th className="px-3 py-2">Alert Type</th>
                      <th className="px-2.5 py-2">Severity</th>
                      <th className="px-2.5 py-2">Depth</th>
                      <th className="px-3 py-2">Reason</th>
                      <th className="px-3 py-2">Evidence</th>
                      <th className="px-3 py-2">Recommended Action</th>
                      <th className="px-2 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft font-sans">
                    {proactiveAlerts.slice(0, 6).map((alert) => {
                      const isHigh = alert.severity === "High";
                      return (
                        <tr
                          key={alert.id}
                          className={cn(
                            "transition-colors",
                            isHigh ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-ink-850",
                          )}
                        >
                          <td className="px-3 py-2.5 font-medium text-fog-100 whitespace-nowrap">
                            {alert.alertType || alert.title}
                          </td>
                          <td className="px-2.5 py-2.5">
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase",
                                alert.severity === "High"
                                  ? "bg-red-500/20 text-red-300"
                                  : alert.severity === "Medium"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-sky-500/20 text-sky-300",
                              )}
                            >
                              {alert.severity || "Info"}
                            </span>
                          </td>
                          <td className="px-2.5 py-2.5 font-mono text-[10.5px] text-sky-300 whitespace-nowrap">
                            {alert.depth || alert.depthRange}
                          </td>
                          <td className="max-w-[180px] px-3 py-2.5 text-fog-300">
                            {alert.reason || alert.detail}
                          </td>
                          <td className="max-w-[200px] px-3 py-2.5 text-[10.5px] text-fog-400">
                            {alert.evidence}
                          </td>
                          <td className="max-w-[220px] px-3 py-2.5 text-[10.5px] text-emerald-300">
                            {alert.recommendedAction}
                          </td>
                          <td className="px-2 py-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const matchedZone = riskZones.find((z) => alert.depth?.includes(`${z.top}`) || z.type === alert.mitigationType);
                                if (matchedZone) {
                                  setZone(matchedZone);
                                } else {
                                  onNavigate("alerts");
                                }
                              }}
                              className="cursor-pointer rounded border border-line-soft bg-ink-800 px-2 py-1 font-mono text-[9.5px] text-sky-300 hover:bg-sky-500/20"
                            >
                              Evidence →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-[11px] text-fog-500">
                No proactive alerts triggered. All forward depths within expected operational envelope.
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Panel title="Risk Trend vs Depth" subtitle="Calculated from correlated historical events">
              {riskZones.length > 0 ? (
                <>
                  <LineChart
                    labels={riskZones.map((r) => r.top)}
                    series={[{ name: "Evidence score", color: "#f5a524", points: riskZones.map((r) => r.similarity) }]}
                    height={158}
                    xLabel="MD"
                    area
                  />
                  <div className="mt-1 font-mono text-[9px] text-fog-500">
                    Evidence zones generated from supporting historical records
                  </div>
                </>
              ) : (
                <div className="flex h-36 items-center justify-center text-center text-[11px] text-fog-500">
                  Insufficient historical event data to model risk trend
                </div>
              )}
            </Panel>

            <Panel title="Historical Event Distribution" subtitle={`${analytics.events.length} events · ${nearbyWells.length} wells`}>
              {analytics.events.length > 0 ? (
                <BarChart
                  horizontal
                  data={Object.entries(
                    analytics.events.reduce<Record<string, number>>((o, e) => ({ ...o, [e.type]: (o[e.type] ?? 0) + 1 }), {}),
                  ).map(([label, value]) => ({ label, value }))}
                  colorFn={(d) => EVENT_COLORS[d.label as keyof typeof EVENT_COLORS] || "#38bdf8"}
                />
              ) : (
                <div className="flex h-36 items-center justify-center text-center text-[11px] text-fog-500">
                  No historical event records in uploaded data
                </div>
              )}
            </Panel>

            <Panel title="NPT Distribution" subtitle="Calculated from nearby historical events">
              {analytics.npt.total > 0 ? (
                <Donut
                  center={analytics.npt.total.toFixed(1)}
                  sub="total NPT hrs"
                  size={118}
                  thickness={14}
                  data={analytics.npt.byCause.map((n, i) => ({
                    label: n.cause,
                    value: n.hours,
                    color: ["#ef4444", "#f5a524", "#22d3ee", "#60a5fa", "#fb7185", "#64748b"][i % 6],
                  }))}
                />
              ) : (
                <div className="flex h-36 items-center justify-center text-center text-[11px] text-fog-500">
                  Insufficient historical NPT data
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* Right sidebar column */}
        <div className="order-2 space-y-3 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          {/* NWIS Intelligence Summary */}
          <section className="relative overflow-hidden rounded-md border border-violet-500/30 bg-gradient-to-b from-violet-500/8 to-ink-850 p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-violet-500/50 bg-violet-500/10 text-[10px] text-violet-300">
                ✦
              </span>
              <span className="text-[10px] font-semibold tracking-[0.16em] text-violet-300 uppercase">
                NWIS Intelligence
              </span>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-fog-200">
              {riskZones.length > 0 ? (
                <>
                  Historical evidence identifies <strong className="font-semibold text-fog-100">{riskZones[0].wells.length} supporting well(s)</strong> for the next correlated pattern: {riskZones[0].type} in {riskZones[0].formation}.
                </>
              ) : (
                "Insufficient historical evidence for a forward-looking insight. Upload historical well reports to correlate offset patterns."
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" onClick={() => onNavigate("historical")}>
                View historical cases
              </Button>
              <Button size="sm" variant="outline" onClick={() => onNavigate("mitigation")}>
                View mitigation
              </Button>
              <Button size="sm" variant="ghost" onClick={onAskAI}>
                Ask AI ✦
              </Button>
            </div>
          </section>

          {/* Active Well Summary */}
          <Panel title="Active Well Summary">
            <dl className="space-y-1.5">
              {[
                ["Well ID", activeWell.id || "Not specified"],
                ["Field", activeWell.field || "Not specified"],
                ["Rig", activeWell.rig || "Not specified"],
                ["Type / Trajectory", `${activeWell.type || "Development"} · ${activeWell.trajectory || "Vertical"}`],
                ["Planned TD", activeWell.plannedTd ? `${activeWell.plannedTd.toLocaleString()} m` : "Not specified"],
                ["Target reservoir", activeWell.target || "Not specified"],
                ["Current section", activeWell.section || "Not specified"],
                ["Last casing shoe", activeWell.casingShoe ? `${activeWell.casingShoe} m` : "Not specified"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line-soft/60 pb-1.5 text-[11px] last:border-0">
                  <dt className="shrink-0 text-fog-500">{k}</dt>
                  <dd className="truncate text-right text-fog-200">{v}</dd>
                </div>
              ))}
            </dl>
            {activeWell.plannedTd && currentDepth > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between font-mono text-[9.5px] text-fog-500">
                  <span>Well progress</span>
                  <span className="text-sky-300">
                    {((currentDepth / activeWell.plannedTd) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400"
                    style={{ width: `${Math.min(100, (currentDepth / activeWell.plannedTd) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Slide-out modal for inspect evidence */}
      {(zone || evt) && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50"
          onClick={() => {
            setZone(null);
            setEvt(null);
          }}
        >
          <div
            className="fade-up h-full w-full max-w-[400px] overflow-y-auto border-l border-line bg-ink-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-fog-100">
                  {zone ? "Predicted Risk Zone" : "Historical Event Record"}
                </h3>
                <p className="mt-0.5 text-[10.5px] text-fog-500">
                  {zone ? "Derived strictly from supporting historical evidence" : "Extracted from source report"}
                </p>
              </div>
              <button
                onClick={() => {
                  setZone(null);
                  setEvt(null);
                }}
                className="cursor-pointer text-fog-500 hover:text-fog-200"
              >
                ✕
              </button>
            </div>

            {zone && (
              <ProfileEvidence
                zone={zone}
                onOpenCases={() => {
                  setZone(null);
                  onNavigate("historical");
                }}
              />
            )}

            {evt && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge tone={evt.severity}>{evt.type}</Badge>
                  <span className="font-mono text-[11px] text-fog-300">
                    {evt.well} · {evt.depth} m
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-fog-300">{evt.summary}</p>
                {[
                  ["Formation", evt.formation || "Not specified"],
                  ["Date", evt.date || "Not specified"],
                  ["NPT", `${evt.npt} hrs`],
                  ["Mitigation applied", evt.mitigation],
                  ["Outcome", evt.outcome],
                  ["Source document", evt.source],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-sm border border-line-soft bg-ink-850 p-2">
                    <div className="text-[9px] tracking-widest text-fog-500 uppercase">{k}</div>
                    <div className="mt-0.5 text-[11.5px] leading-relaxed text-fog-200">{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
