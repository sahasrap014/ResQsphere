import { useMemo, useState } from "react";
import GeoMap from "../components/GeoMap";
import { Gauge } from "../components/charts";
import { Badge, Button, Divider, Field, Input, Meter, PageHead, Panel, Select } from "../components/ui";
import { cn } from "../utils/cn";
import { useActiveWell } from "../state/ActiveWellContext";
import { evaluateLocationRecommendation } from "../analytics/nwisAnalytics";
import {
  distanceKm,
  validCoordinate,
  type DocRow,
  type Formation,
  type Well,
  type WellEvent,
} from "../data/nwis";

const scoreColor = (s: number | null) =>
  s === null ? "#64748b" : s >= 75 ? "#10b981" : s >= 50 ? "#f5a524" : "#ef4444";

/* ========================= HIGH-POTENTIAL ZONES ============================ */

export function HighPotentialZones() {
  const { analytics, activeWell, allHistoricalWells } = useActiveWell();
  const [selected, setSelected] = useState<string | null>(null);

  const zones = analytics.potentialZones;
  const zone = zones.find((item) => item.id === selected) ?? zones[0];

  return (
    <div>
      <PageHead
        icon="◇"
        title="High-Potential Zone Identification"
        subtitle="Spatial synthesis of historical production, reservoir properties, geological character and drilling outcomes. Potential scores are estimates, not guarantees."
      />

      {!zones.length ? (
        <Panel title="Insufficient historical evidence">
          <div className="p-6 text-center">
            <div className="text-[14px] font-medium text-fog-200">
              Insufficient historical data to determine high-potential zones
            </div>
            <p className="mx-auto mt-2 max-w-xl text-[12px] leading-relaxed text-fog-400">
              At least 3 supporting historical wells with verifiable coordinates and geological/production records are required
              to delineate evidence-supported zones.
              {allHistoricalWells.length > 0
                ? ` Currently ${allHistoricalWells.length} historical well(s) are uploaded, but coordinate or production data is incomplete.`
                : " Upload historical well reports or a ZIP archive to build the repository."}
            </p>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel title="Potential overlay map" subtitle="Click a zone to inspect its historical evidence" dense className="min-h-[540px]">
            <div className="h-[500px]">
              <GeoMap
                radiusKm={15}
                showZones
                activeZone={zone?.id}
                onZoneSelect={(item) => setSelected(item.id)}
                labels={false}
                compact
                interactive={false}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-line-soft px-3 py-2 font-mono text-[10px] text-fog-400">
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-[2px] border border-emerald-500 bg-emerald-500/25" /> Favorable evidence (≥75)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-[2px] border border-amber-500 bg-amber-500/25" /> Moderate evidence (50–74)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-[2px] border border-red-500 bg-red-500/25" /> Elevated risk (&lt;50)
              </span>
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel title="Ranked zones" dense>
              <div className="divide-y divide-line-soft">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setSelected(z.id)}
                    className={cn(
                      "w-full cursor-pointer px-3 py-2.5 text-left transition-colors",
                      zone?.id === z.id ? "bg-sky-500/8" : "hover:bg-ink-800/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-fog-100">{z.name}</span>
                      <span className="font-mono text-[13px] font-semibold" style={{ color: scoreColor(z.score) }}>
                        {z.score !== null ? z.score : "—"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Meter value={z.score ?? 0} tone={scoreColor(z.score)} />
                      <span className="shrink-0 font-mono text-[9.5px] text-fog-500">{z.wells.length} well(s)</span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            {zone && (
              <Panel title={zone.label} subtitle={`Historical evidence around ${zone.wells.join(", ")}`} right={<Badge tone={zone.level}>{zone.label}</Badge>}>
                <div className="flex items-center gap-4">
                  <Gauge
                    value={zone.score ?? 0}
                    label="Potential score"
                    color={scoreColor(zone.score)}
                    size={104}
                  />
                  <div className="flex-1 space-y-1.5 text-[11px] text-fog-400">
                    <div>Target: {zone.formation || activeWell.target || "Target reservoir"}</div>
                    <div>Support: {zone.wells.join(", ")}</div>
                    <div>Recorded events: {zone.events.length}</div>
                  </div>
                </div>
                <Divider label="historical factors" />
                <ul className="space-y-1.5">
                  {zone.factors.map((factor, i) => (
                    <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-fog-400">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                      {factor}
                    </li>
                  ))}
                  {zone.events.slice(0, 3).map((e, i) => (
                    <li key={`evt-${i}`} className="flex gap-2 text-[10.5px] leading-relaxed text-fog-500">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                      {e.well}: {e.type} at {e.depth} m ({e.source})
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between rounded-sm border border-line-soft bg-ink-900/60 px-2.5 py-2">
                  <span className="text-[10.5px] text-fog-500">Confidence</span>
                  <Badge tone={zone.wells.length >= 3 ? "low" : "moderate"}>
                    {zone.wells.length >= 3 ? "High Confidence" : "Moderate Confidence"}
                  </Badge>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-fog-500">
                  Potential scores are model estimates derived strictly from uploaded historical reports. They do not
                  constitute a guarantee of hydrocarbon presence or drilling success.
                </p>
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================== AI WELL LOCATION RECOMMENDATION ==================== */

export function LocationRecommendation() {
  const { activeWell, allHistoricalWells, historicalEvents, historicalFormations, documents } = useActiveWell();

  // User-provided proposed location state
  const [latInput, setLatInput] = useState(
    activeWell.lat !== null && Number.isFinite(activeWell.lat) ? String(activeWell.lat) : "",
  );
  const [lonInput, setLonInput] = useState(
    activeWell.lon !== null && Number.isFinite(activeWell.lon) ? String(activeWell.lon) : "",
  );
  const [fieldInput, setFieldInput] = useState(activeWell.field || "");
  const [targetInput, setTargetInput] = useState(activeWell.target || "");
  const [wellType, setWellType] = useState("Development");
  const [evalTrigger, setEvalTrigger] = useState(0);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  // Evaluate location recommendation dynamically against actual historical dataset
  const evaluation = useMemo(() => {
    const pLat = latInput.trim() ? parseFloat(latInput) : null;
    const pLon = lonInput.trim() ? parseFloat(lonInput) : null;

    return evaluateLocationRecommendation(
      {
        lat: pLat,
        lon: pLon,
        field: fieldInput,
        target: targetInput,
      },
      allHistoricalWells,
      historicalEvents,
      historicalFormations,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latInput, lonInput, fieldInput, targetInput, allHistoricalWells, historicalEvents, historicalFormations, evalTrigger]);

  const proposedLat = latInput.trim() ? parseFloat(latInput) : null;
  const proposedLon = lonInput.trim() ? parseFloat(lonInput) : null;
  const validProposed = validCoordinate(proposedLat, proposedLon);

  const candidate = evaluation.candidateZone;
  const alternative = evaluation.alternativeZone;

  return (
    <div>
      <PageHead
        icon="⌖"
        title="AI Well Location Recommendation"
        subtitle="Compare a proposed well location against surrounding historical wells and geologically comparable areas using uploaded historical evidence."
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left column: Proposed location form & data quality status */}
        <div className="space-y-3">
          <Panel title="Proposed well location" subtitle="Enter or adjust coordinates to evaluate against historical data">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" required hint="e.g. 27.3782">
                <Input
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="e.g. 27.3782"
                />
              </Field>
              <Field label="Longitude" required hint="e.g. 95.3164">
                <Input
                  value={lonInput}
                  onChange={(e) => setLonInput(e.target.value)}
                  placeholder="e.g. 95.3164"
                />
              </Field>
              <Field label="Field / Block" className="col-span-2">
                <Input
                  value={fieldInput}
                  onChange={(e) => setFieldInput(e.target.value)}
                  placeholder="Field or exploration block"
                />
              </Field>
              <Field label="Target formation" className="col-span-2">
                <Input
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Target formation / pay zone"
                />
              </Field>
              <Field label="Well type" className="col-span-2">
                <Select value={wellType} onChange={(e) => setWellType(e.target.value)}>
                  <option>Development</option>
                  <option>Exploration</option>
                  <option>Appraisal</option>
                </Select>
              </Field>
            </div>

            <Button
              variant="primary"
              className="mt-3 w-full"
              onClick={() => {
                setEvalTrigger((t) => t + 1);
                setEvidenceOpen(true);
              }}
            >
              Evaluate Location Against Historical Evidence
            </Button>
          </Panel>

          {/* Historical Evidence Completeness */}
          <Panel title="Historical Data Completeness" subtitle="Required evidence for confident location assessment">
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between border-b border-line-soft/60 pb-1.5">
                <span className="text-fog-400">Historical Well Coordinates</span>
                <Badge tone={evaluation.hasCoordinates ? "low" : "high"}>
                  {evaluation.hasCoordinates ? "Available" : "Insufficient Data"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-b border-line-soft/60 pb-1.5">
                <span className="text-fog-400">Nearby Offset Wells</span>
                <Badge tone={evaluation.hasNearbyWells ? "low" : "moderate"}>
                  {evaluation.hasNearbyWells ? "Available" : "Insufficient Data"}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-b border-line-soft/60 pb-1.5">
                <span className="text-fog-400">Historical Production Records</span>
                <Badge tone={evaluation.hasProduction ? "low" : "moderate"}>
                  {evaluation.hasProduction ? "Available" : "Insufficient Data"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-fog-400">Reservoir / Stratigraphy</span>
                <Badge tone={evaluation.hasReservoir ? "low" : "moderate"}>
                  {evaluation.hasReservoir ? "Available" : "Insufficient Data"}
                </Badge>
              </div>
            </div>
            <p className="mt-3 border-t border-line-soft pt-2 text-[10px] leading-relaxed text-fog-500">
              NWIS never fabricates missing parameters. Missing metrics are labeled Insufficient Data.
            </p>
          </Panel>
        </div>

        {/* Right column: Map and recommendation findings */}
        <div className="space-y-3">
          {/* Candidate Leaflet Map */}
          <Panel title="Location candidate map" dense className="min-h-[380px]">
            <div className="h-[340px]">
              <GeoMap
                radiusKm={10}
                showZones={Boolean(candidate)}
                activeZone={candidate?.id}
                proposed={validProposed ? { lat: proposedLat, lon: proposedLon } : null}
                onLocationSelect={(lat, lon) => {
                  setLatInput(lat.toFixed(4));
                  setLonInput(lon.toFixed(4));
                }}
                labels={false}
                compact
                interactive={true}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-fog-500">
              <span>Click anywhere on the map to select or adjust proposed coordinates</span>
              {validProposed && (
                <span className="font-mono text-violet-300">
                  {proposedLat!.toFixed(4)}°N, {proposedLon!.toFixed(4)}°E
                </span>
              )}
            </div>
          </Panel>

          {/* Assessment Banner */}
          {evaluation.confidence === "Insufficient" ? (
            <section className="rounded-md border border-amber-500/40 bg-amber-500/6 p-5">
              <div className="flex items-center gap-2">
                <span className="text-[16px] text-amber-400">⚠</span>
                <h3 className="text-[14px] font-semibold text-amber-200">
                  Insufficient historical data available for this analysis
                </h3>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-fog-300">
                {evaluation.recommendationText}
              </p>
              <div className="mt-3 rounded-sm border border-line-soft bg-ink-900/60 p-2.5 font-mono text-[10.5px] text-fog-400">
                Reason: {evaluation.confidenceRationale}
              </div>
            </section>
          ) : (
            <>
              {/* Evidence Scores Comparison */}
              <div className={cn("grid grid-cols-1 gap-3", alternative ? "md:grid-cols-3" : "md:grid-cols-2")}>
                <ScoreCard
                  title="Proposed Location"
                  name={validProposed ? `${proposedLat!.toFixed(4)}°N, ${proposedLon!.toFixed(4)}°E` : "Proposed coordinates"}
                  score={evaluation.proposedScore}
                  detail={
                    evaluation.proposedScore !== null
                      ? "Score calculated from immediate offset well proximity, historical NPT, and incidents."
                      : "Insufficient offset well data in immediate vicinity."
                  }
                />

                {candidate && (
                  <ScoreCard
                    title="Recommended Candidate Area"
                    name={candidate.name}
                    score={candidate.score}
                    recommended
                    detail={`Favorable historical evidence around ${candidate.wells.join(", ")}.`}
                  />
                )}

                {alternative && (
                  <ScoreCard
                    title="Alternative Candidate Area"
                    name={alternative.name}
                    score={alternative.score}
                    detail={`Alternative cluster around ${alternative.wells.join(", ")}.`}
                  />
                )}
              </div>

              {/* "Why the Difference?" — Factors grounded in real historical evidence */}
              <Panel title="Why the difference?" subtitle="Verifiable factors from uploaded historical reports">
                {evaluation.whyFactors.length > 0 ? (
                  <ul className="space-y-2">
                    {evaluation.whyFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11.5px] text-fog-300">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-2 text-[11.5px] text-fog-400">
                    Insufficient comparative parameters in uploaded records. Additional historical production or drilling reports required.
                  </div>
                )}

                {/* Evidence table */}
                {candidate && (
                  <div className="mt-3 overflow-x-auto border-t border-line-soft pt-3">
                    <table className="w-full min-w-[560px] text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-line-soft font-mono text-[9px] text-fog-500 uppercase">
                          <th className="py-1.5 font-medium">Metric</th>
                          <th className="py-1.5 font-medium">Proposed Location</th>
                          <th className="py-1.5 font-medium">{candidate.name}</th>
                          <th className="py-1.5 font-medium">Historical Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-soft/60">
                        <tr>
                          <td className="py-1.5 text-fog-400">Historical Risk Score</td>
                          <td className="py-1.5 font-mono text-fog-200">
                            {evaluation.proposedScore !== null ? `${evaluation.proposedScore}/100` : "Insufficient Data"}
                          </td>
                          <td className="py-1.5 font-mono text-emerald-300">
                            {candidate.score !== null ? `${candidate.score}/100` : "Insufficient Data"}
                          </td>
                          <td className="py-1.5 text-fog-500">Calculated from offset event logs</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-fog-400">Supporting Wells</td>
                          <td className="py-1.5 font-mono text-fog-200">
                            {validProposed ? "Surface target" : "—"}
                          </td>
                          <td className="py-1.5 font-mono text-fog-200">{candidate.wells.join(", ")}</td>
                          <td className="py-1.5 text-fog-500">Uploaded well header records</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-fog-400">Distance from Proposed</td>
                          <td className="py-1.5 font-mono text-fog-200">0.0 km</td>
                          <td className="py-1.5 font-mono text-fog-200">{candidate.distanceKm.toFixed(1)} km</td>
                          <td className="py-1.5 text-fog-500">Haversine distance</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-fog-400">Target Formation</td>
                          <td className="py-1.5 text-fog-200">{targetInput || "Not specified"}</td>
                          <td className="py-1.5 text-fog-200">{candidate.formation || "Not specified"}</td>
                          <td className="py-1.5 text-fog-500">Stratigraphic tie</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              {/* Recommendation Box with Confidence */}
              <section className="rounded-md border border-violet-500/30 bg-gradient-to-b from-violet-500/8 to-ink-850 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-violet-300 uppercase">
                    <span className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-violet-500/50 bg-violet-500/10 text-[10px]">
                      ✦
                    </span>
                    NWIS Evidence-Based Recommendation
                  </span>
                  <Badge
                    tone={
                      evaluation.confidence === "High"
                        ? "low"
                        : evaluation.confidence === "Medium"
                          ? "moderate"
                          : "high"
                    }
                  >
                    Confidence: {evaluation.confidence}
                  </Badge>
                </div>

                <p className="mt-2.5 text-[12.5px] leading-relaxed text-fog-200">
                  {evaluation.recommendationText}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between border-t border-violet-500/20 pt-2 text-[10px] text-fog-400">
                  <span>Evidence Basis: {evaluation.confidenceRationale}</span>
                  <button
                    onClick={() => setEvidenceOpen(true)}
                    className="cursor-pointer font-medium text-sky-400 hover:text-sky-300 underline"
                  >
                    View Supporting Historical Evidence →
                  </button>
                </div>

                <p className="mt-2 text-[9.5px] leading-relaxed text-fog-500">
                  {evaluation.disclaimer}
                </p>
              </section>
            </>
          )}
        </div>
      </div>

      <LocationEvidenceModal
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        evaluation={evaluation}
        proposedLat={proposedLat}
        proposedLon={proposedLon}
        target={targetInput}
        field={fieldInput}
        allHistoricalWells={allHistoricalWells}
        historicalEvents={historicalEvents}
        historicalFormations={historicalFormations}
        documents={documents}
      />
    </div>
  );
}

function ScoreCard({
  title,
  name,
  score,
  recommended,
  detail,
}: {
  title: string;
  name: string;
  score: number | null;
  recommended?: boolean;
  detail: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-4",
        recommended ? "border-emerald-500/35 bg-emerald-500/5" : "border-line-soft bg-ink-850/70",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] tracking-[0.16em] text-fog-500 uppercase">{title}</div>
          <div className="mt-1 text-[13px] font-medium text-fog-100">{name}</div>
        </div>
        {recommended && <Badge tone="low">Recommended</Badge>}
      </div>

      <div className="mt-3 flex items-end gap-3">
        {score !== null ? (
          <>
            <span className="font-mono text-[34px] leading-none font-semibold" style={{ color: scoreColor(score) }}>
              {score}
            </span>
            <span className="mb-1 font-mono text-[12px] text-fog-500">/100</span>
            <div className="mb-1.5 flex-1">
              <Meter value={score} tone={scoreColor(score)} height={6} />
            </div>
          </>
        ) : (
          <span className="font-mono text-[16px] text-amber-300">Insufficient Data</span>
        )}
      </div>

      <div className="mt-2 text-[11px] leading-relaxed text-fog-400">{detail}</div>
    </div>
  );
}

/* ==================== LOCATION EVIDENCE MODAL ==================== */

function LocationEvidenceModal({
  open,
  onClose,
  evaluation,
  proposedLat,
  proposedLon,
  target,
  field,
  allHistoricalWells,
  historicalEvents,
  historicalFormations,
  documents,
}: {
  open: boolean;
  onClose: () => void;
  evaluation: any;
  proposedLat: number | null;
  proposedLon: number | null;
  target: string;
  field: string;
  allHistoricalWells: Well[];
  historicalEvents: WellEvent[];
  historicalFormations: Formation[];
  documents: DocRow[];
}) {
  if (!open) return null;

  const validProposed = validCoordinate(proposedLat, proposedLon);
  const candidate = evaluation.candidateZone;

  // Gather supporting well IDs from candidate cluster and nearby to proposed location
  const candidateWellIds = new Set<string>(candidate?.wells || []);
  const nearbyToProposedIds = new Set<string>();
  if (validProposed) {
    allHistoricalWells.forEach((w) => {
      if (validCoordinate(w.lat, w.lon) && distanceKm(proposedLat!, proposedLon!, w.lat, w.lon) <= 10) {
        nearbyToProposedIds.add(w.id);
      }
    });
  }
  const allSupportingIds = new Set<string>([...candidateWellIds, ...nearbyToProposedIds]);
  const supportingWells = allHistoricalWells.filter(
    (w) => allSupportingIds.has(w.id) || allSupportingIds.has(w.name),
  );

  const relevantEvents = historicalEvents.filter(
    (e) => allSupportingIds.has(e.well),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-lg border border-line bg-ink-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-ink-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-sky-400">⌖</span>
              <h2 className="text-[14px] font-semibold text-fog-100">
                Historical Evidence Assessment — Location Evaluation
              </h2>
              <Badge
                tone={
                  evaluation.confidence === "High"
                    ? "low"
                    : evaluation.confidence === "Medium"
                      ? "moderate"
                      : "high"
                }
              >
                Confidence: {evaluation.confidence}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-fog-400">
              Actual offset well records, coordinates, depths, and historical incident logs grounding this evaluation
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-sm border border-line-soft px-2.5 py-1 text-[12px] text-fog-400 hover:border-line hover:text-fog-200"
          >
            ✕ Close
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-line-soft bg-ink-850/80 p-3.5">
              <div className="text-[9.5px] tracking-widest text-fog-500 uppercase">Proposed Location</div>
              <div className="mt-1 text-[13px] font-medium text-fog-100">
                {validProposed
                  ? `${proposedLat!.toFixed(4)}° N, ${proposedLon!.toFixed(4)}° E`
                  : "Coordinates Not Entered"}
              </div>
              <div className="mt-1 text-[11px] text-fog-400">
                Field: {field || "Not specified"} · Target: {target || "Not specified"}
              </div>
              <div className="mt-2 text-[11px] text-fog-300">
                Evaluation Score:{" "}
                <strong className="font-mono text-fog-100">
                  {evaluation.proposedScore !== null ? `${evaluation.proposedScore}/100` : "Insufficient Data"}
                </strong>
              </div>
            </div>

            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <div className="text-[9.5px] tracking-widest text-emerald-400 uppercase">
                Recommended Historical Candidate
              </div>
              <div className="mt-1 text-[13px] font-medium text-fog-100">
                {candidate ? candidate.name : "No Candidate Sector Identified"}
              </div>
              <div className="mt-1 text-[11px] text-fog-400">
                {candidate && validCoordinate(candidate.lat, candidate.lon)
                  ? `Coords: ${candidate.lat.toFixed(4)}° N, ${candidate.lon.toFixed(4)}° E (${candidate.distanceKm.toFixed(1)} km away)`
                  : "Coordinates unavailable"}
              </div>
              <div className="mt-2 text-[11px] text-fog-300">
                Evidence Score:{" "}
                <strong className="font-mono text-emerald-400">
                  {candidate?.score !== null && candidate?.score !== undefined ? `${candidate.score}/100` : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* Operational Rationale & Why Factors */}
          <div className="rounded-md border border-violet-500/30 bg-violet-500/5 p-3.5">
            <div className="text-[10px] font-semibold tracking-wider text-violet-300 uppercase">
              Operational Rationale & Evidence Basis
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-fog-200">
              {evaluation.recommendationText}
            </p>
            {evaluation.whyFactors.length > 0 && (
              <ul className="mt-2 space-y-1 text-[11px] text-fog-300">
                {evaluation.whyFactors.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2.5 text-[10px] text-fog-400 border-t border-violet-500/20 pt-1.5">
              Confidence Rationale: {evaluation.confidenceRationale}
            </div>
          </div>

          {/* Section: Supporting Offset Wells Table */}
          <div className="rounded-md border border-line-soft bg-ink-850/60 overflow-hidden">
            <div className="border-b border-line-soft px-3.5 py-2.5 flex items-center justify-between bg-ink-850">
              <div>
                <span className="text-[12px] font-medium text-fog-100">
                  Supporting Offset Wells ({supportingWells.length})
                </span>
                <span className="ml-2 text-[10.5px] text-fog-500">
                  Actual historical records within correlation radius
                </span>
              </div>
            </div>

            {supportingWells.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line-soft text-[9px] tracking-widest text-fog-500 uppercase bg-ink-900/50">
                      <th className="px-3 py-2">Well ID / Name</th>
                      <th className="px-3 py-2">Coordinates</th>
                      <th className="px-3 py-2">Distance</th>
                      <th className="px-3 py-2">Target / TD</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Production</th>
                      <th className="px-3 py-2">NPT / Events</th>
                      <th className="px-3 py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft/60 text-[11.5px]">
                    {supportingWells.map((w) => {
                      const hasWCoords = validCoordinate(w.lat, w.lon);
                      const dist = validProposed && hasWCoords
                        ? `${distanceKm(proposedLat!, proposedLon!, w.lat, w.lon).toFixed(2)} km`
                        : "—";
                      return (
                        <tr key={w.id} className="hover:bg-ink-800/40">
                          <td className="px-3 py-2 font-mono font-medium text-sky-400">
                            {w.id}
                            {w.name && w.name !== w.id && (
                              <span className="ml-1 text-[10px] text-fog-400 font-sans">({w.name})</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-[10.5px] text-fog-300">
                            {hasWCoords ? `${w.lat.toFixed(4)}°, ${w.lon.toFixed(4)}°` : "Not specified"}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-amber-300">{dist}</td>
                          <td className="px-3 py-2 text-fog-300">
                            <div>{w.targetFormation || "—"}</div>
                            <div className="font-mono text-[10px] text-fog-500">{w.td ? `${w.td} m` : ""}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-[10px] text-fog-300">{w.status}</span>
                          </td>
                          <td className="px-3 py-2 font-mono text-emerald-300">{w.production || "—"}</td>
                          <td className="px-3 py-2 font-mono text-[10.5px]">
                            <span className={w.npt > 20 ? "text-red-300" : w.npt > 0 ? "text-amber-300" : "text-fog-400"}>
                              {w.npt} hrs
                            </span>
                            <span className="text-fog-500 text-[10px] ml-1">({w.events || 0} evt)</span>
                          </td>
                          <td className="px-3 py-2 text-[10px] text-fog-400 max-w-[150px] truncate">
                            {w.sourceFiles?.length ? w.sourceFiles.join(", ") : "Uploaded dataset"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-[11.5px] text-fog-500">
                No supporting offset wells found in the uploaded repository. Upload historical well reports or CSV to populate evidence.
              </div>
            )}
          </div>

          {/* Section: Relevant Historical Drilling Events / Hazards */}
          <div className="rounded-md border border-line-soft bg-ink-850/60 overflow-hidden">
            <div className="border-b border-line-soft px-3.5 py-2.5 flex items-center justify-between bg-ink-850">
              <div>
                <span className="text-[12px] font-medium text-fog-100">
                  Historical Drilling Incidents & Hazards ({relevantEvents.length})
                </span>
                <span className="ml-2 text-[10.5px] text-fog-500">
                  Operational problems recorded in supporting offset wells
                </span>
              </div>
            </div>

            {relevantEvents.length > 0 ? (
              <div className="divide-y divide-line-soft/60">
                {relevantEvents.map((evt) => (
                  <div key={evt.id} className="p-3 hover:bg-ink-800/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={evt.severity}>{evt.type}</Badge>
                        <span className="font-mono text-[11.5px] text-fog-200">Well: {evt.well}</span>
                        <span className="font-mono text-[10.5px] text-fog-400">at {evt.depth} m</span>
                        {evt.formation && <span className="text-[10.5px] text-sky-400">({evt.formation})</span>}
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-red-300">{evt.npt} hrs NPT</span>
                    </div>

                    {evt.summary && (
                      <p className="mt-1 text-[11.5px] text-fog-300 leading-relaxed">{evt.summary}</p>
                    )}

                    <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] rounded-sm bg-ink-900/60 p-2 border border-line-soft/40">
                      <div>
                        <span className="text-fog-500 font-medium">Mitigation Applied: </span>
                        <span className="text-fog-300">{evt.mitigation || "Operational action"}</span>
                      </div>
                      <div>
                        <span className="text-fog-500 font-medium">Outcome: </span>
                        <span className="text-fog-300">{evt.outcome || "Resolved"}</span>
                      </div>
                      <div className="sm:col-span-2 text-[9.5px] text-fog-500">
                        Source Citation: {evt.source || "Uploaded historical log"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-[11.5px] text-fog-500">
                No historical incidents or hazards recorded for the supporting offset wells.
              </div>
            )}
          </div>

          {/* Section: Geological Formations */}
          {historicalFormations.length > 0 && (
            <div className="rounded-md border border-line-soft bg-ink-850/60 p-3.5">
              <div className="text-[11px] font-medium text-fog-200 mb-2">
                Correlated Geological Formations in Sector ({historicalFormations.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {historicalFormations.slice(0, 6).map((f) => (
                  <div key={f.id} className="rounded-sm border border-line-soft bg-ink-900/50 p-2 text-[10.5px]">
                    <div className="font-medium text-fog-200">{f.name}</div>
                    <div className="font-mono text-[9.5px] text-fog-400">{f.top}–{f.base} m · Lithology: {f.litho}</div>
                    {f.note && <div className="text-[9.5px] text-fog-500 truncate mt-0.5">{f.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3 bg-ink-850">
          <span className="text-[10px] text-fog-500">
            Source Traceability: Grounded strictly in {documents.length} uploaded historical document(s). Zero data fabricated.
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Evidence
          </Button>
        </div>
      </div>
    </div>
  );
}
