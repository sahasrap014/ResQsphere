/* ------------------------------------------------------------------
   NWIS — Core Data Models and Types
   Historical uploaded data is the application's single source of truth.
-------------------------------------------------------------------*/

export type RiskLevel = "low" | "moderate" | "high";

export interface Formation {
  id: string;
  name: string;
  top: number;
  base: number;
  litho: "sand" | "shale" | "clay" | "coal" | "limestone" | "reservoir";
  note: string;
  source?: string;
}

export interface WellEvent {
  id: string;
  well: string;
  depth: number;
  type: EventType;
  severity: RiskLevel;
  formation: string;
  npt: number;
  mitigation: string;
  outcome: string;
  source: string;
  date: string;
  summary: string;
}

export type EventType =
  | "Stuck Pipe"
  | "Mud Loss"
  | "Kick"
  | "Cementing Issue"
  | "Wellbore Instability"
  | "Bit / BHA Failure"
  | "Fishing"
  | "Overpressure"
  | "Torque Spike";

export interface CasingRecord {
  holeSection: string; // e.g. '26"', '17-1/2"', '12-1/4"', '8-1/2"'
  casingSize: string;  // e.g. '30" Conductor', '20" Surface', '13-3/8" Intermediate', '9-5/8" Production', '7" Liner'
  depth: number;       // setting depth in m
  formation?: string;  // formation at shoe
  events?: string[];   // relevant incidents around shoe
}

export interface CementingRecord {
  casingSection: string;
  depth: number;
  formation: string;
  issue?: string;       // e.g. "Lost returns during slurry placement", "Poor acoustic bond", "Gas migration"
  outcome?: string;     // e.g. "Squeeze job completed", "Remediated successfully"
  npt?: number;
  source?: string;
}

export interface DrillingParamLog {
  depth: number;
  rop?: number;
  wob?: number;
  rpm?: number;
  torque?: number;
  spp?: number;
  flow?: number;
  mudWeight?: number;
}

export type StreamMode = "awaiting" | "simulation" | "connected";

export interface Well {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  risk: RiskLevel;
  td: number;
  spud: string;
  status: "Producing" | "Suspended" | "Abandoned" | "Injector" | "Drilling";
  type: "Development" | "Exploration" | "Appraisal";
  targetFormation: string;
  production: string;
  events: number;
  npt: number;
  avgRop: number;
  cost: number;
  sourceFiles?: string[];
  casingProgram?: CasingRecord[];
  cementingRecords?: CementingRecord[];
  drillingParams?: DrillingParamLog[];
  torqueLogs?: { depth: number; torque: number; baseline: number; spike: boolean }[];
  porePressureLogs?: { depth: number; porePressure: number; mudWeight: number; fracGrad: number; status: "normal" | "overpressured" }[];
}

export interface RiskZone {
  id: string;
  top: number;
  base: number;
  level: RiskLevel;
  type: EventType;
  similarity: number;
  confidence: number;
  wells: string[];
  rationale: string;
  mitigation: string[];
  formation: string;
  events?: WellEvent[];
  // Enhanced Detailed Predictive Analysis:
  probability?: number;
  contributingFactors?: string[];
  historicalEvidenceSummary?: {
    wellCount: number;
    depthInterval: string;
    formation: string;
    incidents: string[];
    nptTotal: number;
    nptAverage: number;
  };
  parameterCorrelation?: {
    parameter: string;
    pattern: string;
    confidence: number;
    relationship: string;
  };
  mitigationFlow?: {
    action: string;
    outcome: string;
    supportingWell: string;
  };
}

export interface DrillingParameterCorrelation {
  id: string;
  parameter: string;
  currentValue: number | null;
  unit: string;
  observedPattern: string;
  correlatedEvent: string;
  correlationStrength: number; // 0-100%
  confidenceLevel: "High" | "Medium" | "Low";
  relevantDepthInterval: string;
  relationshipFlow: string; // e.g. "Increase in Torque (+28%) → Abnormal rotational friction → Potential Stuck Pipe"
  supportingEventsCount: number;
  status: "Active Anomaly" | "Elevated Trend" | "Watch Interval" | "Normal Trend" | "Data Insufficient";
  category: "warning" | "critical" | "normal";
  depthMin: number;
  depthMax: number;
}

export interface Channel {
  key: string;
  label: string;
  unit: string;
  value: number;
  decimals: number;
  trend: number;
  status: RiskLevel;
  series: number[];
}

export interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  depthRange: string;
  detail: string;
  similarity?: number;
  time: string;
  wells: string[];
  acknowledged?: boolean;
  // Enhanced Proactive Alert fields:
  alertType?: string;
  severity?: "High" | "Medium" | "Low";
  depth?: string;
  reason?: string;
  evidence?: string;
  recommendedAction?: string;
  paramCorrelation?: string;
  isProactive?: boolean;
  mitigationType?: EventType | string;
  top?: number;
  base?: number;
  formation?: string;
}

export interface DocRow {
  name: string;
  kind: string;
  size: string;
  status: "Processed" | "Processing" | "Queued" | "OCR" | "Failed";
  wells: number;
  events: number;
  quality: number;
}

export interface Zone {
  id: string;
  name: string;
  score: number;
  level: RiskLevel;
  confidence: "High" | "Medium" | "Low";
  lat: number;
  lon: number;
  rx: number;
  ry: number;
  rot: number;
  evidence: string[];
  reservoir: { porosity: string; netPay: string; sat: string; depth: string };
}

/* -------------------------- Active Well Initial State -------------------------- */

export const EMPTY_ACTIVE_WELL = {
  id: "",
  field: "",
  block: "",
  lat: null as number | null,
  lon: null as number | null,
  type: "Development",
  trajectory: "Vertical",
  plannedTd: null as number | null,
  target: "",
  spud: "",
  rig: "",
  section: "",
  casingShoe: null as number | null,
  expectedPorePressure: "",
  fractureGradient: "",
  expectedFormations: "",
  notes: "",
  liveParameters: {} as Record<string, number>,
};

/* -------------------------- Colors & Utilities -------------------------- */

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#10b981",
  moderate: "#f5a524",
  high: "#ef4444",
};

export const EVENT_COLORS: Record<EventType, string> = {
  "Stuck Pipe": "#ef4444",
  "Mud Loss": "#f5a524",
  Kick: "#fb7185",
  "Cementing Issue": "#60a5fa",
  "Wellbore Instability": "#a78bfa",
  "Bit / BHA Failure": "#f97316",
  Fishing: "#22d3ee",
  Overpressure: "#ec4899",
  "Torque Spike": "#eab308",
};

export const validCoordinate = (lat: number | null | undefined, lon: number | null | undefined): boolean =>
  typeof lat === "number" &&
  typeof lon === "number" &&
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lon) <= 180 &&
  (lat !== 0 || lon !== 0);

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radians = (deg: number) => (deg * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
}
