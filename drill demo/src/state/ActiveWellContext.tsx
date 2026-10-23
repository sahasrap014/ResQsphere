import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  distanceKm,
  EMPTY_ACTIVE_WELL,
  validCoordinate,
  type DocRow,
  type Formation,
  type Well,
  type WellEvent,
} from "../data/nwis";
import { buildNWISAnalytics, type NWISAnalytics } from "../analytics/nwisAnalytics";
import { processUploadedHistoricalFiles } from "../utils/documentExtractor";

export type LiveParameters = Record<string, number>;

export interface ActiveWellModel {
  id: string;
  field: string;
  block: string;
  lat: number | null;
  lon: number | null;
  type: string;
  trajectory: string;
  plannedTd: number | null;
  spud: string;
  target: string;
  expectedPorePressure: string;
  fractureGradient: string;
  expectedFormations: string;
  notes: string;
  liveParameters: LiveParameters;
  rig: string;
  section: string;
  casingShoe: number | null;
}

const STORAGE_KEY_WELL = "nwis.activeWell.v2";
const STORAGE_KEY_HISTORICAL = "nwis.historicalData.v2";

export const DEFAULT_ACTIVE_WELL: ActiveWellModel = { ...EMPTY_ACTIVE_WELL };

function loadActiveWell(): ActiveWellModel {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WELL);
    if (!saved) return { ...DEFAULT_ACTIVE_WELL };
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_ACTIVE_WELL,
      ...parsed,
      liveParameters: parsed.liveParameters ?? {},
    };
  } catch {
    return { ...DEFAULT_ACTIVE_WELL };
  }
}

interface HistoricalStorage {
  wells: Well[];
  events: WellEvent[];
  formations: Formation[];
  documents: DocRow[];
}

function loadHistoricalData(): HistoricalStorage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORICAL);
    if (!saved) return { wells: [], events: [], formations: [], documents: [] };
    return JSON.parse(saved);
  } catch {
    return { wells: [], events: [], formations: [], documents: [] };
  }
}

/**
 * Calculates geographic proximity strictly from authoritative extracted coordinates.
 * Never applies synthetic coordinate shifting or artificial offsets.
 */
function withTrueDistances(activeWell: ActiveWellModel, wells: Well[]): Well[] {
  const hasActiveCoords = validCoordinate(activeWell.lat, activeWell.lon);

  return wells.map((well) => {
    const hasWellCoords = validCoordinate(well.lat, well.lon);
    const dist = hasActiveCoords && hasWellCoords
      ? distanceKm(activeWell.lat!, activeWell.lon!, well.lat, well.lon)
      : 0;

    return {
      ...well,
      distance: dist,
    };
  });
}

interface ActiveWellContextType {
  activeWell: ActiveWellModel;
  updateActiveWell: (next: ActiveWellModel) => void;
  nearbyWells: Well[];
  allHistoricalWells: Well[];
  historicalEvents: WellEvent[];
  historicalFormations: Formation[];
  documents: DocRow[];
  analytics: NWISAnalytics;
  uploadFiles: (files: FileList | File[]) => Promise<{ wells: number; events: number; files: number }>;
  clearHistoricalData: () => void;
  isProcessing: boolean;
}

const ActiveWellContext = createContext<ActiveWellContextType | null>(null);

export function ActiveWellProvider({ children }: { children: ReactNode }) {
  const [activeWell, setActiveWell] = useState<ActiveWellModel>(loadActiveWell);
  const [historicalData, setHistoricalData] = useState<HistoricalStorage>(loadHistoricalData);
  const [isProcessing, setIsProcessing] = useState(false);

  // Persist Active Well state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WELL, JSON.stringify(activeWell));
  }, [activeWell]);

  // Persist Historical Data state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORICAL, JSON.stringify(historicalData));
  }, [historicalData]);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    try {
      const result = await processUploadedHistoricalFiles(files);
      setHistoricalData((prev) => {
        // Merge without duplicating by ID
        const existingWellMap = new Map(prev.wells.map((w) => [w.id, w]));
        for (const w of result.wells) existingWellMap.set(w.id, w);

        const existingEvtMap = new Map(prev.events.map((e) => [e.id, e]));
        for (const e of result.events) existingEvtMap.set(e.id, e);

        const existingFormMap = new Map(prev.formations.map((f) => [f.name.toLowerCase(), f]));
        for (const f of result.formations) existingFormMap.set(f.name.toLowerCase(), f);

        const docNames = new Set(result.documents.map((d) => d.name));
        const keptOldDocs = prev.documents.filter((d) => !docNames.has(d.name));

        return {
          wells: Array.from(existingWellMap.values()),
          events: Array.from(existingEvtMap.values()),
          formations: Array.from(existingFormMap.values()),
          documents: [...result.documents, ...keptOldDocs],
        };
      });
      return { wells: result.wells.length, events: result.events.length, files: result.documents.length };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearHistoricalData = useCallback(() => {
    setHistoricalData({ wells: [], events: [], formations: [], documents: [] });
    localStorage.removeItem(STORAGE_KEY_HISTORICAL);
  }, []);

  // Calculate actual distances from user-entered Active Well coordinates
  const nearbyWells = useMemo(
    () => withTrueDistances(activeWell, historicalData.wells),
    [activeWell, historicalData.wells],
  );

  // Compute analytics strictly from real historical data
  const analytics = useMemo(
    () =>
      buildNWISAnalytics(
        activeWell,
        nearbyWells,
        historicalData.events,
        historicalData.formations,
      ),
    [activeWell, nearbyWells, historicalData.events, historicalData.formations],
  );

  return (
    <ActiveWellContext.Provider
      value={{
        activeWell,
        updateActiveWell: setActiveWell,
        nearbyWells,
        allHistoricalWells: historicalData.wells,
        historicalEvents: historicalData.events,
        historicalFormations: historicalData.formations,
        documents: historicalData.documents,
        analytics,
        uploadFiles,
        clearHistoricalData,
        isProcessing,
      }}
    >
      {children}
    </ActiveWellContext.Provider>
  );
}

export function useActiveWell() {
  const value = useContext(ActiveWellContext);
  if (!value) {
    throw new Error("useActiveWell must be used inside ActiveWellProvider");
  }
  return value;
}
