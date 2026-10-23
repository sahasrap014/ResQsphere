import React, { useState, useRef, useEffect } from 'react';
import { useDisaster } from '../../state/DisasterContext';
import { PortalType } from '../../types/disaster';
import {
  ShieldAlert,
  PhoneCall,
  User,
  RotateCcw,
  Sparkles,
  Radio,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    mode,
    setMode,
    activePortal,
    setActivePortal,
    user,
    logout,
    openAuthForRole,
    setIsEmergencyCallModalOpen,
    resetScenario,
    supabaseStatus,
  } = useDisaster();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAuthDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const portals: { id: PortalType; label: string; badge?: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'citizen', label: 'Citizen Portal' },
    { id: 'authority', label: 'Authority / Responder', badge: 'RESTRICTED' },
    { id: 'partner', label: 'Relief Partner' },
  ];

  const handlePortalClick = (id: PortalType) => {
    setActivePortal(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Top Notification Mode Banner */}
      {mode === 'demo' ? (
        <div className="bg-amber-600 px-4 py-1.5 text-white flex flex-wrap items-center justify-between text-xs font-medium tracking-wide">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="font-bold tracking-wider uppercase">
              DEMONSTRATION MODE — SIMULATED GODAVARI DELTA SCENARIO
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <button
              onClick={resetScenario}
              className="inline-flex items-center gap-1 bg-amber-700/80 hover:bg-amber-800 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold transition"
              title="Restore pristine simulated dataset"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Scenario
            </button>
            <button
              onClick={() => setMode('live')}
              className="bg-white text-amber-900 hover:bg-amber-100 px-2.5 py-0.5 rounded text-[11px] font-bold shadow-xs transition"
            >
              Switch to Live Data Mode
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950 px-4 py-1.5 text-emerald-200 border-b border-emerald-900/60 flex flex-wrap items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wide uppercase text-[11px]">
              LIVE DATA MODE — REAL-TIME RESQSPHERE TELEMETRY
            </span>
            <span className="hidden md:inline-block text-emerald-400/60">|</span>
            <span className="hidden md:inline-block text-[11px] text-emerald-300/80">
              {supabaseStatus.status === 'connected'
                ? 'Supabase: Connected'
                : 'Supabase: Unconfigured (Local Safety Mode)'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <button
              onClick={() => setMode('demo')}
              className="inline-flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded text-[11px] font-medium transition"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              Launch Interactive Demo
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-[#1B4332] text-white px-4 sm:px-6 py-3 transition-colors border-b border-[#245740]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Name: ResQsphere */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => handlePortalClick('home')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-950/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  ResQsphere
                </span>
                <span className="rounded bg-emerald-800/80 border border-emerald-700 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200 uppercase tracking-wider">
                  India
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 tracking-normal font-normal">
                Disaster Preparedness & Humanitarian Relief Network
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-[#132E20]/80 p-1 rounded-xl border border-[#245740]/60">
            {portals.map((portal) => {
              const isActive = activePortal === portal.id;
              return (
                <button
                  key={portal.id}
                  onClick={() => handlePortalClick(portal.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-800/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {portal.label}
                    {portal.badge && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        {portal.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prominent Emergency 112 Call Button */}
            <button
              onClick={() => setIsEmergencyCallModalOpen(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold shadow-md shadow-red-950/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
              title="Call National Emergency Helpline 112"
            >
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
              <span>Call 112</span>
            </button>

            {/* Auth / Account Profile */}
            {user ? (
              <div className="flex items-center gap-2 bg-[#132E20] border border-[#245740] px-3 py-1.5 rounded-lg text-xs">
                <div className="h-6 w-6 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-[11px]">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left max-w-[120px] truncate">
                  <div className="font-semibold text-white truncate">{user.fullName || user.email}</div>
                  <div className="text-[10px] text-emerald-300 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1 hover:text-red-300 text-emerald-300 transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Requirement 3: Separate Role Sign-In Entry Points */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                  className="flex items-center gap-1.5 bg-[#2D6A4F] hover:bg-[#347b5c] text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold border border-emerald-500/30 transition shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                </button>

                {authDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Choose Sign-In Portal
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setAuthDropdownOpen(false);
                        openAuthForRole('citizen');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-xs transition"
                    >
                      <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Citizen Sign In</div>
                        <div className="text-[10px] text-slate-500">Track requests & reports</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setAuthDropdownOpen(false);
                        openAuthForRole('authority');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-xs transition border-t border-slate-50"
                    >
                      <div className="h-7 w-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Authority / Responder</div>
                        <div className="text-[10px] text-slate-500">Incident command login</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setAuthDropdownOpen(false);
                        openAuthForRole('partner');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-xs transition border-t border-slate-50"
                    >
                      <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Relief Partner</div>
                        <div className="text-[10px] text-slate-500">NGO & supply logistics</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#245740] flex flex-col gap-1.5 pb-2">
            {portals.map((portal) => {
              const isActive = activePortal === portal.id;
              return (
                <button
                  key={portal.id}
                  onClick={() => handlePortalClick(portal.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-emerald-700 text-white' : 'text-emerald-100 hover:bg-emerald-800/60'
                  }`}
                >
                  <span>{portal.label}</span>
                  {portal.badge && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {portal.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </nav>
    </header>
  );
};
