import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "../components/ui";
import { Stepper } from "./Setup";
import { cn } from "../utils/cn";
import { useActiveWell } from "../state/ActiveWellContext";

const STAGES = [
  { id: "upload", label: "Upload & Ingestion", detail: "Reading uploaded files and ZIP archives" },
  { id: "extract", label: "Data Extraction", detail: "Extracting coordinates, well headers, and lithology" },
  { id: "nlp", label: "Event & Incident Indexing", detail: "Parsing drilling events, mud losses, and NPT records" },
  { id: "correlate", label: "Spatial & Stratigraphic Correlation", detail: "Calculating true offset proximity to active well" },
  { id: "ai", label: "Analytics & Risk Modeling", detail: "Generating evidence-grounded risk intervals and recommendations" },
];

export default function Processing({ onDone }: { onDone: () => void }) {
  const { activeWell, nearbyWells, allHistoricalWells, historicalEvents, historicalFormations, documents, analytics } = useActiveWell();

  const facts = useMemo(() => [
    { label: "historical documents processed", value: documents.length, at: 0 },
    { label: "historical wells identified", value: allHistoricalWells.length, at: 1 },
    { label: "historical events extracted", value: historicalEvents.length, at: 2 },
    { label: "formations identified", value: historicalFormations.length, at: 2 },
    { label: "offset wells correlated", value: nearbyWells.length, at: 3 },
    { label: "evidence zones generated", value: analytics.riskZones.length, at: 4 },
  ], [allHistoricalWells.length, analytics.riskZones.length, documents.length, historicalEvents.length, historicalFormations.length, nearbyWells.length]);

  const logLines = useMemo(() => {
    const lines: string[] = [];
    lines.push(`› mounting project repository${activeWell.id ? ` for active well: ${activeWell.id}` : ""}`);

    if (documents.length > 0) {
      documents.slice(0, 7).forEach((doc) => {
        lines.push(`› parsed: ${doc.name} (${doc.size}) — ${doc.wells} well(s), ${doc.events} event(s)`);
      });
      if (allHistoricalWells.length > 0) {
        lines.push(`› extracted coordinates for ${allHistoricalWells.filter((w) => w.lat && w.lon).length} historical well(s)`);
      }
      if (nearbyWells.length > 0) {
        lines.push(`› calculated true spatial proximity for ${nearbyWells.length} historical offset(s)`);
      }
      lines.push(`› dynamic analytics generated from ${historicalEvents.length} historical incident record(s)`);
    } else {
      lines.push("› notice: no historical files uploaded; repository initialized in clean state");
      lines.push("› all analytics will reflect unpopulated / insufficient historical data state");
    }

    lines.push("› ready: NWIS intelligence layer online");
    return lines;
  }, [activeWell.id, allHistoricalWells, documents, historicalEvents.length, nearbyWells.length]);

  const [stage, setStage] = useState(0);
  const [pct, setPct] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const done = stage >= STAGES.length;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          setStage((s) => s + 1);
          return 0;
        }
        return p + 18;
      });
    }, 45);
    return () => clearInterval(t);
  }, [done]);

  useEffect(() => {
    if (logs.length >= logLines.length) return;
    const t = setTimeout(() => setLogs((l) => [...l, logLines[l.length]]), 250);
    return () => clearTimeout(t);
  }, [logs, logLines]);

  return (
    <div className="tech-grid flex min-h-screen flex-col bg-ink-950">
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-line-soft bg-ink-900/70 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-sky-500/50 bg-sky-500/10">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-sky-400">
              <path d="M10 1v18M4 6l6-4 6 4M4 6v8l6 4 6-4V6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          <div>
            <div className="text-[13px] leading-none font-bold tracking-[0.18em] text-fog-100">NWIS</div>
            <div className="mt-0.5 text-[8.5px] tracking-[0.14em] text-fog-500 uppercase">
              Building Knowledge Repository
            </div>
          </div>
        </div>
        <Badge tone={done ? "low" : "accent"} dot>
          {done ? "Analysis complete" : "Processing"}
        </Badge>
      </header>

      <div className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-7">
        <Stepper active={2} />

        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Pipeline */}
          <div className="rounded-md border border-line-soft bg-ink-850/80 p-5">
            <h2 className="text-[11px] font-semibold tracking-[0.16em] text-fog-300 uppercase">Processing pipeline</h2>
            <ol className="mt-4 space-y-0">
              {STAGES.map((s, i) => {
                const state = i < stage ? "done" : i === stage ? "active" : "wait";
                return (
                  <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < STAGES.length - 1 && (
                      <span className={cn("absolute top-6 bottom-0 left-[11px] w-px", i < stage ? "bg-emerald-500/40" : "bg-line")} />
                    )}
                    <span
                      className={cn(
                        "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]",
                        state === "done"
                          ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                          : state === "active"
                            ? "border-sky-400 bg-sky-500/15 text-sky-300"
                            : "border-line bg-ink-900 text-fog-500",
                      )}
                    >
                      {state === "done" ? "✓" : state === "active" ? <span className="h-2 w-2 rounded-full bg-sky-400 blink" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={cn("text-[12.5px] font-medium", state === "wait" ? "text-fog-500" : "text-fog-100")}>{s.label}</span>
                        {state === "active" && <span className="font-mono text-[10px] text-sky-400">{Math.min(100, Math.round(pct))}%</span>}
                        {state === "done" && <span className="font-mono text-[10px] text-emerald-500/80">complete</span>}
                      </div>
                      <p className="mt-0.5 text-[11px] text-fog-500">{s.detail}</p>
                      {state === "active" && (
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-700">
                          <div className="h-full bg-sky-400 transition-all duration-100" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Results + real log */}
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-line-soft bg-ink-850/80 p-5">
              <h2 className="text-[11px] font-semibold tracking-[0.16em] text-fog-300 uppercase">Extraction results</h2>
              <ul className="mt-3 space-y-2">
                {facts.map((f) => {
                  const revealed = stage >= f.at;
                  return (
                    <li
                      key={f.label}
                      className={cn(
                        "flex items-center justify-between rounded-sm border px-2.5 py-2 transition-all duration-500",
                        revealed ? "fade-up border-line-soft bg-ink-900/70" : "border-dashed border-line/60 opacity-40",
                      )}
                    >
                      <span className="flex items-center gap-2 text-[12px] text-fog-300">
                        <span className={cn("font-mono text-[11px]", revealed ? "text-emerald-400" : "text-fog-500")}>
                          {revealed ? "✓" : "○"}
                        </span>
                        {f.label}
                      </span>
                      <span className={cn("font-mono text-[15px] font-semibold", revealed ? "text-fog-100" : "text-fog-500")}>
                        {revealed ? f.value : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="min-h-[168px] flex-1 rounded-md border border-line-soft bg-ink-950/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9.5px] tracking-widest text-fog-500 uppercase">historical extraction log</span>
                <span className="font-mono text-[9.5px] text-fog-500">stdout</span>
              </div>
              <div className="h-[150px] space-y-0.5 overflow-y-auto font-mono text-[10.5px] leading-relaxed">
                {logs.map((l, i) => (
                  <div key={i} className={cn("fade-up", l.includes("ready") ? "text-emerald-400" : l.includes("notice") ? "text-amber-400" : "text-fog-400")}>
                    {l}
                  </div>
                ))}
                {!done && <div className="text-sky-400 blink">▌</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Completion */}
        <div
          className={cn(
            "mt-5 flex flex-col items-center gap-3 rounded-md border p-6 text-center transition-all duration-500 sm:flex-row sm:justify-between sm:text-left",
            done ? "fade-up border-sky-500/40 bg-sky-500/6" : "border-line-soft bg-ink-850/50 opacity-50",
          )}
        >
          <div>
            <h3 className="text-[16px] font-semibold text-fog-100">
              {done ? "NWIS Knowledge Repository Ready" : "Extracting historical knowledge…"}
            </h3>
            <p className="mt-1 max-w-2xl text-[12px] text-fog-400">
              {done
                ? `${allHistoricalWells.length} well(s) indexed, ${historicalEvents.length} historical incident(s) correlated, ${analytics.riskZones.length} risk zone(s) identified.`
                : "Historical files are being parsed and correlated."}
            </p>
          </div>
          <Button variant="primary" size="lg" disabled={!done} onClick={onDone} className="shrink-0">
            Enter Drilling Command Center →
          </Button>
        </div>
      </div>
    </div>
  );
}
