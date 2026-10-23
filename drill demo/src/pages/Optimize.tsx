import { BarChart, Donut, LineChart } from "../components/charts";
import { Badge, Divider, Meter, PageHead, Panel } from "../components/ui";
import { cn } from "../utils/cn";
import { useActiveWell } from "../state/ActiveWellContext";

const CAUSE_COLORS = ["#ef4444", "#f5a524", "#22d3ee", "#60a5fa", "#fb7185", "#64748b"];
const RIG_RATE_DAY = 22400; // US$/day assumption for indicative NPT costing

/* ============================ NPT INTELLIGENCE ============================= */

export function NPTIntelligence() {
  const { nearbyWells, analytics } = useActiveWell();
  const total = analytics.npt.total;
  const hotspots = [...analytics.events].filter((e) => e.npt > 0).sort((a, b) => b.npt - a.npt).slice(0, 6);
  const trend = Object.entries(
    analytics.events.reduce<Record<string, number>>((out, event) => {
      const year = event.date ? event.date.slice(0, 4) : "Unknown";
      if (year !== "Unknown") {
        out[year] = (out[year] ?? 0) + event.npt;
      }
      return out;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <PageHead
        icon="◷"
        title="NPT Intelligence"
        subtitle="Where non-productive time actually occurs across uploaded historical offset records — by cause, depth band, formation, and well."
        right={<Badge tone="accent">{nearbyWells.length} historical offset(s)</Badge>}
      />

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total NPT", `${total.toFixed(1)}`, "hrs across uploaded records", "text-fog-100"],
          ["Average NPT", `${analytics.npt.averagePerWell.toFixed(1)}`, "hrs per historical well", "text-red-300"],
          ["Evidence Zones", `${analytics.riskZones.length}`, "historical event clusters", "text-amber-300"],
          ["Correlated Wells", `${nearbyWells.length}`, "in historical repository", "text-emerald-300"],
        ].map(([l, v, s, c]) => (
          <div key={l} className="rounded-md border border-line-soft bg-ink-850/70 px-3.5 py-3">
            <div className="text-[9px] tracking-[0.16em] text-fog-500 uppercase">{l}</div>
            <div className={cn("mt-1.5 font-mono text-[21px] leading-none font-semibold", c)}>{v}</div>
            <div className="mt-1.5 text-[10.5px] text-fog-500">{s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="NPT by cause" subtitle="Hours lost per event category">
          {total > 0 && analytics.npt.byCause.length > 0 ? (
            <Donut
              center={total.toFixed(1)}
              sub="total hrs"
              size={140}
              thickness={17}
              data={analytics.npt.byCause.map((n, i) => ({
                label: n.cause,
                value: n.hours,
                color: CAUSE_COLORS[i % CAUSE_COLORS.length],
              }))}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-center text-[11.5px] text-fog-500">
              No historical NPT hours recorded by cause
            </div>
          )}
        </Panel>

        <Panel title="NPT by depth band" subtitle="Concentration of historical downtime">
          {analytics.npt.byDepth.length > 0 && analytics.npt.byDepth.some((d) => d.hours > 0) ? (
            <BarChart
              data={analytics.npt.byDepth.map((d) => ({ label: d.band, value: d.hours }))}
              unit=" hrs"
              height={170}
              colorFn={(d) => (d.value > 25 ? "#ef4444" : d.value > 10 ? "#f5a524" : "#1f4a6b")}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-center text-[11.5px] text-fog-500">
              Insufficient depth-indexed NPT records
            </div>
          )}
        </Panel>

        <Panel title="NPT by formation" subtitle="Formations with highest downtime">
          {analytics.npt.byFormation.length > 0 && analytics.npt.byFormation.some((f) => f.hours > 0) ? (
            <BarChart
              horizontal
              unit=" hrs"
              data={analytics.npt.byFormation.map((f) => ({ label: f.formation, value: f.hours }))}
              colorFn={(d) => (d.value > 25 ? "#ef4444" : d.value > 10 ? "#f5a524" : "#10b981")}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-center text-[11.5px] text-fog-500">
              Insufficient formation-associated NPT records
            </div>
          )}
        </Panel>

        <Panel title="NPT trend by year" subtitle="Observed trend across dated records">
          {trend.length > 1 ? (
            <LineChart
              labels={trend.map(([year]) => year)}
              series={[{ name: "NPT hrs", color: "#38bdf8", points: trend.map(([, hours]) => hours) }]}
              height={170}
              yUnit=" hrs"
              area
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-center text-[11.5px] text-fog-500">
              Insufficient multi-year dated incident records
            </div>
          )}
        </Panel>

        <Panel title="Historical NPT hotspots" subtitle="Highest single-event downtime records" className="lg:col-span-2">
          {hotspots.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {hotspots.map((e) => (
                <div key={e.id} className="rounded-sm border border-line-soft bg-ink-900/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11.5px] text-fog-100">{e.well}</span>
                    <span className="font-mono text-[13px] font-semibold text-red-300">{e.npt} hrs</span>
                  </div>
                  <div className="mt-1 text-[11px] text-fog-300">{e.type}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-fog-500">
                    {e.depth > 0 ? `${e.depth} m` : ""} {e.formation ? `· ${e.formation}` : ""}
                  </div>
                  <div className="mt-1.5">
                    <Meter value={Math.min(100, (e.npt / 40) * 100)} tone="#ef4444" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[11.5px] text-fog-500">
              No NPT hotspot records in uploaded historical data.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ============================= COST EFFICIENCY ============================= */

export function CostEfficiency() {
  const { nearbyWells, analytics } = useActiveWell();
  const totalCost = analytics.cost.total;
  const totalNpt = analytics.npt.total;
  const estNptCostM = (totalNpt * (RIG_RATE_DAY / 24)) / 1_000_000;

  // Group recurring problems dynamically from real events
  const problemSummary = Object.entries(
    analytics.events.reduce<Record<string, { count: number; wells: Set<string>; npt: number }>>((acc, e) => {
      const key = `${e.type}${e.formation ? ` in ${e.formation}` : ""}`;
      acc[key] ??= { count: 0, wells: new Set(), npt: 0 };
      acc[key].count += 1;
      acc[key].wells.add(e.well);
      acc[key].npt += e.npt || 0;
      return acc;
    }, {}),
  )
    .map(([problem, data]) => ({
      problem,
      occurrences: data.count,
      wells: Array.from(data.wells),
      npt: data.npt,
      estCost: (data.npt * (RIG_RATE_DAY / 24)) / 1_000_000,
    }))
    .sort((a, b) => b.npt - a.npt)
    .slice(0, 5);

  return (
    <div>
      <PageHead
        icon="₹"
        title="Cost Efficiency & NPT Financial Impact"
        subtitle="Financial translation of historical NPT based on rig rate assumptions. Figures are calculated strictly from recorded downtime."
        right={<Badge tone="moderate">US$ {RIG_RATE_DAY.toLocaleString()}/day rig rate assumption</Badge>}
      />

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-red-500/25 bg-red-500/5 p-4">
          <div className="text-[9px] tracking-[0.16em] text-fog-500 uppercase">Estimated NPT Cost Impact</div>
          <div className="mt-1.5 font-mono text-[32px] leading-none font-semibold text-red-300">
            ${estNptCostM.toFixed(2)}M
          </div>
          <div className="mt-1.5 text-[11px] text-fog-500">
            Derived from {totalNpt.toFixed(1)} hrs recorded historical downtime
          </div>
        </div>

        <div className="rounded-md border border-line-soft bg-ink-850/70 p-4">
          <div className="text-[9px] tracking-[0.16em] text-fog-500 uppercase">Major Downtime Cause</div>
          <div className="mt-1.5 font-mono text-[20px] leading-none font-semibold text-fog-100">
            {analytics.npt.byCause[0]?.cause || "Insufficient Data"}
          </div>
          <div className="mt-1.5 text-[11px] text-fog-500">
            {analytics.npt.byCause[0]
              ? `${analytics.npt.byCause[0].hours.toFixed(1)} hrs recorded in historical data`
              : "No recorded downtime by cause"}
          </div>
        </div>

        <div className="rounded-md border border-emerald-500/25 bg-emerald-500/5 p-4">
          <div className="text-[9px] tracking-[0.16em] text-fog-500 uppercase">Historical Cost Data</div>
          <div className="mt-1.5 font-mono text-[20px] leading-none font-semibold text-emerald-300">
            {analytics.cost.hasCostData ? `$${totalCost.toFixed(2)}M` : "Insufficient Data"}
          </div>
          <div className="mt-1.5 text-[11px] text-fog-500">
            {analytics.cost.hasCostData
              ? `Reported well expenditure across ${nearbyWells.length} well(s)`
              : "Uploaded reports do not specify well CAPEX figures"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Estimated NPT Cost by Incident Type" subtitle="US$ million (indicative)">
          {analytics.npt.byCause.length > 0 ? (
            <BarChart
              horizontal
              unit="M"
              data={analytics.npt.byCause.map((n) => ({
                label: n.cause,
                value: parseFloat(((n.hours * (RIG_RATE_DAY / 24)) / 1_000_000).toFixed(3)),
              }))}
              colorFn={(_, i) => CAUSE_COLORS[i % CAUSE_COLORS.length]}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-center text-[11.5px] text-fog-500">
              No historical incident NPT records available
            </div>
          )}
        </Panel>

        <Panel title="Historical Well Delivery Cost" subtitle="Well delivery cost, US$M (when recorded)">
          {analytics.cost.hasCostData ? (
            <BarChart
              data={nearbyWells
                .filter((w) => w.cost > 0)
                .map((w) => ({ label: w.id, value: w.cost }))}
              unit="M"
              height={168}
              colorFn={(d) => (d.value > 7 ? "#ef4444" : d.value > 5 ? "#f5a524" : "#10b981")}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-center text-[11.5px] text-fog-500">
              Historical cost data not specified in uploaded reports. Figures are not fabricated.
            </div>
          )}
        </Panel>

        <Panel title="Recurring Costly Historical Problems" className="lg:col-span-2">
          {problemSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-line-soft text-[9px] tracking-widest text-fog-500 uppercase">
                    {["Problem / Formation", "Occurrences", "Wells Affected", "NPT (hrs)", "Est. Impact (US$M)"].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {problemSummary.map((r) => (
                    <tr key={r.problem} className="border-b border-line-soft/60 text-[11.5px]">
                      <td className="px-3 py-2 text-fog-200">{r.problem}</td>
                      <td className="px-3 py-2 font-mono text-fog-300">{r.occurrences}</td>
                      <td className="max-w-[240px] truncate px-3 py-2 font-mono text-[10px] text-fog-500">
                        {r.wells.join(", ")}
                      </td>
                      <td className="px-3 py-2 font-mono text-amber-300">{r.npt.toFixed(1)}</td>
                      <td className="px-3 py-2 font-mono text-red-300">${r.estCost.toFixed(2)}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-[11.5px] text-fog-500">
              No recurring disruption patterns recorded in uploaded historical dataset.
            </div>
          )}

          <Divider label="methodology" />
          <p className="text-[10.5px] leading-relaxed text-fog-500">
            Cost estimations apply an all-in rig rate assumption of US$ {RIG_RATE_DAY.toLocaleString()}/day to recorded NPT hours.
            Figures are indicative decision-support tools and not an accounting audit.
          </p>
        </Panel>
      </div>
    </div>
  );
}
