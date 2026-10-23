/**
 * OIL NWIS — eRTMAC Real-Time Integration Layer
 * 
 * Provides an integration-ready data layer for Oil India Limited's eRTMAC system.
 * Strictly separates Live/Incoming Sensor Telemetry from Historical Ground-Truth Data.
 */

export interface ErtmacTelemetryPacket {
  timestamp: string;
  wellId: string;
  rigId: string;
  depth: number;       // m MD
  rop: number;         // m/h
  wob: number;         // klbs
  rpm: number;         // RPM
  torque: number;      // kNm
  spp: number;         // psi
  flow: number;        // lpm
  mudWeight: number;   // SG
  status: "drilling" | "tripping" | "circulating" | "standby";
}

export type ErtmacStreamState = "awaiting_stream" | "simulation_mode" | "live_connected";

export interface ErtmacEndpointConfig {
  witsmlEndpoint: string;
  restEndpoint: string;
  websocketEndpoint: string;
  protocolVersion: string;
  channelsMapped: string[];
}

export const ERTMAC_SPECIFICATION: ErtmacEndpointConfig = {
  witsmlEndpoint: "https://ertmac-gateway.oilindia.in/witsml/v2.0/wells",
  restEndpoint: "/api/v1/ertmac/stream/telemetry",
  websocketEndpoint: "wss://ertmac-live.oilindia.in/stream/witsml/ws",
  protocolVersion: "WITSML 1.4.1.1 / WITSML 2.0 / JSON-REST",
  channelsMapped: [
    "Bit Depth (m MD)",
    "Rate of Penetration — ROP (m/h)",
    "Weight on Bit — WOB (klbs)",
    "Rotary Table Speed — RPM",
    "Surface Torque (kNm)",
    "Standpipe Pressure — SPP (psi)",
    "Mud Flow Rate In (lpm)",
    "Active Pit Mud Weight (SG)",
  ],
};

/**
 * Returns connection metadata and current status for the UI indicator.
 */
export function getErtmacStatus(hasLiveParams: boolean): {
  state: ErtmacStreamState;
  label: string;
  badgeTone: "low" | "moderate" | "accent";
  description: string;
} {
  if (hasLiveParams) {
    return {
      state: "simulation_mode",
      label: "eRTMAC: Simulation / Demo Stream",
      badgeTone: "accent",
      description: "Rig telemetry operating in local demo simulation mode. Parameter values entered by user or simulated for demonstration.",
    };
  }
  return {
    state: "awaiting_stream",
    label: "eRTMAC: Awaiting Live Feed",
    badgeTone: "moderate",
    description: "Ready for live rig connection. eRTMAC WITSML/REST ingestion gateway is listening for incoming packets.",
  };
}
