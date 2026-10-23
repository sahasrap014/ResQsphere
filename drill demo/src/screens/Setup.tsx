import { useRef, useState } from "react";
import { Badge, Button, Field, Input, Panel, Select, Textarea } from "../components/ui";
import { cn } from "../utils/cn";
import { useActiveWell } from "../state/ActiveWellContext";

const KIND_BY_EXT: Record<string, string> = {
  zip: "ZIP Archive Bundle",
  pdf: "PDF Report",
  csv: "CSV Dataset",
  xlsx: "Spreadsheet",
  xls: "Spreadsheet",
  doc: "Document",
  docx: "Document",
  txt: "Text Log",
};

export default function Setup({ onStart }: { onStart: () => void }) {
  const { activeWell, updateActiveWell, documents, uploadFiles, isProcessing } = useActiveWell();

  // Active well inputs start completely empty unless user previously entered something
  const [well, setWell] = useState(activeWell);
  const [latInput, setLatInput] = useState(
    activeWell.lat !== null && Number.isFinite(activeWell.lat) ? String(activeWell.lat) : "",
  );
  const [lonInput, setLonInput] = useState(
    activeWell.lon !== null && Number.isFinite(activeWell.lon) ? String(activeWell.lon) : "",
  );
  const [tdInput, setTdInput] = useState(
    activeWell.plannedTd !== null && Number.isFinite(activeWell.plannedTd) ? String(activeWell.plannedTd) : "",
  );
  const [shoeInput, setShoeInput] = useState(
    activeWell.casingShoe !== null && Number.isFinite(activeWell.casingShoe) ? String(activeWell.casingShoe) : "",
  );

  const [drag, setDrag] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setUploadMessage("Extracting and indexing historical records…");
    const result = await uploadFiles(list);
    setUploadMessage(
      `Extracted ${result.files} document(s), ${result.wells} well record(s), and ${result.events} historical incident(s).`,
    );
  };

  const update = <K extends keyof typeof well>(key: K, value: typeof well[K]) =>
    setWell((current) => ({ ...current, [key]: value }));

  const startAnalysis = () => {
    const lat = latInput.trim() ? parseFloat(latInput) : null;
    const lon = lonInput.trim() ? parseFloat(lonInput) : null;
    const plannedTd = tdInput.trim() ? parseFloat(tdInput) : null;
    const casingShoe = shoeInput.trim() ? parseFloat(shoeInput) : null;

    updateActiveWell({
      ...well,
      lat: lat !== null && Number.isFinite(lat) ? lat : null,
      lon: lon !== null && Number.isFinite(lon) ? lon : null,
      plannedTd: plannedTd !== null && Number.isFinite(plannedTd) ? plannedTd : null,
      casingShoe: casingShoe !== null && Number.isFinite(casingShoe) ? casingShoe : null,
    });
    onStart();
  };

  return (
    <div className="tech-grid min-h-screen bg-ink-950">
      <div className="scanline min-h-screen">
        {/* top bar */}
        <header className="flex h-[52px] items-center justify-between border-b border-line-soft bg-ink-900/70 px-5 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[3px] border border-sky-500/50 bg-sky-500/10">
              <svg viewBox="0 0 20 20" className="h-4 w-4 text-sky-400">
                <path d="M10 1v18M4 6l6-4 6 4M4 6v8l6 4 6-4V6" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
            <div>
              <div className="text-[13px] leading-none font-bold tracking-[0.18em] text-fog-100">NWIS</div>
              <div className="mt-0.5 text-[8.5px] tracking-[0.14em] text-fog-500 uppercase">
                Nearby Wells Intelligence System
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="accent" dot>
              eRTMAC stream ready
            </Badge>
            <span className="hidden font-mono text-[10px] text-fog-500 md:inline">v2.5.0 · Historical Data Grounded</span>
          </div>
        </header>

        {/* stepper */}
        <div className="mx-auto max-w-[1400px] px-5 pt-6">
          <Stepper active={0} />
        </div>

        <div className="mx-auto max-w-[1400px] px-5 py-6">
          <div className="mb-6">
            <h1 className="text-[26px] font-semibold tracking-tight text-fog-100">Enter Active Well & Upload Historical Data</h1>
            <p className="mt-1 text-[12px] text-fog-400">
              Enter your active or planned well parameters. Upload historical reports or a ZIP archive to drive offset intelligence and analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* LEFT — active well form */}
            <div className="space-y-4">
              <Panel
                title="Active / Planned Well"
                subtitle="All fields start empty — enter the well being drilled or planned"
                right={<Badge tone="accent">User Input</Badge>}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Well ID / Name" required className="col-span-2 sm:col-span-1">
                    <Input
                      placeholder="e.g. WELL-01"
                      value={well.id}
                      onChange={(e) => update("id", e.target.value)}
                    />
                  </Field>
                  <Field label="Field / Block" className="col-span-2 sm:col-span-1">
                    <Input
                      placeholder="e.g. Field Alpha — Block 4"
                      value={`${well.field}${well.block ? ` — ${well.block}` : ""}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(" — ");
                        setWell((current) => ({
                          ...current,
                          field: parts[0] || "",
                          block: parts.slice(1).join(" — ") || "",
                        }));
                      }}
                    />
                  </Field>
                  <Field label="Latitude" hint="Decimal degrees, e.g. 27.3782">
                    <Input
                      placeholder="e.g. 27.3782"
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                    />
                  </Field>
                  <Field label="Longitude" hint="Decimal degrees, e.g. 95.3164">
                    <Input
                      placeholder="e.g. 95.3164"
                      value={lonInput}
                      onChange={(e) => setLonInput(e.target.value)}
                    />
                  </Field>
                  <Field label="Well Type">
                    <Select value={well.type} onChange={(e) => update("type", e.target.value)}>
                      <option>Development</option>
                      <option>Exploration</option>
                      <option>Appraisal</option>
                    </Select>
                  </Field>
                  <Field label="Planned Trajectory">
                    <Select value={well.trajectory} onChange={(e) => update("trajectory", e.target.value)}>
                      <option>Vertical</option>
                      <option>Directional</option>
                      <option>Horizontal</option>
                    </Select>
                  </Field>
                  <Field label="Planned Total Depth" hint="metres MD">
                    <Input
                      placeholder="e.g. 3700"
                      value={tdInput}
                      onChange={(e) => setTdInput(e.target.value)}
                    />
                  </Field>
                  <Field label="Drilling Start Date">
                    <Input
                      type="date"
                      value={well.spud}
                      onChange={(e) => update("spud", e.target.value)}
                    />
                  </Field>
                  <Field label="Target Formation / Reservoir" className="col-span-2">
                    <Input
                      placeholder="e.g. Main Sandstone Pay"
                      value={well.target}
                      onChange={(e) => update("target", e.target.value)}
                    />
                  </Field>
                  <Field label="Rig">
                    <Input
                      placeholder="e.g. RIG-05"
                      value={well.rig}
                      onChange={(e) => update("rig", e.target.value)}
                    />
                  </Field>
                  <Field label="Last Casing Shoe" hint="metres MD">
                    <Input
                      placeholder="e.g. 2900"
                      value={shoeInput}
                      onChange={(e) => setShoeInput(e.target.value)}
                    />
                  </Field>
                </div>
              </Panel>

              <Panel title="Geological / Reservoir Information" subtitle="Optional context for active well">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expected Pore Pressure">
                    <Input
                      placeholder="e.g. 1.15 SG EMW"
                      value={well.expectedPorePressure}
                      onChange={(e) => update("expectedPorePressure", e.target.value)}
                    />
                  </Field>
                  <Field label="Fracture Gradient">
                    <Input
                      placeholder="e.g. 1.50 SG EMW"
                      value={well.fractureGradient}
                      onChange={(e) => update("fractureGradient", e.target.value)}
                    />
                  </Field>
                  <Field label="Expected Formations" className="col-span-2">
                    <Input
                      placeholder="e.g. Upper Sand · Intermediate Shale · Main Pay"
                      value={well.expectedFormations}
                      onChange={(e) => update("expectedFormations", e.target.value)}
                    />
                  </Field>
                  <Field label="Additional Notes" className="col-span-2">
                    <Textarea
                      rows={3}
                      placeholder="Any specific drilling hazards, offset depletion notes, or operational objectives"
                      value={well.notes}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </Field>
                </div>
              </Panel>

              <Panel
                title="Current Drilling Parameters"
                subtitle="Optional — enter current rig floor values or leave blank"
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["depth", "Bit Depth", "m"],
                    ["rop", "ROP", "m/hr"],
                    ["wob", "WOB", "kN"],
                    ["rpm", "RPM", "rpm"],
                    ["torque", "Torque", "kN·m"],
                    ["spp", "SPP", "bar"],
                    ["flow", "Mud Flow", "lpm"],
                    ["mw", "Mud Weight", "SG"],
                  ].map(([key, label, unit]) => (
                    <Field key={key} label={`${label} (${unit})`}>
                      <Input
                        placeholder="—"
                        value={well.liveParameters[key] !== undefined ? String(well.liveParameters[key]) : ""}
                        onChange={(e) => {
                          const val = e.target.value.trim() ? parseFloat(e.target.value) : undefined;
                          setWell((current) => {
                            const nextParams = { ...current.liveParameters };
                            if (val !== undefined && Number.isFinite(val)) {
                              nextParams[key] = val;
                            } else {
                              delete nextParams[key];
                            }
                            return { ...current, liveParameters: nextParams };
                          });
                        }}
                      />
                    </Field>
                  ))}
                </div>
              </Panel>
            </div>

            {/* RIGHT — upload historical data */}
            <div className="space-y-4">
              <Panel
                title="Upload Historical Data"
                subtitle="Upload ZIP archives or individual historical reports (PDF, CSV, XLSX, TXT)"
                right={<Badge tone={documents.length ? "accent" : "neutral"}>{documents.length} document(s)</Badge>}
              >
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    "tech-grid-fine relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed py-10 transition-colors",
                    drag ? "border-sky-400 bg-sky-500/8" : "border-line hover:border-sky-500/50 hover:bg-ink-800/40",
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".zip,.pdf,.csv,.xlsx,.xls,.txt,.doc,.docx"
                    hidden
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <svg viewBox="0 0 40 40" className="h-9 w-9 text-sky-500/70">
                    <path
                      d="M20 27V9m0 0-6 6m6-6 6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 25v5a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2v-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <div className="text-[13px] font-medium text-fog-200">
                      Drop historical ZIP archive or files here
                    </div>
                    <div className="my-1 text-[10px] tracking-widest text-fog-500 uppercase">or</div>
                    <span className="inline-flex h-8 items-center rounded-sm border border-sky-500/50 bg-sky-500/10 px-3 text-[11.5px] font-medium text-sky-300">
                      + Select ZIP or Documents
                    </span>
                  </div>
                  <p className="max-w-md px-4 text-center text-[10.5px] leading-relaxed text-fog-500">
                    ZIP files containing well reports, completion reports, daily drilling reports (DDR), mud logs,
                    geological surveys, coordinates, and NPT records are unpacked and processed directly.
                  </p>
                </div>

                {uploadMessage && (
                  <div className="mt-2.5 rounded-sm border border-sky-500/30 bg-sky-500/8 px-3 py-2 text-[11.5px] text-sky-300">
                    {uploadMessage}
                  </div>
                )}

                {/* Extracted file register */}
                <div className="mt-3 overflow-hidden rounded-sm border border-line-soft">
                  <div className="max-h-[286px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-ink-800">
                        <tr className="text-[9px] tracking-[0.14em] text-fog-500 uppercase">
                          <th className="px-2.5 py-2 font-medium">File Name</th>
                          <th className="hidden px-2 py-2 font-medium sm:table-cell">Type</th>
                          <th className="px-2 py-2 font-medium">Size</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                          <th className="px-2 py-2 text-center font-medium">Wells</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((f, i) => (
                          <tr key={`${f.name}-${i}`} className="border-t border-line-soft/70 text-[11.5px] hover:bg-ink-800/50">
                            <td className="max-w-[200px] truncate px-2.5 py-1.5 text-fog-200">{f.name}</td>
                            <td className="hidden px-2 py-1.5 text-fog-500 sm:table-cell">
                              {f.kind || KIND_BY_EXT[f.name.split(".").pop()?.toLowerCase() ?? ""] || "Report"}
                            </td>
                            <td className="px-2 py-1.5 font-mono text-[10.5px] text-fog-400">{f.size}</td>
                            <td className="px-2 py-1.5">
                              <span className="font-mono text-[10px] text-emerald-400">✓ {f.status}</span>
                            </td>
                            <td className="px-2 py-1.5 text-center font-mono text-[10.5px] text-fog-300">
                              {f.wells || "—"}
                            </td>
                          </tr>
                        ))}
                        {!documents.length && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-[11.5px] text-fog-500">
                              No historical files uploaded yet. Upload a ZIP or reports to drive analytics.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-line-soft bg-ink-900/60 px-2.5 py-1.5">
                    <span className="font-mono text-[10px] text-fog-500">
                      {documents.length} historical file(s) ingested
                    </span>
                    <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                      + Add files
                    </Button>
                  </div>
                </div>
              </Panel>

              {/* Action bar */}
              <div className="flex flex-col items-stretch gap-3 rounded-md border border-line-soft bg-ink-850/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[12.5px] font-medium text-fog-200">
                    Ready to build the knowledge repository
                  </div>
                  <p className="mt-0.5 text-[11px] text-fog-500">
                    Analytics will be computed exclusively from uploaded historical records.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={startAnalysis}
                  disabled={isProcessing}
                  className="shrink-0"
                >
                  Start NWIS Analysis →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Stepper({ active }: { active: number }) {
  const steps = ["Project Setup", "Data Ingestion", "Processing", "Configuration", "Command Center"];
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px]",
              i < active
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                : i === active
                  ? "border-sky-400 bg-sky-500/15 text-sky-300"
                  : "border-line text-fog-500",
            )}
          >
            {i < active ? "✓" : i + 1}
          </span>
          <span
            className={cn(
              "text-[10.5px] tracking-wider uppercase",
              i === active ? "text-sky-300" : i < active ? "text-fog-300" : "text-fog-500",
            )}
          >
            {s}
          </span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}
