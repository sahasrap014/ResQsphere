import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "./ui";
import { cn } from "../utils/cn";
import { useActiveWell } from "../state/ActiveWellContext";

interface Msg {
  role: "user" | "ai";
  text: string;
  evidence?: string[];
  confidence?: string;
}

const SUGGESTIONS = [
  "What historical incidents occurred nearby?",
  "What mitigation was used in offset records?",
  "Summarise the risks ahead.",
  "What is the total historical NPT?",
];

export default function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activeWell, nearbyWells, allHistoricalWells, historicalEvents, documents, analytics } = useActiveWell();

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: `NWIS Assistant online. Active Well: ${activeWell.id || "Not configured"} (${nearbyWells.length} offset well(s) within correlation radius). Grounded in ${documents.length} uploaded document(s), ${allHistoricalWells.length} historical well(s), and ${historicalEvents.length} incident record(s). I cite source documents for every finding.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const generateAnswer = (q: string): Omit<Msg, "role"> => {
    const s = q.toLowerCase();

    // Query: Incidents / events / nearby
    if (s.includes("incident") || s.includes("event") || s.includes("happened") || s.includes("nearby") || s.includes("offset")) {
      if (!historicalEvents.length) {
        return {
          text: `No historical incident records are currently present in the repository (${documents.length} documents uploaded). Upload daily drilling reports, mud logs, or completion reports to populate incident history.`,
          confidence: "Insufficient evidence",
        };
      }
      const topEvents = historicalEvents.slice(0, 4);
      const summary = topEvents.map((e) => `• ${e.well} at ${e.depth} m: ${e.type} (${e.npt}h NPT) — ${e.summary}`).join("\n");
      const sources = [...new Set(topEvents.map((e) => e.source).filter(Boolean))];
      return {
        text: `Found ${historicalEvents.length} historical incident(s) in uploaded records:\n${summary}`,
        evidence: sources,
        confidence: `High — based on ${historicalEvents.length} uploaded records`,
      };
    }

    // Query: Mitigation / remedy / action
    if (s.includes("mitigat") || s.includes("remed") || s.includes("action") || s.includes("used")) {
      const withMit = historicalEvents.filter((e) => e.mitigation && !e.mitigation.includes("Standard"));
      if (!withMit.length) {
        return {
          text: "No specific remedial mitigation actions were identified in the uploaded historical records. Upload DDR or NPT registers containing mitigation narratives.",
          confidence: "Insufficient evidence",
        };
      }
      const topMit = withMit.slice(0, 3);
      const summary = topMit.map((e) => `• ${e.type} on ${e.well}: ${e.mitigation} (Outcome: ${e.outcome})`).join("\n");
      return {
        text: `Remedial actions recorded in historical reports:\n${summary}`,
        evidence: [...new Set(topMit.map((e) => e.source))],
        confidence: "Grounded in historical DDR logs",
      };
    }

    // Query: Risk / forecast / lookahead
    if (s.includes("risk") || s.includes("forecast") || s.includes("ahead")) {
      if (!analytics.riskZones.length) {
        return {
          text: "Insufficient historical evidence to identify distinct forward-looking risk intervals. Multiple offset incidents at comparable depths are required.",
          confidence: "Insufficient evidence",
        };
      }
      const zoneSummary = analytics.riskZones.map((z) => `• ${z.top}–${z.base} m: ${z.type} (${z.level.toUpperCase()} risk, ${z.wells.length} supporting well(s))`).join("\n");
      return {
        text: `Predicted risk intervals derived from offset records:\n${zoneSummary}`,
        evidence: analytics.riskZones.flatMap((z) => z.wells.map((w) => `Well record: ${w}`)).slice(0, 5),
        confidence: "High — modeled from historical clusters",
      };
    }

    // Query: NPT / downtime / cost
    if (s.includes("npt") || s.includes("downtime") || s.includes("cost") || s.includes("hour")) {
      if (analytics.npt.total === 0) {
        return {
          text: "No non-productive time (NPT) hours are recorded in the current repository. Upload NPT registers or DDR files.",
          confidence: "Insufficient evidence",
        };
      }
      const causes = analytics.npt.byCause.map((c) => `${c.cause}: ${c.hours.toFixed(1)} hrs`).join(", ");
      return {
        text: `Total recorded downtime across historical records is ${analytics.npt.total.toFixed(1)} hrs. Breakdown by cause: ${causes}.`,
        evidence: documents.map((d) => d.name).slice(0, 3),
        confidence: "Calculated from uploaded records",
      };
    }

    // Default Fallback
    return {
      text: `I searched the uploaded repository (${documents.length} document(s), ${allHistoricalWells.length} well(s), ${historicalEvents.length} event(s)) but found no direct historical evidence matching "${q}". Try asking about historical incidents, mitigation, risks, or NPT. NWIS never fabricates answers without underlying records.`,
      confidence: "Insufficient evidence",
    };
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const answer = generateAnswer(q);
      setMsgs((m) => [...m, { role: "ai", ...answer }]);
      setTyping(false);
    }, 600);
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-line bg-ink-900 shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-line-soft px-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[3px] border border-violet-500/50 bg-violet-500/10 text-[11px] text-violet-300">
            ✦
          </span>
          <div>
            <div className="text-[12px] font-semibold text-fog-100">NWIS AI Assistant</div>
            <div className="text-[9px] tracking-wider text-fog-500 uppercase">
              100% Historical Evidence Grounded
            </div>
          </div>
        </div>
        <button onClick={onClose} className="cursor-pointer px-1.5 text-fog-500 hover:text-fog-200">
          ✕
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5">
        {msgs.map((m, i) => (
          <div key={i} className={cn("fade-up", m.role === "user" ? "flex justify-end" : "")}>
            {m.role === "user" ? (
              <div className="max-w-[85%] rounded-md rounded-br-none border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[12px] text-sky-100">
                {m.text}
              </div>
            ) : (
              <div className="rounded-md border border-line-soft bg-ink-850 p-3">
                <p className="whitespace-pre-line text-[12px] leading-relaxed text-fog-300">{m.text}</p>
                {m.evidence && m.evidence.length > 0 && (
                  <div className="mt-2.5 border-t border-line-soft pt-2">
                    <div className="mb-1.5 font-mono text-[9px] tracking-widest text-fog-500 uppercase">
                      Supporting historical sources
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.evidence.map((e) => (
                        <span key={e} className="rounded-sm border border-line bg-ink-900 px-1.5 py-0.5 font-mono text-[9.5px] text-fog-400">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {m.confidence && (
                  <div className="mt-2">
                    <Badge tone={m.confidence.startsWith("High") ? "low" : m.confidence.startsWith("Insufficient") ? "high" : "moderate"}>
                      {m.confidence}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-1.5 px-1 text-[11px] text-fog-500">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:240ms]" />
            <span className="ml-1 font-mono text-[10.5px]">searching historical repository…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-line-soft p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="cursor-pointer rounded-full border border-line-soft bg-ink-850 px-2.5 py-1 text-[10.5px] text-fog-400 transition-colors hover:border-violet-500/50 hover:text-violet-300"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about historical incidents, mitigations, NPT…"
            className="min-w-0 flex-1 rounded-sm border border-line-soft bg-ink-950 px-2.5 py-2 text-[12px] text-fog-100 outline-none placeholder:text-fog-500 focus:border-violet-500/60"
          />
          <Button variant="primary" type="submit" className="shrink-0">
            Ask
          </Button>
        </form>
        <p className="mt-1.5 text-[9.5px] leading-relaxed text-fog-500">
          Grounding: answers use only uploaded historical documents. No synthetic fallback.
        </p>
      </div>
    </div>
  );
}

export function AssistantFab({ onClick, hidden }: { onClick: () => void; hidden?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed right-5 bottom-5 z-40 flex cursor-pointer items-center gap-2 rounded-full border border-violet-500/50 bg-ink-850/95 py-2.5 pr-4 pl-3 shadow-xl backdrop-blur transition-all hover:border-violet-400 hover:bg-ink-800",
        hidden && "pointer-events-none opacity-0",
      )}
    >
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-[12px] text-violet-300">
        ✦<span className="absolute inset-0 rounded-full border border-violet-400/40 pulse-ring" />
      </span>
      <span className="text-[12px] font-medium text-fog-200">Ask NWIS AI</span>
    </button>
  );
}
