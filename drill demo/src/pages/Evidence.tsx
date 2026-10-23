import { Badge, Button, PageHead, Panel } from "../components/ui";
import { validCoordinate } from "../data/nwis";
import { useActiveWell } from "../state/ActiveWellContext";

export function Evidence({ alertId, onBack }: { alertId: string | null; onBack: () => void }) {
  const { activeWell, nearbyWells, historicalEvents, historicalFormations, documents, analytics } = useActiveWell();
  const alert = analytics.alerts.find((a) => a.id === alertId) ?? analytics.alerts[0];
  const zone = analytics.riskZones.find((z) => z.id === alert?.id) ?? analytics.riskZones[0];
  const supportingIds = new Set(alert?.wells ?? zone?.wells ?? []);
  const supportingWells = nearbyWells.filter((w) => supportingIds.has(w.id) || supportingIds.has(w.name));
  const events = historicalEvents.filter((e) => supportingIds.has(e.well));
  const formations = historicalFormations.filter((f) => !zone?.formation || f.name.toLowerCase() === zone.formation.toLowerCase());

  return (
    <div>
      <PageHead
        icon="▣"
        title="Evidence"
        subtitle="Supporting historical records used for this recommendation"
        right={<Button size="sm" variant="outline" onClick={onBack}>← Back</Button>}
      />
      <div className="space-y-3">
        {alert && (
          <Panel title="Recommendation evidence" subtitle="Traceable to the uploaded historical dataset">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <EvidenceItem label="Alert" value={alert.title} />
              <EvidenceItem label="Depth interval" value={`${alert.top}–${alert.base} m`} />
              <EvidenceItem label="Evidence score" value={`${alert.similarity ?? zone?.similarity ?? 0}%`} />
              <EvidenceItem label="Supporting wells" value={`${supportingIds.size}`} />
            </div>
            <div className="mt-3 rounded-sm border border-line-soft bg-ink-850 p-3">
              <div className="text-[9px] tracking-widest text-fog-500 uppercase">Why this evidence was used</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-fog-300">{alert.detail}</p>
              {zone?.rationale && <p className="mt-2 text-[11px] leading-relaxed text-fog-500">{zone.rationale}</p>}
            </div>
          </Panel>
        )}
        <Panel title="Supporting wells" subtitle="Actual well records from the uploaded historical data" dense>
          {supportingWells.length ? (
            <div className="divide-y divide-line-soft">
              {supportingWells.map((well) => (
                <div key={well.id} className="grid grid-cols-2 gap-x-5 gap-y-2 px-3 py-3 sm:grid-cols-4">
                  <EvidenceItem label="Well ID" value={well.id} />
                  <EvidenceItem label="Well name" value={well.name} />
                  <EvidenceItem label="Latitude" value={validCoordinate(well.lat, well.lon) ? well.lat.toFixed(6) : "Not specified"} />
                  <EvidenceItem label="Longitude" value={validCoordinate(well.lat, well.lon) ? well.lon.toFixed(6) : "Not specified"} />
                  <EvidenceItem label="Distance" value={validCoordinate(well.lat, well.lon) && validCoordinate(activeWell.lat, activeWell.lon) ? `${well.distance.toFixed(2)} km` : "Coordinates unavailable"} />
                  <EvidenceItem label="Target formation" value={well.targetFormation || "Not specified"} />
                  <EvidenceItem label="Status" value={well.status} />
                  <EvidenceItem label="Production" value={well.production || "Not recorded"} />
                  <EvidenceItem label="TD" value={`${well.td.toLocaleString()} m`} />
                  <EvidenceItem label="Spud date" value={well.spud || "Not specified"} />
                  <EvidenceItem label="Avg ROP" value={`${well.avgRop} m/hr`} />
                  <EvidenceItem label="NPT" value={`${well.npt} hrs`} />
                  <div className="col-span-2 sm:col-span-4">
                    <div className="text-[9px] tracking-widest text-fog-500 uppercase">Source file(s)</div>
                    <div className="mt-0.5 text-[11px] text-fog-200">{well.sourceFiles?.length ? well.sourceFiles.join(", ") : "Uploaded historical dataset"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="p-6 text-center text-[11px] text-fog-500">No matching supporting well records were found in the uploaded dataset.</div>}
        </Panel>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Panel title="Historical event records" subtitle="Events associated with the supporting wells" dense>
            {events.length ? events.map((event) => (
              <div key={event.id} className="border-b border-line-soft p-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={event.severity}>{event.type}</Badge>
                  <span className="font-mono text-[10px] text-fog-500">{event.well} · {event.depth} m</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-fog-300">{event.summary}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <EvidenceItem label="Formation" value={event.formation || "Not specified"} />
                  <EvidenceItem label="Date" value={event.date || "Not specified"} />
                  <EvidenceItem label="NPT" value={`${event.npt} hrs`} />
                  <EvidenceItem label="Source" value={event.source || "Historical record"} />
                </div>
              </div>
            )) : <div className="p-6 text-center text-[11px] text-fog-500">No event records matched this evidence set.</div>}
          </Panel>
          <Panel title="Geological evidence" subtitle="Formation information associated with the recommendation" dense>
            {zone && (
              <div className="mb-3 rounded-sm border border-line-soft bg-ink-850 p-3">
                <div className="text-[9px] tracking-widest text-fog-500 uppercase">Correlated formation</div>
                <div className="mt-1 text-[13px] font-medium text-fog-100">{zone.formation}</div>
                <div className="mt-1 text-[10.5px] text-fog-400">{zone.type} · similarity {zone.similarity}% · confidence {zone.confidence}%</div>
              </div>
            )}
            {formations.length ? formations.map((formation) => (
              <div key={formation.id} className="border-b border-line-soft p-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-fog-200">{formation.name}</span>
                  <span className="font-mono text-[9.5px] text-fog-500">{formation.top}–{formation.base} m</span>
                </div>
                <div className="mt-1 text-[10.5px] text-fog-400">Lithology: {formation.litho}</div>
                {formation.note && <p className="mt-1 text-[10.5px] leading-relaxed text-fog-500">{formation.note}</p>}
                {formation.source && <div className="mt-1 text-[9.5px] text-fog-500">Source: {formation.source}</div>}
              </div>
            )) : <div className="p-6 text-center text-[11px] text-fog-500">No matching formation record was found.</div>}
          </Panel>
        </div>
        <Panel title="Source traceability" subtitle="Files currently ingested by NWIS" dense>
          {documents.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <div key={doc.name} className="rounded-sm border border-line-soft bg-ink-850 p-2.5">
                  <div className="text-[11px] font-medium text-fog-200">{doc.name}</div>
                  <div className="mt-1 font-mono text-[9.5px] text-fog-500">{doc.kind} · {doc.status} · {doc.wells} wells · {doc.events} events</div>
                </div>
              ))}
            </div>
          ) : <div className="p-4 text-[11px] text-fog-500">No uploaded source documents are currently available.</div>}
        </Panel>
      </div>
    </div>
  );
}

function EvidenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[8.5px] tracking-[0.12em] text-fog-500 uppercase">{label}</div>
      <div className="mt-0.5 break-words text-[11px] text-fog-200">{value}</div>
    </div>
  );
}
