import { useState } from "react";
import { ProfileEvidence } from "../components/DepthProfile";
import { Gauge } from "../components/charts";
import { Badge, Button, Divider, Meter, PageHead, Panel, SourceTag, Tabs } from "../components/ui";
import { RISK_COLORS } from "../data/nwis";
import { cn } from "../utils/cn";
import type { RouteId } from "../components/Shell";
import { useActiveWell } from "../state/ActiveWellContext";

/* ============================== ALERT CENTER =============================== */

export function AlertCenter({ onNavigate, onViewEvidence }: { onNavigate: (r: RouteId) => void; onViewEvidence: (id: string) => void }) {
  const { analytics } = useActiveWell();
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [acked, setAcked] = useState<string[]>([]);
  const list = analytics.alerts.filter((a) => filter === "all" || a.level === filter);

  return (
    <div>
      <PageHead
        icon="△"
        title="Alert Center"
        subtitle="Correlation between active well depth and historical incident patterns. Every alert carries verifiable historical evidence."
        right={
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: "all", label: "All" },
              { id: "critical", label: "Critical" },
              { id: "warning", label: "Warning" },
              { id: "info", label: "Info" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {list.map((a) => {
            const col = a.level === "critical" ? "#ef4444" : a.level === "warning" ? "#f5a524" : "#38bdf8";
            const isAcked = acked.includes(a.id);
            return (
              <section
                key={a.id}
                className={cn(
                  "relative overflow-hidden rounded-md border bg-ink-850/80 p-3.5",
                  isAcked ? "border-line-soft opacity-60" : "border-line",
                )}
              >
                <span className="absolute top-0 bottom-0 left-0 w-[3px]" style={{ background: col }} />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={a.level === "critical" ? "high" : a.level === "warning" ? "moderate" : "accent"} dot>
                        {a.severity ? `${a.severity.toUpperCase()} SEVERITY` : a.level === "critical" ? "HIGH RISK" : a.level.toUpperCase()}
                      </Badge>
                      <h3 className="text-[14px] font-semibold text-fog-100">
                        {a.alertType || a.title}
                      </h3>
                      {a.time && (
                        <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9px] text-sky-300">
                          {a.time}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-fog-300 font-medium">
                      <span className="text-fog-500 font-mono text-[10px] uppercase tracking-wider mr-1.5">Reason:</span>
                      {a.reason || a.detail}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-fog-500">Look-Ahead Advisory</span>
                </div>

                {/* Evidence & Correlation */}
                <div className="mt-2.5 rounded-sm border border-line-soft bg-ink-950/60 p-2 text-[11px] space-y-1.5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-fog-500 font-mono">Historical Evidence:</span>
                    <p className="text-fog-300 text-[10.5px] mt-0.5 leading-relaxed">
                      {a.evidence || `${a.wells.length} supporting offset wells (${a.wells.join(", ")}) logged disruptions at this interval.`}
                    </p>
                  </div>
                  {a.paramCorrelation && (
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-sky-400 font-mono">Parameter Correlation:</span>
                      <p className="text-sky-200 font-mono text-[10.5px] mt-0.5">
                        {a.paramCorrelation}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono">Recommended Action:</span>
                    <p className="text-emerald-300 text-[10.5px] mt-0.5 font-medium">
                      {a.recommendedAction || "Review drilling parameters, monitor real-time standpipe pressure, and prepare remedial pill."}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Mini label="Depth interval" value={a.depth || `${a.top}–${a.base} m`} />
                  <Mini label="Evidence score" value={`${a.similarity}%`} tone={col} />
                  <Mini label="Supporting wells" value={a.wells.length ? a.wells.join(" · ") : "Historical cluster"} />
                  <Mini label="Status" value={isAcked ? "Acknowledged" : "Open"} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onViewEvidence(a.id)}>
                    View evidence
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onNavigate("mitigation")}>
                    Mitigation options
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAcked((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                  >
                    {isAcked ? "Reopen" : "Acknowledge"}
                  </Button>
                </div>
              </section>
            );
          })}

          {!list.length && (
            <Panel title="Alerts status">
              <div className="p-8 text-center text-fog-500">
                <div className="text-[13px] font-medium text-fog-300">No active historical alerts</div>
                <p className="mt-1 text-[11px]">
                  Alerts are triggered when the active well bit depth approaches intervals where multiple historical offset wells experienced disruptions.
                </p>
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-3">
          <Panel title="Acknowledgement protocol" subtitle="Operational workflow for an open alert">
            <ol className="space-y-3">
              {[
                ["1", "Verify", "Confirm the alert against current rig floor parameters and operating program."],
                ["2", "Assign", "Acknowledge here and review relevant offset case history."],
                ["3", "Decide", "Open Risk Forecast or Mitigation to inspect historical remedies."],
                ["4", "Record", "Retain the decision and reference offset in the daily report."],
              ].map(([step, title, detail]) => (
                <li key={step} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/8 font-mono text-[10px] text-sky-300">
                    {step}
                  </span>
                  <div>
                    <div className="text-[11.5px] font-medium text-fog-200">{title}</div>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-fog-500">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Alert policy">
            <ul className="space-y-2 text-[11px] leading-relaxed text-fog-400">
              <li>· Critical alerts are logged when multiple supporting offsets recorded high-severity events.</li>
              <li>· All alerts link to the underlying historical documents.</li>
              <li>· Alerts never fabricate warnings without supporting historical incident records.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-sm border border-line-soft bg-ink-900/60 px-2 py-1.5">
      <div className="text-[9px] tracking-widest text-fog-500 uppercase">{label}</div>
      <div className="mt-0.5 font-mono text-[11.5px]" style={{ color: tone ?? "#cbd8e8" }}>
        {value}
      </div>
    </div>
  );
}

/* ============================== RISK FORECAST ============================== */

export function RiskForecast({ onNavigate }: { onNavigate?: (r: RouteId) => void } = {}) {
  const { analytics, activeWell } = useActiveWell();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const zones = analytics.riskZones;
  const zone = zones.find((item) => item.id === selectedZone) ?? zones[0];
  const currentDepth = activeWell.liveParameters?.depth ?? 0;

  if (!zone) {
    return (
      <div>
        <PageHead
          icon="◈"
          title="Risk & Disruption Forecast"
          subtitle="Forward-looking risk modeled strictly from historical event clusters along the trajectory."
        />
        <Panel title="Insufficient historical evidence">
          <div className="p-8 text-center">
            <div className="text-[13px] font-medium text-fog-300">
              Insufficient historical data available for risk forecasting
            </div>
            <p className="mx-auto mt-1 max-w-lg text-[11.5px] text-fog-400">
              Risk intervals are formed when multiple historical offset wells recorded recurring events at comparable depths.
              Upload daily drilling reports or NPT logs to model look-ahead risk.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHead
        icon="◈"
        title="Risk & Disruption Forecast"
        subtitle="Forward-looking risk intervals along the trajectory, calculated strictly from uploaded historical offset events."
        right={<Badge tone="accent">Historical Evidence Grounded</Badge>}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Forecast ladder */}
        <Panel title="Look-ahead ladder" dense>
          <div className="p-3">
            <div className="relative rounded-sm border border-sky-500/40 bg-sky-500/8 px-2.5 py-2">
              <div className="text-[9px] tracking-widest text-sky-400 uppercase">Current Bit Depth</div>
              <div className="font-mono text-[18px] font-semibold text-sky-200">
                {currentDepth > 0 ? `${currentDepth} m` : "Not streaming"}
              </div>
              <div className="text-[10px] text-fog-400">
                {activeWell.target ? `Target: ${activeWell.target}` : "Active well trajectory"}
              </div>
            </div>
            <div className="my-1.5 ml-4 h-4 w-px bg-line" />
            {zones.map((z, i) => (
              <div key={z.id}>
                <button
                  onClick={() => setSelectedZone(z.id)}
                  className={cn(
                    "w-full cursor-pointer rounded-sm border px-2.5 py-2 text-left transition-colors",
                    zone.id === z.id ? "border-sky-500/40 bg-ink-800" : "border-line-soft hover:bg-ink-800/60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] text-fog-100">{z.top.toLocaleString()} m</span>
                    <Badge tone={z.level}>{z.level}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: RISK_COLORS[z.level] }} />
                    <span className="text-[11.5px] text-fog-300">{z.type}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Meter value={z.similarity} tone={RISK_COLORS[z.level]} />
                    <span className="font-mono text-[9.5px] text-fog-500">{z.similarity}%</span>
                  </div>
                </button>
                {i < zones.length - 1 && <div className="my-1.5 ml-4 h-4 w-px bg-line" />}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Forecast decision horizon" subtitle="Action gates arranged by depth ahead" dense className="min-h-[520px]">
          <div className="p-4">
            <div className="relative ml-4 border-l border-line-soft py-3 pl-5">
              {zones.map((item) => {
                const distance = currentDepth > 0 ? item.top - currentDepth : null;
                const isSelected = zone.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedZone(item.id)}
                    className={cn(
                      "relative mb-3 block w-full cursor-pointer rounded-sm border p-3 text-left transition-colors last:mb-0",
                      isSelected ? "border-sky-500/45 bg-ink-800" : "border-line-soft bg-ink-900/45 hover:border-sky-500/30",
                    )}
                  >
                    <span
                      className="absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-ink-850"
                      style={{ background: RISK_COLORS[item.level] }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-fog-100">
                        {distance !== null ? (distance > 0 ? `${distance.toLocaleString()} m ahead` : "At bit") : `${item.top} m MD`}
                      </span>
                      <Badge tone={item.level}>{item.level}</Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-fog-300">Decision gate: {item.type}</div>
                    <div className="mt-1.5 font-mono text-[9.5px] text-fog-500">
                      Interval {item.top}–{item.base} m · {item.wells.length} supporting historical well(s)
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Prediction detail" subtitle={`${zone.type} · ${zone.top}–${zone.base} m`}>
            <div className="mb-3 flex items-center justify-around">
              <Gauge value={zone.similarity} label="Evidence score" color={RISK_COLORS[zone.level]} size={82} />
              <Gauge value={zone.probability || zone.similarity} label="Probability" color="#f5a524" size={82} />
              <Gauge value={zone.confidence} label="Confidence" color="#38bdf8" size={82} />
            </div>
            <p className="text-[11.5px] leading-relaxed text-fog-400">{zone.rationale}</p>
            <Divider label="supporting wells" />
            <div className="flex flex-wrap gap-1.5">
              {zone.wells.map((w) => (
                <span key={w} className="rounded-sm border border-line bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] text-fog-300">
                  {w}
                </span>
              ))}
            </div>
            <Divider label="mitigation observed in records" />
            <ul className="space-y-1.5">
              {zone.mitigation.map((m, i) => (
                <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-fog-400">
                  <span className="font-mono text-sky-500">{i + 1}.</span>
                  {m}
                </li>
              ))}
              {!zone.mitigation.length && (
                <li className="text-[10.5px] text-fog-500">Standard operational remediation</li>
              )}
            </ul>
          </Panel>

          <Panel title="Historical evidence" dense bodyClass="p-3">
            <ProfileEvidence
              zone={zone}
              onOpenCases={() => onNavigate?.("historical")}
              onOpenMitigation={() => onNavigate?.("mitigation")}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ============================ MITIGATION ENGINE ============================ */

export function Mitigation() {
  const { analytics, activeWell } = useActiveWell();
  const [event, setEvent] = useState<"Mud Loss" | "Stuck Pipe" | "Kick">("Mud Loss");

  const cases = analytics.events.filter((e) => e.type === event);
  const best = [...cases].sort((a, b) => a.npt - b.npt)[0];

  const options = Object.values(
    cases.reduce<Record<string, typeof cases>>((out, item) => {
      const key = item.mitigation || "Remediation applied";
      (out[key] ??= []).push(item);
      return out;
    }, {}),
  )
    .map((group, index) => ({
      name: group[0].mitigation || "Operational action",
      wells: [...new Set(group.map((item) => item.well))],
      success: Math.round(
        (group.filter((item) => !/abandon|unsuccess|persist/i.test(item.outcome)).length / group.length) * 100,
      ),
      npt: group.reduce((sum, item) => sum + item.npt, 0) / group.length,
      rank: index + 1,
    }))
    .sort((a, b) => a.npt - b.npt)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return (
    <div>
      <PageHead
        icon="⚕"
        title="Mitigation Recommendation Engine"
        subtitle="Historical mitigation actions extracted directly from daily drilling reports and mud logs — the engineer decides."
        right={
          <Tabs
            value={event}
            onChange={setEvent}
            tabs={[
              { id: "Mud Loss", label: "Mud Loss" },
              { id: "Stuck Pipe", label: "Stuck Pipe" },
              { id: "Kick", label: "Kick" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Incident category" subtitle="Queried from uploaded historical incident records">
          <div className="rounded-sm border border-amber-500/30 bg-amber-500/6 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-amber-200">{event}</span>
              <Badge tone={cases.length ? "low" : "moderate"}>
                {cases.length ? `${cases.length} records` : "No records"}
              </Badge>
            </div>
            <dl className="mt-2.5 space-y-1.5 text-[11px]">
              {[
                ["Active target", activeWell.target || "Not specified"],
                ["Supporting wells", `${new Set(cases.map((item) => item.well)).size}`],
                ["Matching cases", `${cases.length} historical records`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-fog-500">{k}</dt>
                  <dd className="text-right text-fog-200">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Divider label="similar historical cases" />
          <ul className="space-y-1.5">
            {cases.map((c) => (
              <li key={c.id} className="rounded-sm border border-line-soft bg-ink-900/60 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-fog-100">{c.well}</span>
                  <span className="font-mono text-[10px] text-fog-500">
                    {c.depth > 0 ? `${c.depth} m` : ""} {c.date ? `· ${c.date}` : ""}
                  </span>
                </div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-fog-400">{c.outcome || c.summary}</p>
                <div className="mt-1 flex items-center justify-between">
                  <SourceTag source={c.source} />
                  <Badge tone={c.severity}>{c.npt} hrs</Badge>
                </div>
              </li>
            ))}
            {!cases.length && (
              <li className="p-3 text-center text-[11px] text-fog-500">
                Insufficient historical cases for {event} in uploaded dataset.
              </li>
            )}
          </ul>
        </Panel>

        <Panel title="Historical mitigation outcomes" subtitle="Extracted verbatim from daily drilling reports">
          <div className="space-y-2.5">
            {options.map((o) => (
              <div
                key={o.name}
                className={cn(
                  "rounded-sm border p-2.5",
                  o.rank === 1 ? "border-emerald-500/35 bg-emerald-500/5" : "border-line-soft bg-ink-900/60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] leading-snug font-medium text-fog-100">{o.name}</span>
                  {o.rank === 1 && <Badge tone="low">Lowest NPT</Badge>}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[9px] tracking-wider text-fog-500 uppercase">Wells</div>
                    <div className="truncate font-mono text-[10.5px] text-fog-300">{o.wells.join(" · ")}</div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-wider text-fog-500 uppercase">Success</div>
                    <div className="font-mono text-[10.5px] text-emerald-400">{o.success}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-wider text-fog-500 uppercase">Mean NPT</div>
                    <div className="font-mono text-[10.5px] text-fog-300">{o.npt.toFixed(1)} hrs</div>
                  </div>
                </div>
              </div>
            ))}
            {!options.length && (
              <div className="p-4 text-center text-[11.5px] text-fog-500">
                No mitigation records for {event} in uploaded data.
              </div>
            )}
          </div>
          <p className="mt-3 border-t border-line-soft pt-2 text-[10.5px] leading-relaxed text-fog-500">
            Historical evidence only. Actions are extracted verbatim from daily reports — no artificial fallback applied.
          </p>
        </Panel>

        <div className="space-y-3">
          <section className="rounded-md border border-violet-500/30 bg-gradient-to-b from-violet-500/8 to-ink-850 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-violet-300 uppercase">
                <span className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-violet-500/50 bg-violet-500/10 text-[10px]">
                  ✦
                </span>
                Evidence Recommendation
              </span>
              <Badge tone="violet">Engineer Review</Badge>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-fog-200">
              {best
                ? `Lowest-NPT historical remedy for ${event}: ${best.mitigation}. Applied on ${best.well}. Outcome: ${best.outcome}`
                : `Insufficient historical data to formulate a mitigation recommendation for ${event}.`}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-violet-500/20 pt-2.5">
              <span className="font-mono text-[10px] text-fog-400">
                Evidence base: {cases.length} case(s)
              </span>
              <Badge tone={cases.length >= 3 ? "low" : "moderate"}>
                {cases.length >= 3 ? "High Evidence" : "Limited Evidence"}
              </Badge>
            </div>
          </section>

          {best && (
            <Panel title="Best-outcome historical reference">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] text-fog-100">{best.well}</span>
                  <span className="font-mono text-[10.5px] text-fog-500">
                    {best.depth > 0 ? `${best.depth} m` : ""}
                  </span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-fog-400">{best.summary}</p>
                <div className="rounded-sm border border-line-soft bg-ink-900/60 p-2">
                  <div className="text-[9px] tracking-widest text-fog-500 uppercase">Mitigation applied</div>
                  <div className="mt-0.5 text-[11.5px] text-fog-200">{best.mitigation}</div>
                </div>
                <div className="rounded-sm border border-emerald-500/25 bg-emerald-500/5 p-2">
                  <div className="text-[9px] tracking-widest text-emerald-400/80 uppercase">Outcome</div>
                  <div className="mt-0.5 text-[11.5px] text-fog-200">{best.outcome}</div>
                </div>
                <SourceTag source={best.source} />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
