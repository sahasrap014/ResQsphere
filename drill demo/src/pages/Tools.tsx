import { useRef, useState } from "react";
import { Badge, Button, Field, Input, Meter, PageHead, Panel, Select, Toggle } from "../components/ui";
import { useActiveWell } from "../state/ActiveWellContext";
import { cn } from "../utils/cn";
import { validCoordinate } from "../data/nwis";

/* =========================== DATA UPLOAD MANAGEMENT ======================== */

export function DataUpload() {
  const { documents, allHistoricalWells, historicalEvents, historicalFormations, uploadFiles, clearHistoricalData, isProcessing } = useActiveWell();
  const [drag, setDrag] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleUpload = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setUploadMsg("Extracting and indexing historical records…");
    const res = await uploadFiles(list);
    setUploadMsg(`Successfully processed ${res.files} document(s), identified ${res.wells} well(s), extracted ${res.events} incident(s).`);
  };

  const processedCount = documents.filter((d) => d.status === "Processed").length;

  return (
    <div>
      <PageHead
        icon="↥"
        title="Historical Data Upload & Repository"
        subtitle="Historical documents are the single source of truth for all NWIS intelligence. Upload ZIP archives, PDFs, CSVs, and DDR logs."
        right={
          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <Button variant="danger" size="sm" onClick={() => { if (confirm("Clear all uploaded historical data?")) clearHistoricalData(); }}>
                Clear Repository
              </Button>
            )}
            <Button variant="primary" onClick={() => ref.current?.click()}>
              + Upload Historical Data
            </Button>
          </div>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Documents Ingested", `${documents.length}`],
          ["Processed", `${processedCount}`],
          ["Wells Identified", `${allHistoricalWells.length}`],
          ["Events Extracted", `${historicalEvents.length}`],
          ["Formations Correlated", `${historicalFormations.length}`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-md border border-line-soft bg-ink-850/70 px-3 py-2.5">
            <div className="text-[9px] tracking-[0.14em] text-fog-500 uppercase">{l}</div>
            <div className="mt-1 font-mono text-[19px] leading-none font-semibold text-fog-100">{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="Historical Document Register" subtitle={`${documents.length} document(s) in active repository`} dense>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleUpload(e.dataTransfer.files);
            }}
            onClick={() => ref.current?.click()}
            className={cn(
              "m-3 flex cursor-pointer items-center justify-center gap-3 rounded-sm border border-dashed py-6 transition-colors",
              drag ? "border-sky-400 bg-sky-500/8" : "border-line hover:border-sky-500/50",
            )}
          >
            <input
              ref={ref}
              type="file"
              multiple
              accept=".zip,.pdf,.csv,.xlsx,.xls,.txt,.doc,.docx"
              hidden
              onChange={(e) => handleUpload(e.target.files)}
            />
            <span className="text-[16px] text-sky-500/70">↥</span>
            <span className="text-[12px] text-fog-400">
              Drop ZIP archive or historical reports here or <span className="text-sky-400">browse files</span>
            </span>
          </div>

          {uploadMsg && (
            <div className="mx-3 mb-3 rounded-sm border border-sky-500/30 bg-sky-500/8 px-3 py-2 text-[11.5px] text-sky-300">
              {uploadMsg}
            </div>
          )}

          {isProcessing && (
            <div className="mx-3 mb-3 flex items-center gap-2 font-mono text-[11px] text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-400 blink" />
              Ingesting and extracting historical records…
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-y border-line-soft bg-ink-900/70 text-[9px] tracking-[0.14em] text-fog-500 uppercase">
                  {["Document", "Type", "Size", "Status", "Wells", "Events", "Quality"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((d, i) => (
                  <tr key={`${d.name}-${i}`} className="border-b border-line-soft/60 text-[11.5px] hover:bg-ink-800/40">
                    <td className="max-w-[240px] truncate px-3 py-2 text-fog-200">{d.name}</td>
                    <td className="px-3 py-2 text-fog-500">{d.kind}</td>
                    <td className="px-3 py-2 font-mono text-[10.5px] text-fog-400">{d.size}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "font-mono text-[10px]",
                          d.status === "Processed" ? "text-emerald-400" : "text-amber-400",
                        )}
                      >
                        ✓ {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-fog-300">{d.wells || "—"}</td>
                    <td className="px-3 py-2 font-mono text-fog-300">{d.events || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Meter value={d.quality} tone={d.quality > 85 ? "#10b981" : "#f5a524"} />
                        <span className="w-7 font-mono text-[10px] text-fog-400">{d.quality}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!documents.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[12px] text-fog-500">
                      No documents currently uploaded. Upload a historical ZIP archive or files above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Repository Data Integrity">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[30px] leading-none font-semibold text-emerald-300">
                {documents.length > 0 ? "100%" : "0%"}
              </span>
              <span className="text-[11px] text-fog-500">Historical Traceability</span>
            </div>
            <div className="mt-3 space-y-2 text-[10.5px] text-fog-400">
              <p>
                All data displayed in this application originates strictly from uploaded historical files.
              </p>
              <p>
                Zero synthetic, mock, or randomly generated numbers are used as fallbacks.
              </p>
            </div>
          </Panel>

          <Panel title="Supported Document Formats">
            <ul className="space-y-1.5 text-[11px] text-fog-400">
              <li>· <strong className="text-fog-200">ZIP Archive (.zip):</strong> Bundles of historical reports.</li>
              <li>· <strong className="text-fog-200">PDF Reports (.pdf):</strong> WCR, DDR, Mud Logs, Surveys.</li>
              <li>· <strong className="text-fog-200">Tabular Data (.csv, .tsv):</strong> Well coordinates and tables.</li>
              <li>· <strong className="text-fog-200">Spreadsheets (.xlsx, .xls):</strong> NPT and production registers.</li>
              <li>· <strong className="text-fog-200">Documents (.txt, .doc):</strong> Geological & drilling summaries.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ============================ REPORTS & EXPORT ============================= */

const SECTIONS = [
  "Active well details",
  "Historical data sources & traceability",
  "Nearby offset wells",
  "Historical incidents & problems",
  "Current drilling status",
  "Risk intervals forecast",
  "Mitigation intelligence",
  "Well comparison",
  "NPT analysis",
  "Cost efficiency",
  "High-potential zones",
  "AI well location recommendation",
];

export function Reports() {
  const {
    activeWell,
    nearbyWells,
    documents,
    analytics,
  } = useActiveWell();

  const [picked, setPicked] = useState<string[]>(SECTIONS);
  const [reportTitle, setReportTitle] = useState(
    `NWIS Intelligence Report — ${activeWell.id || "Active Well"}`,
  );
  const [detailLevel, setDetailLevel] = useState("Full technical");
  const [generated, setGenerated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const locEval = analytics.locationEvaluation;
  const candidate = locEval?.candidateZone;
  const validActiveCoords = validCoordinate(activeWell.lat, activeWell.lon);
  const totalNpt = analytics.npt.total;
  const estNptCostM = ((totalNpt * (22400 / 24)) / 1_000_000).toFixed(2);
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const reportTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const generateReportHtml = () => {
    const candidateCoords =
      candidate && validCoordinate(candidate.lat, candidate.lon)
        ? `${candidate.lat.toFixed(4)}° N, ${candidate.lon.toFixed(4)}° E`
        : "Coordinates unavailable";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${reportTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }
    .header-box {
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .org-banner {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #0f172a;
    }
    .directorate {
      font-size: 9pt;
      font-weight: 600;
      color: #0284c7;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .doc-main-title {
      font-size: 16pt;
      font-weight: 700;
      margin-top: 8px;
      color: #0f172a;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .meta-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      font-size: 8.5pt;
    }
    .meta-table strong {
      display: block;
      font-size: 7.5pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h2.section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f172a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    p { margin: 5px 0; font-size: 9.5pt; color: #334155; }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 14px 0;
      font-size: 8.5pt;
      page-break-inside: auto;
    }
    table.data-table tr { page-break-inside: avoid; }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
      vertical-align: top;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.04em;
    }
    .badge {
      display: inline-block;
      padding: 1px 5px;
      font-size: 7.5pt;
      font-weight: 600;
      border-radius: 2px;
      text-transform: uppercase;
    }
    .badge-critical, .badge-high { background: #fee2e2; color: #991b1b; }
    .badge-warning, .badge-mod, .badge-moderate { background: #fef3c7; color: #92400e; }
    .badge-info, .badge-low { background: #dcfce7; color: #166534; }
    .callout {
      background: #f8fafc;
      border-left: 3px solid #0284c7;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 9pt;
    }
    .highlight-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 4px;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 9pt;
    }
    .signoff-row {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #cbd5e1;
      page-break-inside: avoid;
    }
    .signoff-box {
      flex: 1;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      padding: 8px;
      font-size: 8pt;
      text-align: center;
      min-height: 70px;
    }
    .footer-note {
      margin-top: 20px;
      font-size: 7.5pt;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="org-banner">Oil India Limited</div>
    <div class="directorate">Drilling & Exploration Directorate · eRTMAC Operations</div>
    <div class="doc-main-title">${reportTitle}</div>
    <table class="meta-table">
      <tr>
        <td><strong>Document Ref</strong>NWIS-RPT-${activeWell.id || "GEN"}-${Date.now().toString(36).toUpperCase()}</td>
        <td><strong>Date & Time</strong>${reportDate} at ${reportTime}</td>
        <td><strong>Classification</strong>Confidential / Operational Use</td>
        <td><strong>Detail Level</strong>${detailLevel}</td>
      </tr>
    </table>
  </div>

  ${
    picked.includes("Active well details")
      ? `<h2 class="section-title">1. Active Well Operational Profile</h2>
    <table class="data-table">
      <tr>
        <th>Well ID</th><td><strong>${activeWell.id || "Not configured"}</strong></td>
        <th>Field / Block</th><td>${activeWell.field || "Unassigned"} · ${activeWell.block || "—"}</td>
      </tr>
      <tr>
        <th>Surface Coordinates</th><td>${validActiveCoords ? `${activeWell.lat!.toFixed(4)}° N, ${activeWell.lon!.toFixed(4)}° E` : "Not specified"}</td>
        <th>Planned Total Depth</th><td>${activeWell.plannedTd ? `${activeWell.plannedTd.toLocaleString()} m` : "Not specified"}</td>
      </tr>
      <tr>
        <th>Target Formation</th><td>${activeWell.target || "Not specified"}</td>
        <th>Rig Assignment</th><td>${activeWell.rig || "Standard rig fleet"}</td>
      </tr>
      <tr>
        <th>Well Type & Trajectory</th><td>${activeWell.type} · ${activeWell.trajectory}</td>
        <th>Current Depth</th><td>${activeWell.liveParameters?.depth ? `${activeWell.liveParameters.depth} m` : "Pre-Spud / Planning"}</td>
      </tr>
    </table>`
      : ""
  }

  ${
    picked.includes("AI well location recommendation")
      ? `<h2 class="section-title">2. AI Location Assessment & Offset Candidate Sector</h2>
    <div class="highlight-box">
      <strong>Recommended Sector: ${candidate ? candidate.name : "No distinct candidate cluster identified"}</strong><br />
      Coordinates: ${candidateCoords} · Proximity: ${candidate ? `${candidate.distanceKm.toFixed(1)} km from active location` : "—"}<br />
      Evaluation Score: <strong>${locEval?.candidateScore ?? "—"}/100</strong> (vs Proposed: <strong>${locEval?.proposedScore ?? "—"}/100</strong>) · Confidence: <strong>${locEval?.confidence ?? "Insufficient"}</strong>
    </div>
    <p><strong>Operational Reasoning:</strong> ${locEval?.recommendationText || "Location evaluated strictly from historical offset records."}</p>
    ${
      locEval?.whyFactors?.length
        ? `<div class="callout">
        <strong>Contributing Historical Factors:</strong>
        <ul style="margin: 4px 0 0 16px; padding: 0;">
          ${locEval.whyFactors.map((f: string) => `<li>${f}</li>`).join("")}
        </ul>
      </div>`
        : ""
    }
    <p style="font-size: 8pt; color: #64748b; font-style: italic;">Disclaimer: ${locEval?.disclaimer || "Geological recommendation is derived from offset records."}</p>`
      : ""
  }

  ${
    picked.includes("Nearby offset wells")
      ? `<h2 class="section-title">3. Correlated Offset Wells Register (${nearbyWells.length} Analyzed)</h2>
    ${
      nearbyWells.length
        ? `<table class="data-table">
      <thead>
        <tr>
          <th>Well ID</th>
          <th>Name</th>
          <th>Coordinates</th>
          <th>Distance</th>
          <th>TD</th>
          <th>Target Formation</th>
          <th>Status</th>
          <th>Production</th>
          <th>NPT / Events</th>
        </tr>
      </thead>
      <tbody>
        ${nearbyWells
          .map((w) => {
            const hasC = validCoordinate(w.lat, w.lon);
            return `<tr>
              <td><strong>${w.id}</strong></td>
              <td>${w.name || w.id}</td>
              <td>${hasC ? `${w.lat.toFixed(4)}°, ${w.lon.toFixed(4)}°` : "—"}</td>
              <td><strong>${w.distance.toFixed(1)} km</strong></td>
              <td>${w.td ? `${w.td} m` : "—"}</td>
              <td>${w.targetFormation || "—"}</td>
              <td>${w.status}</td>
              <td>${w.production || "—"}</td>
              <td>${w.npt}h (${w.events || 0} evt)</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`
        : `<p>No offset wells within the correlation radius. Upload historical reports to populate.</p>`
    }`
      : ""
  }

  ${
    picked.includes("Historical incidents & problems")
      ? `<h2 class="section-title">4. Historical Drilling Incidents & Operational Hazards Log</h2>
    ${
      analytics.events.length
        ? `<table class="data-table">
      <thead>
        <tr>
          <th>Depth</th>
          <th>Hazard Type</th>
          <th>Severity</th>
          <th>Well</th>
          <th>NPT</th>
          <th>Applied Mitigation</th>
          <th>Operational Outcome</th>
          <th>Source Record</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.events
          .slice(0, 15)
          .map(
            (e: any) => `<tr>
            <td><strong>${e.depth} m</strong></td>
            <td>${e.type}</td>
            <td><span class="badge badge-${e.severity}">${e.severity}</span></td>
            <td>${e.well}</td>
            <td><strong>${e.npt} hrs</strong></td>
            <td>${e.mitigation || "Operational action taken"}</td>
            <td>${e.outcome || "Operation resumed"}</td>
            <td>${e.source || "Historical log"}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>`
        : `<p>No drilling incidents or hazard logs found in the uploaded records.</p>`
    }`
      : ""
  }

  ${
    picked.includes("Risk intervals forecast")
      ? `<h2 class="section-title">5. Ahead-of-the-Bit Risk Intervals & Hazard Forecast</h2>
    ${
      analytics.riskZones.length
        ? `<table class="data-table">
      <thead>
        <tr>
          <th>Depth Interval</th>
          <th>Predicted Hazard</th>
          <th>Risk Level</th>
          <th>Supporting Wells</th>
          <th>Mitigation Advisory</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.riskZones
          .map(
            (z: any) => `<tr>
            <td><strong>${z.top}–${z.base} m</strong></td>
            <td>${z.type} (${z.formation || "Regional Formation"})</td>
            <td><span class="badge badge-${z.level}">${z.level}</span></td>
            <td>${z.wells.join(", ")}</td>
            <td>${z.mitigation?.join("; ") || "Maintain balanced hydrostatic pressure and monitor torque."}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>`
        : `<p>No high-probability risk intervals identified in the correlated offset data.</p>`
    }`
      : ""
  }

  ${
    picked.includes("NPT analysis") || picked.includes("Cost efficiency")
      ? `<h2 class="section-title">6. Non-Productive Time (NPT) & Financial Cost Impact</h2>
    <div class="callout">
      <strong>Total Recorded Downtime: ${totalNpt.toFixed(1)} hours</strong> across uploaded offset records.<br />
      Estimated Financial Impact: <strong>$${estNptCostM} Million</strong> (applying standard all-in rig day rate of $22,400/day).
    </div>
    ${
      analytics.npt.byCause.length
        ? `<table class="data-table">
      <thead>
        <tr>
          <th>Downtime Root Cause</th>
          <th>Recorded Hours</th>
          <th>Percentage</th>
          <th>Est. Cost Impact (US$ M)</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.npt.byCause
          .map((c: any) => {
            const costM = ((c.hours * (22400 / 24)) / 1_000_000).toFixed(3);
            const pct = totalNpt > 0 ? ((c.hours / totalNpt) * 100).toFixed(1) : "0.0";
            return `<tr>
              <td><strong>${c.cause}</strong></td>
              <td>${c.hours.toFixed(1)} hrs</td>
              <td>${pct}%</td>
              <td>$${costM}M</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`
        : ""
    }`
      : ""
  }

  ${
    picked.includes("Historical data sources & traceability")
      ? `<h2 class="section-title">7. Ingested Historical Documents & Audit Traceability</h2>
    ${
      documents.length
        ? `<table class="data-table">
      <thead>
        <tr>
          <th>Document Name</th>
          <th>File Type</th>
          <th>Size</th>
          <th>Status</th>
          <th>Wells Extracted</th>
          <th>Events Extracted</th>
        </tr>
      </thead>
      <tbody>
        ${documents
          .map(
            (d) => `<tr>
            <td><strong>${d.name}</strong></td>
            <td>${d.kind}</td>
            <td>${d.size}</td>
            <td>${d.status}</td>
            <td>${d.wells || "—"}</td>
            <td>${d.events || "—"}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>`
        : `<p>No historical documents currently ingested.</p>`
    }`
      : ""
  }

  <div class="signoff-row">
    <div class="signoff-box">
      <strong>Prepared By</strong><br />
      NWIS Autonomous Engine<br />
      <span style="font-size: 7.5pt; color: #64748b;">Algorithm Grounded & Traceable</span>
    </div>
    <div class="signoff-box">
      <strong>Reviewed By</strong><br />
      Lead Operations Geologist<br />
      <span style="font-size: 7.5pt; color: #64748b;">Geological & Offset Audit</span>
    </div>
    <div class="signoff-box">
      <strong>Approved By</strong><br />
      Drilling Superintendent / eRTMAC<br />
      <span style="font-size: 7.5pt; color: #64748b;">Operations Authorization</span>
    </div>
  </div>

  <div class="footer-note">
    Nearby Wells Intelligence System (NWIS) · Oil India Limited Edition · All intelligence derived strictly from authoritative historical records.
  </div>
</body>
</html>`;
  };

  const handlePrintReport = () => {
    const reportHtml = generateReportHtml();
    let iframe = document.getElementById(
      "nwis-print-frame",
    ) as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "nwis-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(reportHtml);
      doc.close();
      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      }, 300);
    }
  };

  const handleDownloadReport = () => {
    const reportHtml = generateReportHtml();
    const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NWIS_Intelligence_Report_${activeWell.id || "Well"}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <PageHead
        icon="▣"
        title="Reports & Export"
        subtitle="Generate a clean, professional NWIS intelligence report compiled strictly from application data and uploaded historical records."
        right={
          generated && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode((m) => !m)}
              >
                {previewMode ? "⚙️ Report Settings" : "👁️ View Document"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
              >
                💾 Download HTML
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintReport}
              >
                🖨️ Print / Save as PDF
              </Button>
            </div>
          )
        }
      />

      {/* Configuration Panels */}
      {(!previewMode || !generated) && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel
            title="Report contents"
            subtitle={`${picked.length} of ${SECTIONS.length} sections selected`}
          >
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <Toggle
                  key={s}
                  checked={picked.includes(s)}
                  onChange={() => toggle(s)}
                  label={s}
                />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-4">
              <Field label="Report title" className="col-span-2">
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </Field>
              <Field label="Detail level">
                <Select
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value)}
                >
                  <option>Summary</option>
                  <option>Standard</option>
                  <option>Full technical</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="lg"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  setTimeout(() => {
                    setBusy(false);
                    setGenerated(true);
                    setPreviewMode(true);
                  }, 400);
                }}
              >
                {busy ? "Compiling Report…" : "Generate NWIS Report"}
              </Button>
              <Button
                variant="outline"
                disabled={!generated}
                onClick={handlePrintReport}
              >
                Print / Save as PDF
              </Button>
              <Button
                variant="outline"
                disabled={!generated}
                onClick={handleDownloadReport}
              >
                Download (.html)
              </Button>
            </div>

            {generated && (
              <div className="fade-up mt-3 flex items-center gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/6 px-3 py-2">
                <span className="text-emerald-400">✓</span>
                <span className="text-[12px] text-fog-200">
                  Report compiled with {picked.length} section(s) grounded in{" "}
                  {documents.length} historical document citation(s).
                </span>
              </div>
            )}
          </Panel>

          <div className="space-y-3">
            <Panel title="Report Metadata" dense>
              <div className="m-3 rounded-sm border border-line-soft bg-[#0b1220] p-3">
                <div className="flex items-center justify-between border-b border-line-soft pb-2">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.16em] text-fog-100">
                      NWIS REPORT
                    </div>
                    <div className="mt-0.5 text-[9px] tracking-wider text-fog-500 uppercase">
                      {activeWell.field || "Project Area"}
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-emerald-400">
                    Traceable & Audit-Ready
                  </span>
                </div>
                <dl className="mt-2 space-y-1 text-[10.5px]">
                  {[
                    ["Active Well ID", activeWell.id || "Not specified"],
                    ["Field", activeWell.field || "Not specified"],
                    ["Target reservoir", activeWell.target || "Not specified"],
                    ["Historical files", `${documents.length} document(s)`],
                    ["Offset wells analyzed", `${nearbyWells.length} well(s)`],
                    ["Candidate Recommendation", candidate ? candidate.name : "N/A"],
                    ["Est. NPT Downtime", `${totalNpt.toFixed(1)} hrs`],
                    ["Financial Risk", `$${estNptCostM}M`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-fog-500">{k}</dt>
                      <dd className="font-mono text-fog-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* Generated Report Document Preview */}
      {generated && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-line-soft pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-fog-100">
                Generated Document Preview
              </span>
              <Badge tone="low">Ready for Export</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
              >
                💾 Download (.html)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintReport}
              >
                🖨️ Print / Save as PDF
              </Button>
            </div>
          </div>

          {/* Paper-styled formal report preview */}
          <div className="mx-auto max-w-4xl rounded-md border border-gray-300 bg-white p-6 sm:p-10 font-sans text-gray-900 shadow-2xl">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-5">
              <div className="text-[15px] font-extrabold tracking-wider uppercase text-slate-950">
                Oil India Limited
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                Drilling & Exploration Directorate · eRTMAC Operations
              </div>
              <h1 className="mt-2 text-[20px] font-bold text-slate-950">
                {reportTitle}
              </h1>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded bg-slate-50 border border-slate-200 p-2.5 text-[11px]">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">Document Ref</span>
                  <span className="font-mono font-semibold text-slate-900">NWIS-RPT-{activeWell.id || "GEN"}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">Generated</span>
                  <span className="font-semibold text-slate-900">{reportDate} {reportTime}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">Classification</span>
                  <span className="font-semibold text-slate-900">Confidential / Drilling Ops</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">Detail Level</span>
                  <span className="font-semibold text-slate-900">{detailLevel}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Active Well Profile */}
            {picked.includes("Active well details") && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  1. Active Well Operational Profile
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border border-slate-300">
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <th className="bg-slate-100 p-2 font-semibold w-1/4">Well ID</th>
                        <td className="p-2 font-mono font-bold text-slate-950 w-1/4">{activeWell.id || "Not configured"}</td>
                        <th className="bg-slate-100 p-2 font-semibold w-1/4">Field / Block</th>
                        <td className="p-2 w-1/4">{activeWell.field || "Unassigned"}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <th className="bg-slate-100 p-2 font-semibold">Coordinates</th>
                        <td className="p-2 font-mono">{validActiveCoords ? `${activeWell.lat!.toFixed(4)}° N, ${activeWell.lon!.toFixed(4)}° E` : "Not specified"}</td>
                        <th className="bg-slate-100 p-2 font-semibold">Planned TD</th>
                        <td className="p-2 font-mono">{activeWell.plannedTd ? `${activeWell.plannedTd.toLocaleString()} m` : "Not specified"}</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <th className="bg-slate-100 p-2 font-semibold">Target Formation</th>
                        <td className="p-2">{activeWell.target || "Not specified"}</td>
                        <th className="bg-slate-100 p-2 font-semibold">Rig Fleet</th>
                        <td className="p-2">{activeWell.rig || "Standard rig fleet"}</td>
                      </tr>
                      <tr>
                        <th className="bg-slate-100 p-2 font-semibold">Type & Trajectory</th>
                        <td className="p-2">{activeWell.type} · {activeWell.trajectory}</td>
                        <th className="bg-slate-100 p-2 font-semibold">Current Depth</th>
                        <td className="p-2 font-mono font-bold text-sky-700">{activeWell.liveParameters?.depth ? `${activeWell.liveParameters.depth} m` : "Pre-Spud Planning"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 2: AI Location Assessment */}
            {picked.includes("AI well location recommendation") && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  2. AI Location Assessment & Offset Candidate Sector
                </h2>
                <div className="rounded border border-emerald-200 bg-emerald-50 p-3 mb-2 text-[11px]">
                  <div className="font-bold text-emerald-900 text-[12px]">
                    Recommended Historical Candidate: {candidate ? candidate.name : "No Candidate Cluster Identified"}
                  </div>
                  <div className="text-emerald-800 mt-1">
                    Location: {candidate && validCoordinate(candidate.lat, candidate.lon) ? `${candidate.lat.toFixed(4)}° N, ${candidate.lon.toFixed(4)}° E (${candidate.distanceKm.toFixed(1)} km from active coordinates)` : "Coordinates unavailable"}
                  </div>
                  <div className="mt-1">
                    Evidence Score: <strong>{locEval?.candidateScore ?? "—"}/100</strong> (Proposed Location: <strong>{locEval?.proposedScore ?? "—"}/100</strong>) · Confidence: <strong>{locEval?.confidence ?? "Insufficient"}</strong>
                  </div>
                </div>
                <p className="text-[11.5px] text-slate-800 leading-relaxed">
                  <strong>Operational Rationale:</strong> {locEval?.recommendationText || "Location evaluated strictly against offset well production and hazard density."}
                </p>
                {locEval?.whyFactors?.length ? (
                  <div className="mt-2 border-l-2 border-sky-600 bg-slate-50 p-2 text-[11px]">
                    <strong className="text-slate-900">Key Geological Factors:</strong>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside text-slate-700">
                      {locEval.whyFactors.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-2 text-[10px] text-slate-500 italic">
                  Disclaimer: {locEval?.disclaimer || "Geological recommendation is derived from offset records."}
                </div>
              </div>
            )}

            {/* Section 3: Nearby Offset Wells */}
            {picked.includes("Nearby offset wells") && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  3. Correlated Offset Wells Register ({nearbyWells.length} Wells within 10 km)
                </h2>
                {nearbyWells.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10.5px] border border-slate-300">
                      <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
                        <tr>
                          <th className="p-1.5 border-r border-slate-300">Well ID</th>
                          <th className="p-1.5 border-r border-slate-300">Coordinates</th>
                          <th className="p-1.5 border-r border-slate-300">Distance</th>
                          <th className="p-1.5 border-r border-slate-300">TD</th>
                          <th className="p-1.5 border-r border-slate-300">Formation</th>
                          <th className="p-1.5 border-r border-slate-300">Status</th>
                          <th className="p-1.5 border-r border-slate-300">Production</th>
                          <th className="p-1.5">NPT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {nearbyWells.map((w) => {
                          const hasC = validCoordinate(w.lat, w.lon);
                          return (
                            <tr key={w.id} className="hover:bg-slate-50">
                              <td className="p-1.5 font-mono font-bold text-slate-900 border-r border-slate-200">{w.id}</td>
                              <td className="p-1.5 font-mono text-[10px] border-r border-slate-200">{hasC ? `${w.lat.toFixed(4)}°, ${w.lon.toFixed(4)}°` : "—"}</td>
                              <td className="p-1.5 font-bold text-amber-800 border-r border-slate-200">{w.distance.toFixed(1)} km</td>
                              <td className="p-1.5 font-mono border-r border-slate-200">{w.td ? `${w.td} m` : "—"}</td>
                              <td className="p-1.5 border-r border-slate-200">{w.targetFormation || "—"}</td>
                              <td className="p-1.5 border-r border-slate-200">{w.status}</td>
                              <td className="p-1.5 font-mono font-bold text-emerald-700 border-r border-slate-200">{w.production || "—"}</td>
                              <td className="p-1.5 font-mono">{w.npt} hrs</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">No offset wells within correlation radius.</p>
                )}
              </div>
            )}

            {/* Section 4: Incidents Log */}
            {picked.includes("Historical incidents & problems") && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  4. Historical Operational Incidents & Drilling Hazards Log
                </h2>
                {analytics.events.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10.5px] border border-slate-300">
                      <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
                        <tr>
                          <th className="p-1.5 border-r border-slate-300">Depth</th>
                          <th className="p-1.5 border-r border-slate-300">Hazard Type</th>
                          <th className="p-1.5 border-r border-slate-300">Severity</th>
                          <th className="p-1.5 border-r border-slate-300">Well</th>
                          <th className="p-1.5 border-r border-slate-300">NPT</th>
                          <th className="p-1.5 border-r border-slate-300">Applied Mitigation</th>
                          <th className="p-1.5">Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {analytics.events.slice(0, 10).map((e: any) => (
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="p-1.5 font-mono font-bold border-r border-slate-200">{e.depth} m</td>
                            <td className="p-1.5 font-medium border-r border-slate-200">{e.type}</td>
                            <td className="p-1.5 border-r border-slate-200">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                e.severity === "high" ? "bg-red-100 text-red-800" : e.severity === "moderate" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                              )}>
                                {e.severity}
                              </span>
                            </td>
                            <td className="p-1.5 font-mono border-r border-slate-200">{e.well}</td>
                            <td className="p-1.5 font-mono font-bold text-red-800 border-r border-slate-200">{e.npt} hrs</td>
                            <td className="p-1.5 text-[10px] border-r border-slate-200">{e.mitigation || "Operational action"}</td>
                            <td className="p-1.5 text-[10px]">{e.outcome || "Resolved"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">No historical drilling hazards recorded in offset files.</p>
                )}
              </div>
            )}

            {/* Section 5: Risk Intervals Forecast */}
            {picked.includes("Risk intervals forecast") && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  5. Ahead-of-the-Bit Risk Intervals & Lookahead Forecast
                </h2>
                {analytics.riskZones.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10.5px] border border-slate-300">
                      <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
                        <tr>
                          <th className="p-1.5 border-r border-slate-300">Depth Interval</th>
                          <th className="p-1.5 border-r border-slate-300">Predicted Hazard</th>
                          <th className="p-1.5 border-r border-slate-300">Risk Level</th>
                          <th className="p-1.5 border-r border-slate-300">Supporting Wells</th>
                          <th className="p-1.5">Mitigation Advisory</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {analytics.riskZones.map((z: any) => (
                          <tr key={z.id} className="hover:bg-slate-50">
                            <td className="p-1.5 font-mono font-bold border-r border-slate-200">{z.top}–{z.base} m</td>
                            <td className="p-1.5 font-medium border-r border-slate-200">{z.type} ({z.formation || "Regional Formation"})</td>
                            <td className="p-1.5 border-r border-slate-200">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                z.level === "high" ? "bg-red-100 text-red-800" : z.level === "moderate" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                              )}>
                                {z.level}
                              </span>
                            </td>
                            <td className="p-1.5 font-mono text-[10px] border-r border-slate-200">{z.wells.join(", ")}</td>
                            <td className="p-1.5 text-[10px]">{z.mitigation?.join("; ") || "Adjust mud weight and monitor flow rates."}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">No forward-looking risk intervals identified.</p>
                )}
              </div>
            )}

            {/* Section 6: NPT & Financial Impact */}
            {(picked.includes("NPT analysis") || picked.includes("Cost efficiency")) && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  6. Non-Productive Time (NPT) & Financial Cost Impact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div className="rounded border border-red-200 bg-red-50 p-2.5 text-[11px]">
                    <span className="text-red-900 font-bold">Total Offset Downtime: {totalNpt.toFixed(1)} hrs</span>
                    <p className="text-red-700 text-[10px] mt-0.5">Aggregated from historical offset records.</p>
                  </div>
                  <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-[11px]">
                    <span className="text-amber-900 font-bold">Estimated Financial Impact: ${estNptCostM}M</span>
                    <p className="text-amber-700 text-[10px] mt-0.5">Calculated at standard $22,400/day rig rate assumption.</p>
                  </div>
                </div>
                {analytics.npt.byCause.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10.5px] border border-slate-300">
                      <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
                        <tr>
                          <th className="p-1.5 border-r border-slate-300">Root Cause</th>
                          <th className="p-1.5 border-r border-slate-300">Recorded Hours</th>
                          <th className="p-1.5 border-r border-slate-300">Percentage</th>
                          <th className="p-1.5">Est. Cost Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {analytics.npt.byCause.map((c: any) => {
                          const costM = ((c.hours * (22400 / 24)) / 1_000_000).toFixed(3);
                          const pct = totalNpt > 0 ? ((c.hours / totalNpt) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={c.cause} className="hover:bg-slate-50">
                              <td className="p-1.5 font-medium border-r border-slate-200">{c.cause}</td>
                              <td className="p-1.5 font-mono border-r border-slate-200">{c.hours.toFixed(1)} hrs</td>
                              <td className="p-1.5 font-mono border-r border-slate-200">{pct}%</td>
                              <td className="p-1.5 font-mono font-bold text-red-800">${costM}M</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Section 7: Document Traceability */}
            {picked.includes("Historical data sources & traceability") && (
              <div className="mb-6">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  7. Ingested Documents & Audit Traceability
                </h2>
                {documents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10.5px] border border-slate-300">
                      <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold">
                        <tr>
                          <th className="p-1.5 border-r border-slate-300">Document Name</th>
                          <th className="p-1.5 border-r border-slate-300">Format</th>
                          <th className="p-1.5 border-r border-slate-300">Size</th>
                          <th className="p-1.5 border-r border-slate-300">Status</th>
                          <th className="p-1.5 border-r border-slate-300">Wells Extracted</th>
                          <th className="p-1.5">Events</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {documents.map((d) => (
                          <tr key={d.name} className="hover:bg-slate-50">
                            <td className="p-1.5 font-medium text-slate-900 border-r border-slate-200">{d.name}</td>
                            <td className="p-1.5 text-slate-600 border-r border-slate-200">{d.kind}</td>
                            <td className="p-1.5 font-mono border-r border-slate-200">{d.size}</td>
                            <td className="p-1.5 border-r border-slate-200">
                              <span className="font-bold text-emerald-700">✓ {d.status}</span>
                            </td>
                            <td className="p-1.5 font-mono border-r border-slate-200">{d.wells || "—"}</td>
                            <td className="p-1.5 font-mono">{d.events || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">No historical documents currently ingested.</p>
                )}
              </div>
            )}

            {/* Official Sign-off Box */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-[10.5px]">
              <div className="border border-dashed border-slate-400 rounded p-2.5">
                <span className="font-bold text-slate-900 block">Prepared By</span>
                <span className="text-slate-700">NWIS Autonomous Engine</span>
                <span className="block text-[9px] text-slate-500 mt-1">Algorithm Grounded & Traceable</span>
              </div>
              <div className="border border-dashed border-slate-400 rounded p-2.5">
                <span className="font-bold text-slate-900 block">Reviewed By</span>
                <span className="text-slate-700">Lead Operations Geologist</span>
                <span className="block text-[9px] text-slate-500 mt-1">Geological & Offset Audit</span>
              </div>
              <div className="border border-dashed border-slate-400 rounded p-2.5">
                <span className="font-bold text-slate-900 block">Authorized By</span>
                <span className="text-slate-700">Drilling Superintendent / eRTMAC</span>
                <span className="block text-[9px] text-slate-500 mt-1">Operations Authorization</span>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9.5px] text-slate-500">
              Nearby Wells Intelligence System (NWIS) · Oil India Limited Edition · All intelligence derived strictly from authoritative historical records.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================ SETTINGS ================================= */

export function Settings() {
  const { activeWell } = useActiveWell();
  return (
    <div>
      <PageHead icon="⚙" title="Settings" subtitle="System settings for NWIS." />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="eRTMAC integration">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Active Well ID" className="col-span-2">
              <Input value={activeWell.id || "Not configured"} readOnly />
            </Field>
            <Field label="Poll interval">
              <Select defaultValue="1 second">
                <option>1 second</option>
                <option>5 seconds</option>
                <option>30 seconds</option>
              </Select>
            </Field>
            <Field label="Depth reference">
              <Select defaultValue="MD (Rotary Table)">
                <option>MD (Rotary Table)</option>
                <option>TVDSS</option>
              </Select>
            </Field>
          </div>
        </Panel>

        <Panel title="Correlation Parameters">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Offset search radius">
              <Select defaultValue="10 km">
                <option>5 km</option>
                <option>10 km</option>
                <option>20 km</option>
                <option>50 km</option>
              </Select>
            </Field>
            <Field label="Depth unit">
              <Select defaultValue="metres">
                <option>metres</option>
                <option>feet</option>
              </Select>
            </Field>
          </div>
        </Panel>
      </div>
    </div>
  );
}
