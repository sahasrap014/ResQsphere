import React from 'react';
import { useDisaster } from '../../state/DisasterContext';
import { PhoneCall, AlertTriangle, ShieldCheck, X } from 'lucide-react';

export const EmergencyCallModal: React.FC = () => {
  const { isEmergencyCallModalOpen, setIsEmergencyCallModalOpen, mode } = useDisaster();

  if (!isEmergencyCallModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">National Emergency Helpline</h3>
              <p className="text-xs text-red-100">India Universal Emergency Number: 112</p>
            </div>
          </div>
          <button
            onClick={() => setIsEmergencyCallModalOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'demo' ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-amber-900 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">SIMULATED ACTION IN DEMO MODE</p>
                  <p className="mt-1 text-amber-800 leading-relaxed">
                    You are currently in <strong>Demonstration Mode</strong>. Outgoing phone calls to 112 are disabled to prevent accidental calls to real-world emergency dispatchers.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">What happens in Live Mode?</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Initiates a direct phone link via <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">tel:112</code>.</li>
                  <li>Connects to Police, Fire, Ambulance, or NDRF/SDRF disaster teams based on your state location.</li>
                </ul>
              </div>

              <button
                onClick={() => setIsEmergencyCallModalOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Close Simulated Call Window
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-900 text-xs flex gap-3">
                <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Life-Threatening Emergency Only</p>
                  <p className="mt-1 text-red-800 leading-relaxed">
                    Calling <strong>112</strong> immediately routes to the nearest State Disaster Emergency Response Centre (ERC) in India.
                  </p>
                </div>
              </div>

              <div className="text-center py-3">
                <div className="text-4xl font-extrabold text-red-600 tracking-wider font-mono">
                  112
                </div>
                <p className="text-xs text-slate-500 mt-1">Single Emergency Response Support System (ERSS)</p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="tel:112"
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-center text-sm font-bold shadow-md shadow-red-950/20 transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                  Place Call to 112 Now
                </a>
                <button
                  onClick={() => setIsEmergencyCallModalOpen(false)}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
