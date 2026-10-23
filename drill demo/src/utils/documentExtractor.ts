import type { CasingRecord, CementingRecord, DocRow, DrillingParamLog, EventType, Formation, RiskLevel, Well, WellEvent } from "../data/nwis";
import { parseZipArchive } from "./zipParser";
import { isScannedDocument, processOcrDocument } from "./ocrProcessor";

export interface ExtractedData {
  wells: Well[];
  events: WellEvent[];
  formations: Formation[];
  documents: DocRow[];
}

/**
 * Coordinate extraction utilities.
 * Handles both decimal degrees (e.g. 27.4102, 95.2846)
 * and DMS (e.g. 27° 24' 36.7" N, 95° 17' 04.5" E or 27-24-36.7 N).
 */
export function parseCoordinates(text: string): { lat: number; lon: number } | null {
  // Pattern 1: DMS format (e.g. 27°24'36.7"N 95°17'04.5"E or 27 deg 24 min N)
  const dmsRegex = /(\d{1,2})[°\s]+(\d{1,2})['\s]+([0-9.]+)?["\s]*([NSns])[,;\s]+(\d{1,3})[°\s]+(\d{1,2})['\s]+([0-9.]+)?["\s]*([EWew])/;
  const dmsMatch = text.match(dmsRegex);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3] || "0");
    const latDir = dmsMatch[4].toUpperCase();

    const lonDeg = parseFloat(dmsMatch[5]);
    const lonMin = parseFloat(dmsMatch[6]);
    const lonSec = parseFloat(dmsMatch[7] || "0");
    const lonDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    let lon = lonDeg + lonMin / 60 + lonSec / 3600;

    if (latDir === "S") lat = -lat;
    if (lonDir === "W") lon = -lon;

    if (isValidLatLon(lat, lon)) {
      return { lat: Math.round(lat * 100000) / 100000, lon: Math.round(lon * 100000) / 100000 };
    }
  }

  // Pattern 2: Explicit Latitude / Longitude keywords with decimal values
  const explicitRegex = /(?:latitude|lat)[:=\s]+(-?\d{1,2}\.\d+)[^\d\w]+(?:longitude|lon|long)[:=\s]+(-?\d{1,3}\.\d+)/i;
  const explicitMatch = text.match(explicitRegex);
  if (explicitMatch) {
    const lat = parseFloat(explicitMatch[1]);
    const lon = parseFloat(explicitMatch[2]);
    if (isValidLatLon(lat, lon)) {
      return { lat, lon };
    }
  }

  // Pattern 3: Common geographic decimal pairs (e.g. 27.3782, 95.3164 or 27.3782 N, 95.3164 E)
  const pairRegex = /(-?\d{1,2}\.\d{3,7})[^\d\w]+(?:[Nn][,\s]+)?(-?\d{1,3}\.\d{3,7})(?:\s*[Ee])?/;
  const pairMatch = text.match(pairRegex);
  if (pairMatch) {
    const lat = parseFloat(pairMatch[1]);
    const lon = parseFloat(pairMatch[2]);
    if (isValidLatLon(lat, lon)) {
      return { lat, lon };
    }
  }

  return null;
}

function isValidLatLon(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && (lat !== 0 || lon !== 0);
}

/**
 * Text extractor for PDF files (extracts uncompressed and flate-compressed stream content).
 */
export async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  let fullText = "";

  // 1. Convert bytes to ASCII text for header / dictionary inspection
  const raw = new TextDecoder("latin1").decode(bytes);

  // 2. Look for PDF text objects: BT ... ET
  const btEtMatches = raw.matchAll(/BT[\s\S]*?ET/g);
  for (const match of btEtMatches) {
    const block = match[0];
    // Extract Tj operators: (text) Tj
    const tjMatches = block.matchAll(/\(([^)]*)\)\s*Tj/g);
    for (const tj of tjMatches) {
      fullText += tj[1] + " ";
    }
    // Extract TJ array operators: [(t1) 12 (t2)] TJ
    const tjArrMatches = block.matchAll(/\[([^\]]*)\]\s*TJ/g);
    for (const tjArr of tjArrMatches) {
      const parts = tjArr[1].matchAll(/\(([^)]*)\)/g);
      for (const p of parts) {
        fullText += p[1] + " ";
      }
    }
  }

  // 3. Decompress FlateDecode streams if direct text was sparse
  if (fullText.trim().length < 50) {
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(raw)) !== null) {
      const streamContent = streamMatch[1];
      const streamBytes = new Uint8Array(streamContent.length);
      for (let i = 0; i < streamContent.length; i++) {
        streamBytes[i] = streamContent.charCodeAt(i);
      }

      try {
        if (typeof DecompressionStream !== "undefined") {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(streamBytes);
          writer.close();
          const decompressed = await new Response(ds.readable).arrayBuffer();
          const decoded = new TextDecoder("utf-8", { fatal: false }).decode(decompressed);

          const innerBt = decoded.matchAll(/BT[\s\S]*?ET/g);
          for (const m of innerBt) {
            const tj = m[0].matchAll(/\(([^)]*)\)\s*Tj/g);
            for (const t of tj) fullText += t[1] + " ";
            const arr = m[0].matchAll(/\[([^\]]*)\]\s*TJ/g);
            for (const a of arr) {
              const sub = a[1].matchAll(/\(([^)]*)\)/g);
              for (const s of sub) fullText += s[1] + " ";
            }
          }
          if (decoded.length > 50 && fullText.length < 50) {
            fullText += decoded + " ";
          }
        }
      } catch {
        // Stream decompression may fail for images or font tables, skip gracefully
      }
    }
  }

  return fullText;
}

/**
 * Parses well records and drilling data from a CSV or tabular text string.
 */
export function parseCsvContent(text: string, sourceFileName: string): { wells: Well[]; events: WellEvent[]; formations: Formation[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { wells: [], events: [], formations: [] };

  const delimiter = lines[0].includes(",") ? "," : lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));

  const wells: Well[] = [];
  const events: WellEvent[] = [];
  const formations: Formation[] = [];

  const getCol = (row: string[], namePatterns: string[]): string | undefined => {
    const idx = headers.findIndex((h) => namePatterns.some((p) => h.includes(p)));
    if (idx >= 0 && idx < row.length) {
      return row[idx].trim().replace(/^["']|["']$/g, "");
    }
    return undefined;
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    if (row.length < 2) continue;

    // Check if this row describes a well
    const wellId = getCol(row, ["well id", "well_id", "well name", "well", "well_name", "uwi", "api"]);
    const latStr = getCol(row, ["latitude", "lat", "lat_deg", "surface_lat", "surface lat"]);
    const lonStr = getCol(row, ["longitude", "lon", "long", "lon_deg", "surface_lon", "surface lon"]);
    const tdStr = getCol(row, ["total depth", "td", "planned_td", "depth", "planned td", "md"]);
    const spudStr = getCol(row, ["spud", "spud date", "date", "spud_date"]);
    const statusStr = getCol(row, ["status", "well status", "well_status"]);
    const typeStr = getCol(row, ["type", "well type", "well_type"]);
    const targetStr = getCol(row, ["target", "formation", "target formation", "target_formation", "reservoir"]);
    const prodStr = getCol(row, ["production", "prod", "oil rate", "bopd", "flow rate"]);
    const nptStr = getCol(row, ["npt", "npt hours", "npt_hrs", "lost time"]);
    const costStr = getCol(row, ["cost", "well cost", "expenditure", "cost_musd"]);
    const ropStr = getCol(row, ["rop", "avg rop", "avg_rop", "rate of penetration"]);
    const wobStr = getCol(row, ["wob", "weight on bit", "wob_klbs"]);
    const rpmStr = getCol(row, ["rpm", "rotary speed", "revs"]);
    const torqueStr = getCol(row, ["torque", "drilling torque", "torque_knm", "torque_ftlbs"]);
    const sppStr = getCol(row, ["spp", "standpipe", "standpipe pressure", "spp_psi"]);
    const flowStr = getCol(row, ["flow", "flow rate", "flow in", "flow_gpm", "flow_lpm"]);
    const mwStr = getCol(row, ["mud weight", "mud_weight", "mw", "mud wt", "sg", "emw"]);
    const casingSizeStr = getCol(row, ["casing size", "casing_size", "casing", "casing_type"]);
    const casingDepthStr = getCol(row, ["casing depth", "casing_depth", "shoe depth", "shoe_depth", "shoe"]);
    const holeSectionStr = getCol(row, ["hole section", "hole_section", "section size", "section"]);
    const cementDepthStr = getCol(row, ["cement depth", "cement_depth", "cementing depth"]);
    const cementIssueStr = getCol(row, ["cement issue", "cementing issue", "cement problem"]);
    const cementOutcomeStr = getCol(row, ["cement outcome", "cementing outcome"]);

    // Check if this row describes an event / incident
    const eventTypeStr = getCol(row, ["event", "incident", "problem", "event type", "event_type", "issue"]);
    const mitigationStr = getCol(row, ["mitigation", "action", "remediation", "action taken"]);
    const outcomeStr = getCol(row, ["outcome", "result", "status after"]);
    const depthStr = getCol(row, ["depth", "event depth", "depth_m", "md"]);
    const severityStr = getCol(row, ["severity", "risk", "level"]);

    // If coordinates exist on row
    let lat = latStr ? parseFloat(latStr) : NaN;
    let lon = lonStr ? parseFloat(lonStr) : NaN;
    if (!isValidLatLon(lat, lon)) {
      const coords = parseCoordinates(row.join(" "));
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    if (wellId) {
      const validCoords = isValidLatLon(lat, lon);
      const casingProgram: CasingRecord[] = [];
      if (casingSizeStr || casingDepthStr) {
        casingProgram.push({
          holeSection: holeSectionStr || '12-1/4"',
          casingSize: casingSizeStr || '9-5/8" Casing',
          depth: casingDepthStr ? parseFloat(casingDepthStr) || 0 : 0,
          formation: targetStr || "",
          events: [],
        });
      }

      const drillingParams: DrillingParamLog[] = [];
      if (ropStr || wobStr || rpmStr || torqueStr || sppStr || mwStr) {
        drillingParams.push({
          depth: depthStr ? parseFloat(depthStr) || 0 : tdStr ? parseFloat(tdStr) || 0 : 0,
          rop: ropStr ? parseFloat(ropStr) : undefined,
          wob: wobStr ? parseFloat(wobStr) : undefined,
          rpm: rpmStr ? parseFloat(rpmStr) : undefined,
          torque: torqueStr ? parseFloat(torqueStr) : undefined,
          spp: sppStr ? parseFloat(sppStr) : undefined,
          flow: flowStr ? parseFloat(flowStr) : undefined,
          mudWeight: mwStr ? parseFloat(mwStr) : undefined,
        });
      }

      const cementingRecords: CementingRecord[] = [];
      if (cementDepthStr || cementIssueStr) {
        cementingRecords.push({
          casingSection: holeSectionStr || casingSizeStr || 'Intermediate',
          depth: cementDepthStr ? parseFloat(cementDepthStr) || 0 : depthStr ? parseFloat(depthStr) || 0 : 0,
          formation: targetStr || "",
          issue: cementIssueStr || "Cementing operations performed",
          outcome: cementOutcomeStr || "Remediated successfully",
          npt: nptStr ? parseFloat(nptStr) || 0 : 0,
          source: sourceFileName,
        });
      }

      const well: Well = {
        id: wellId,
        name: getCol(row, ["name", "well name", "full_name"]) || wellId,
        lat: validCoords ? lat : 0,
        lon: validCoords ? lon : 0,
        distance: 0,
        risk: "low",
        td: tdStr ? parseFloat(tdStr) || 0 : 0,
        spud: spudStr || "",
        status: normalizeStatus(statusStr),
        type: normalizeType(typeStr),
        targetFormation: targetStr || "",
        production: prodStr || "",
        events: 0,
        npt: nptStr ? parseFloat(nptStr) || 0 : 0,
        avgRop: ropStr ? parseFloat(ropStr) || 0 : 0,
        cost: costStr ? parseFloat(costStr) || 0 : 0,
        casingProgram: casingProgram.length ? casingProgram : undefined,
        drillingParams: drillingParams.length ? drillingParams : undefined,
        cementingRecords: cementingRecords.length ? cementingRecords : undefined,
      };
      wells.push(well);
    }

    // Parse event if event fields exist
    if (eventTypeStr || (nptStr && parseFloat(nptStr) > 0)) {
      const normType = normalizeEventType(eventTypeStr || "Mud Loss");
      const npt = nptStr ? parseFloat(nptStr) || 0 : 0;
      const depth = depthStr ? parseFloat(depthStr) || 0 : tdStr ? parseFloat(tdStr) || 0 : 0;
      const severity: RiskLevel = severityStr?.toLowerCase().includes("high")
        ? "high"
        : severityStr?.toLowerCase().includes("mod")
          ? "moderate"
          : npt > 15
            ? "high"
            : npt > 5
              ? "moderate"
              : "low";

      events.push({
        id: `evt-${sourceFileName}-${i}`,
        well: wellId || "Unknown Well",
        depth,
        type: normType,
        severity,
        formation: targetStr || "",
        npt,
        mitigation: mitigationStr || "Standard operational remediation applied",
        outcome: outcomeStr || "Operation resumed",
        source: `${sourceFileName} · row ${i + 1}`,
        date: spudStr || "",
        summary: row.slice(0, 5).join(" · "),
      });
    }

    // Check if this row describes a formation top
    const formationTopStr = getCol(row, ["top", "formation top", "depth top", "top_m"]);
    const formationBaseStr = getCol(row, ["base", "formation base", "depth base", "base_m"]);
    const formationNameStr = getCol(row, ["formation", "formation name", "stratigraphy", "zone"]);
    if (formationNameStr && (formationTopStr || formationBaseStr)) {
      formations.push({
        id: `form-${i}`,
        name: formationNameStr,
        top: formationTopStr ? parseFloat(formationTopStr) || 0 : 0,
        base: formationBaseStr ? parseFloat(formationBaseStr) || 0 : 0,
        litho: "reservoir",
        note: `Extracted from ${sourceFileName}`,
      });
    }
  }

  return { wells, events, formations };
}

/**
 * Free-text parser for PDF, TXT, DOC reports.
 * Searches for well names, coordinates, formation markers, and drilling incidents.
 */
export function parseNarrativeContent(text: string, sourceFileName: string): { wells: Well[]; events: WellEvent[]; formations: Formation[] } {
  const wells: Well[] = [];
  const events: WellEvent[] = [];
  const formations: Formation[] = [];

  // Extract coordinates if present
  const coords = parseCoordinates(text);

  // Extract Well ID / Name candidates
  const wellMatches = text.matchAll(/(?:Well(?:\s+Name)?|UWI|API|Wellbore)[:=\s]+([A-Za-z0-9_-]{3,20})/gi);
  const foundWells = new Set<string>();
  for (const m of wellMatches) {
    const id = m[1].trim();
    if (id && !/^(the|and|for|from|with|this|that|type|date)$/i.test(id)) {
      foundWells.add(id);
    }
  }

  // If no explicit Well: label, check filename for well ID pattern (e.g. WCR_OIL-AB-0104.pdf)
  if (foundWells.size === 0) {
    const fileWellMatch = sourceFileName.match(/([A-Z]{2,5}-[A-Z0-9]+-[0-9]+|W-[0-9]{2,4}|[A-Z]+_[0-9]+)/i);
    if (fileWellMatch) {
      foundWells.add(fileWellMatch[1].toUpperCase());
    }
  }

  // Extract TD (Total Depth)
  const tdMatch = text.match(/(?:Total Depth|TD|Planned TD|Drilled Depth)[:=\s]+([0-9,.]+)\s*(?:m|metres|ft)?/i);
  const td = tdMatch ? parseFloat(tdMatch[1].replace(/,/g, "")) : 0;

  // Extract Target / Formation
  const targetMatch = text.match(/(?:Target Formation|Target Reservoir|Main Pay|Reservoir)[:=\s]+([A-Za-z0-9\s]+?)(?:[.,;\n]|$)/i);
  const targetFormation = targetMatch ? targetMatch[1].trim() : "";

  // Extract Status
  const statusMatch = text.match(/(?:Status|Well Status)[:=\s]+(Producing|Suspended|Abandoned|Injector|Drilling)/i);
  const status = normalizeStatus(statusMatch?.[1]);

  // Extract Well Type
  const typeMatch = text.match(/(?:Well Type|Type)[:=\s]+(Development|Exploration|Appraisal)/i);
  const wellType = normalizeType(typeMatch?.[1]);

  // Extract Production rate
  const prodMatch = text.match(/([0-9.]+\s*(?:bopd|m3\/d|MMscfd|bpd)[\sA-Za-z0-9.·]*)/i);
  const production = prodMatch ? prodMatch[1].trim() : "";

  // Create Well objects for each identified well
  for (const wellId of foundWells) {
    wells.push({
      id: wellId,
      name: wellId,
      lat: coords?.lat ?? 0,
      lon: coords?.lon ?? 0,
      distance: 0,
      risk: "low",
      td: td || 0,
      spud: "",
      status,
      type: wellType,
      targetFormation,
      production,
      events: 0,
      npt: 0,
      avgRop: 0,
      cost: 0,
    });
  }

  // Scan text for drilling events (Overpressure, Torque Spike, Stuck Pipe, Mud Loss, Kick, etc.)
  const eventKeywords: { type: EventType; regex: RegExp }[] = [
    { type: "Overpressure", regex: /(?:overpressure|pore pressure|high pore pressure|abnormally pressured|pressure anomaly|high emw)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Torque Spike", regex: /(?:torque spike|high torque|erratic torque|stick-?slip|excessive torque|torque anomaly)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Mud Loss", regex: /(?:mud loss|losses|lost circulation|loss zone|partial loss|total loss)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Stuck Pipe", regex: /(?:stuck pipe|pipe stuck|differential sticking|pack-off|packed off)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Kick", regex: /(?:kick|gas influx|well control|influx)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Cementing Issue", regex: /(?:cementing issue|cement squeeze|poor bond|lost returns during cement|channeling)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Wellbore Instability", regex: /(?:wellbore instability|tight hole|cavings|hole collapse|sloughing)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Bit / BHA Failure", regex: /(?:bit failure|bha failure|cutter damage|stick-slip|bit wear)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
    { type: "Fishing", regex: /(?:fishing|twist-off|fish in hole|overshot)[\s\S]{0,120}?(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m|metres)?/gi },
  ];

  let eventIdx = 0;
  for (const { type, regex } of eventKeywords) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const depth = match[1] ? parseFloat(match[1]) : td || 0;
      const snippet = match[0].replace(/\s+/g, " ").trim();

      // Extract NPT hours if mentioned in snippet
      const nptMatch = snippet.match(/([0-9.]+)\s*(?:hrs|hours|h)\s*(?:npt|lost time)?/i);
      const npt = nptMatch ? parseFloat(nptMatch[1]) : 4.0;

      // Extract mitigation if mentioned nearby
      const mitMatch = text.slice(Math.max(0, match.index - 50), match.index + 200).match(/(?:mitigation|remedy|cured with|spotted|pill|sweep)[:\s]+([^.\n;]+)/i);
      const mitigation = mitMatch ? mitMatch[1].trim() : "Standard operational remediation applied";

      // Extract outcome
      const outMatch = text.slice(match.index, match.index + 250).match(/(?:outcome|result|resumed|freed|cured)[:\s]+([^.\n;]+)/i);
      const outcome = outMatch ? outMatch[1].trim() : "Remediated successfully";

      const wellAssigned = wells[0]?.id || "Historical Record";

      events.push({
        id: `evt-${sourceFileName}-${++eventIdx}`,
        well: wellAssigned,
        depth,
        type,
        severity: npt > 15 ? "high" : npt > 6 ? "moderate" : "low",
        formation: targetFormation,
        npt,
        mitigation,
        outcome,
        source: `${sourceFileName}`,
        date: "",
        summary: snippet.slice(0, 160),
      });

      if (eventIdx >= 14) break; // Keep bounded
    }
  }

  // Scan text for Casing records
  const casingMatches = text.matchAll(/(?:casing|shoe|liner)[:=\s]+([0-9/.-]+(?:\s*inch|")?)\s*(?:at|depth|@)?\s*([0-9]{3,4})\s*(?:m)?/gi);
  const narrativeCasings: CasingRecord[] = [];
  for (const cm of casingMatches) {
    const size = cm[1].trim();
    const cDepth = parseFloat(cm[2]);
    if (size && Number.isFinite(cDepth)) {
      narrativeCasings.push({
        holeSection: cDepth < 1000 ? '17-1/2"' : cDepth < 2500 ? '12-1/4"' : '8-1/2"',
        casingSize: size.includes('"') ? size : `${size}" Casing`,
        depth: cDepth,
        formation: targetFormation || "Formation boundary",
        events: [],
      });
    }
  }
  if (narrativeCasings.length && wells[0]) {
    wells[0].casingProgram = narrativeCasings;
  }

  // Scan text for Formation tops
  const formationMatches = text.matchAll(/(?:Formation|Fm|Stratigraphy)[:\s]+([A-Za-z0-9\s]+?)\s+(?:top|@)?\s*([0-9]{3,4})\s*(?:m)?/gi);
  for (const fm of formationMatches) {
    const fName = fm[1].trim();
    const fTop = parseFloat(fm[2]);
    if (fName && Number.isFinite(fTop)) {
      formations.push({
        id: `form-${formations.length + 1}`,
        name: fName,
        top: fTop,
        base: fTop + 150,
        litho: "reservoir",
        note: `Extracted from ${sourceFileName}`,
      });
    }
  }

  return { wells, events, formations };
}

/**
 * Main ingestion dispatcher. Accepts files (including ZIP archives)
 * and produces unified structured historical dataset.
 */
export async function processUploadedHistoricalFiles(files: FileList | File[]): Promise<ExtractedData> {
  const fileArray = Array.from(files);
  const documents: DocRow[] = [];
  const allWells: Well[] = [];
  const allEvents: WellEvent[] = [];
  const allFormations: Formation[] = [];

  for (const file of fileArray) {
    const isZip = file.name.toLowerCase().endsWith(".zip");

    if (isZip) {
      try {
        const buffer = await file.arrayBuffer();
        const unzipped = await parseZipArchive(buffer);

        let zipWellsCount = 0;
        let zipEventsCount = 0;

        for (const entry of unzipped) {
          const ext = entry.name.split(".").pop()?.toLowerCase() ?? "";
          let result: { wells: Well[]; events: WellEvent[]; formations: Formation[] } = { wells: [], events: [], formations: [] };
          let docStatus: DocRow["status"] = "Processed";

          if (["csv", "tsv", "tab"].includes(ext)) {
            result = parseCsvContent(entry.text, entry.name);
          } else if (ext === "pdf") {
            let pdfText = await extractTextFromPdf(entry.data);
            if (isScannedDocument(pdfText)) {
              const ocr = await processOcrDocument(entry.data, entry.name);
              pdfText = ocr.text;
              docStatus = "OCR";
            }
            result = parseNarrativeContent(pdfText || entry.text, entry.name);
          } else if (["png", "jpg", "jpeg", "bmp", "tiff", "webp"].includes(ext)) {
            const ocr = await processOcrDocument(entry.data, entry.name);
            result = parseNarrativeContent(ocr.text, entry.name);
            docStatus = "OCR";
          } else if (["txt", "log", "json", "xml", "doc", "docx", "witsml"].includes(ext)) {
            result = parseNarrativeContent(entry.text, entry.name);
          }

          if (result.wells.length || result.events.length) {
            zipWellsCount += result.wells.length;
            zipEventsCount += result.events.length;
            allWells.push(...result.wells);
            allEvents.push(...result.events);
            allFormations.push(...result.formations);
          }

          documents.push({
            name: entry.name,
            kind: classifyFileKind(entry.name),
            size: `${(entry.size / 1024 / 1024).toFixed(1)} MB`,
            status: docStatus,
            wells: result.wells.length,
            events: result.events.length,
            quality: result.wells.length || result.events.length ? 92 : 75,
          });
        }

        // Add root ZIP entry to document list
        documents.unshift({
          name: file.name,
          kind: "ZIP Archive Bundle",
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: "Processed",
          wells: zipWellsCount,
          events: zipEventsCount,
          quality: 95,
        });
      } catch (err) {
        console.error("ZIP extraction failed:", err);
        documents.push({
          name: file.name,
          kind: "ZIP Archive Bundle",
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: "Failed",
          wells: 0,
          events: 0,
          quality: 0,
        });
      }
    } else {
      // Individual file processing
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      let result: { wells: Well[]; events: WellEvent[]; formations: Formation[] } = { wells: [], events: [], formations: [] };
      let docStatus: DocRow["status"] = "Processed";

      try {
        if (["csv", "tsv"].includes(ext)) {
          const text = await file.text();
          result = parseCsvContent(text, file.name);
        } else if (ext === "pdf") {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let pdfText = await extractTextFromPdf(bytes);
          if (isScannedDocument(pdfText)) {
            const ocr = await processOcrDocument(bytes, file.name);
            pdfText = ocr.text;
            docStatus = "OCR";
          }
          result = parseNarrativeContent(pdfText, file.name);
        } else if (["png", "jpg", "jpeg", "bmp", "tiff", "webp"].includes(ext)) {
          const ocr = await processOcrDocument(file, file.name);
          result = parseNarrativeContent(ocr.text, file.name);
          docStatus = "OCR";
        } else {
          const text = await file.text();
          result = parseNarrativeContent(text, file.name);
        }

        allWells.push(...result.wells);
        allEvents.push(...result.events);
        allFormations.push(...result.formations);

        documents.push({
          name: file.name,
          kind: classifyFileKind(file.name),
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: docStatus,
          wells: result.wells.length,
          events: result.events.length,
          quality: result.wells.length || result.events.length ? 92 : 70,
        });
      } catch (err) {
        console.error(`File extraction failed for ${file.name}:`, err);
        documents.push({
          name: file.name,
          kind: classifyFileKind(file.name),
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: "Failed",
          wells: 0,
          events: 0,
          quality: 0,
        });
      }
    }
  }

  // Deduplicate wells by ID
  const wellMap = new Map<string, Well>();
  for (const w of allWells) {
    const existing = wellMap.get(w.id);
    if (!existing) {
      wellMap.set(w.id, w);
    } else {
      // Merge properties
      if ((!existing.lat || !existing.lon) && w.lat && w.lon) {
        existing.lat = w.lat;
        existing.lon = w.lon;
      }
      if (!existing.td && w.td) existing.td = w.td;
      if (!existing.targetFormation && w.targetFormation) existing.targetFormation = w.targetFormation;
      if (!existing.production && w.production) existing.production = w.production;
    }
  }

  // Aggregate event counts on wells
  for (const e of allEvents) {
    const w = wellMap.get(e.well);
    if (w) {
      w.events += 1;
      w.npt += e.npt;
      if (e.severity === "high") w.risk = "high";
      else if (e.severity === "moderate" && w.risk !== "high") w.risk = "moderate";
    }
  }

  return {
    wells: Array.from(wellMap.values()),
    events: allEvents,
    formations: allFormations,
    documents,
  };
}

function classifyFileKind(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("wcr") || lower.includes("completion")) return "Well Completion Report";
  if (lower.includes("ddr") || lower.includes("daily")) return "Daily Drilling Report";
  if (lower.includes("mud") || lower.includes("log")) return "Mud Logging Record";
  if (lower.includes("npt")) return "NPT Register";
  if (lower.includes("geo") || lower.includes("geology")) return "Geological Report";
  if (lower.includes("survey") || lower.includes("coord")) return "Well Location Survey";
  if (lower.includes("prod")) return "Production Record";
  if (lower.includes("cement")) return "Cementing Report";
  if (lower.includes("casing")) return "Casing Program Record";
  if (/\.(png|jpe?g|bmp|tiff?|webp)$/i.test(lower)) return "Scanned Image Report (OCR)";
  if (lower.includes(".csv")) return "CSV Dataset";
  if (lower.includes(".pdf")) return "PDF Document";
  if (lower.includes(".zip")) return "ZIP Archive Bundle";
  return "Historical Document";
}

function normalizeStatus(s?: string): Well["status"] {
  const l = (s || "").toLowerCase();
  if (l.includes("prod")) return "Producing";
  if (l.includes("susp")) return "Suspended";
  if (l.includes("aban")) return "Abandoned";
  if (l.includes("inj")) return "Injector";
  if (l.includes("drill")) return "Drilling";
  return "Producing";
}

function normalizeType(t?: string): Well["type"] {
  const l = (t || "").toLowerCase();
  if (l.includes("exp")) return "Exploration";
  if (l.includes("app")) return "Appraisal";
  return "Development";
}

function normalizeEventType(t: string): EventType {
  const l = t.toLowerCase();
  if (l.includes("overpress") || l.includes("abnormal press") || l.includes("pore press")) return "Overpressure";
  if (l.includes("torque") || l.includes("stick-slip") || l.includes("drag")) return "Torque Spike";
  if (l.includes("loss")) return "Mud Loss";
  if (l.includes("stuck")) return "Stuck Pipe";
  if (l.includes("kick") || l.includes("influx") || l.includes("control")) return "Kick";
  if (l.includes("cement") || l.includes("squeeze")) return "Cementing Issue";
  if (l.includes("instab") || l.includes("caving") || l.includes("collapse")) return "Wellbore Instability";
  if (l.includes("bit") || l.includes("bha")) return "Bit / BHA Failure";
  if (l.includes("fish")) return "Fishing";
  return "Mud Loss";
}
