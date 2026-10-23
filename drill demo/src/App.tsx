import React from 'react';
import { DisasterProvider, useDisaster } from './state/DisasterContext';
import { Navbar } from './components/layout/Navbar';
import { HomePortal } from './pages/HomePortal';
import { CitizenPortal } from './pages/CitizenPortal';
import { AuthorityPortal } from './pages/AuthorityPortal';
import { ReliefPartnerPortal } from './pages/ReliefPartnerPortal';
import { EmergencyCallModal } from './components/common/EmergencyCallModal';
import { AuthModal } from './pages/AuthModal';
import { ShieldCheck, PhoneCall, HeartHandshake, Info } from 'lucide-react';

const MainApp: React.FC = () => {
  const { activePortal, setActivePortal, setIsEmergencyCallModalOpen } = useDisaster();

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Global Navigation Header */}
      <Navbar />

      {/* Main Portal View Routing */}
      <main className="flex-1">
        {activePortal === 'home' && <HomePortal />}
        {activePortal === 'citizen' && <CitizenPortal />}
        {activePortal === 'authority' && <AuthorityPortal />}
        {activePortal === 'partner' && <ReliefPartnerPortal />}
      </main>

      {/* Common Modals */}
      <EmergencyCallModal />
      <AuthModal />

      {/* Public Service Footer */}
      <footer className="bg-[#132E20] text-emerald-100/80 text-xs border-t border-[#1B4332] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-emerald-900/60">
            {/* Brand Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-sm">ResQsphere</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-200/70">
                All-in-one disaster preparedness, verified emergency response, and humanitarian relief coordination network for India.
              </p>
            </div>

            {/* Quick Portals */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Platform Portals</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => setActivePortal('home')} className="hover:text-white transition">
                    Public Home & Weather
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePortal('citizen')} className="hover:text-white transition">
                    Citizen Services & SOS
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePortal('authority')} className="hover:text-white transition">
                    Authority / Responder Command
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePortal('partner')} className="hover:text-white transition">
                    Relief Partner Network
                  </button>
                </li>
              </ul>
            </div>

            {/* Emergency Helplines (India) */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Emergency Helplines (India)</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center justify-between">
                  <span>Universal Emergency:</span>
                  <strong className="text-white font-mono">112</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>National Disaster Control (NDMA):</span>
                  <strong className="text-white font-mono">1078</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>State Disaster Response (SDRF):</span>
                  <strong className="text-white font-mono">1070</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Ambulance Services:</span>
                  <strong className="text-white font-mono">108</strong>
                </li>
              </ul>
            </div>

            {/* Public Service Notice */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Public Safety Commitment</h4>
              <p className="text-[11px] leading-relaxed text-emerald-200/70">
                Data privacy compliant. Citizen requests are isolated by identity. Community reports remain pending until verified by authorized personnel.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => setIsEmergencyCallModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Helpline 112</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-emerald-300/60">
            <div>© 2026 ResQsphere Platform · India Disaster Preparedness & Relief Network</div>
            <div className="flex gap-4">
              <span>National Disaster Management Framework</span>
              <span>Open-Meteo Integration</span>
              <span>OpenStreetMap & Leaflet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <DisasterProvider>
      <MainApp />
    </DisasterProvider>
  );
}
