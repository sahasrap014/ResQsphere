import React, { useState } from 'react';
import { useDisaster } from '../state/DisasterContext';
import { DisasterMap } from '../components/map/DisasterMap';
import {
  ShieldAlert,
  CloudRain,
  Wind,
  Droplets,
  AlertTriangle,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Info,
  Thermometer,
  MapPin,
  Navigation,
  Check,
} from 'lucide-react';

export const HomePortal: React.FC = () => {
  const {
    weather,
    isWeatherLoading,
    weatherError,
    officialAlerts,
    incidents,
    shelters,
    setActivePortal,
    setIsEmergencyCallModalOpen,
    mode,
    setMode,
    userLocation,
    requestDeviceLocation,
    setManualLocation,
  } = useDisaster();

  const [isManualLocationOpen, setIsManualLocationOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(userLocation.district || 'East Godavari');

  // Filter verified incidents for public map view (do not expose unverified or private citizen info)
  const publicVerifiedIncidents = incidents.filter(
    (inc) => inc.status === 'verified' || inc.status === 'dispatched' || inc.status === 'in_progress'
  );

  const popularDistricts = [
    { name: 'East Godavari (Kovvur / Rajahmundry)', lat: 16.9891, lng: 81.784, district: 'East Godavari' },
    { name: 'Visakhapatnam (Coastal Command)', lat: 17.6868, lng: 83.2185, district: 'Visakhapatnam' },
    { name: 'Vijayawada (Krishna Delta)', lat: 16.5062, lng: 80.648, district: 'NTR / Krishna' },
    { name: 'Guntur (Flood Staging Zone)', lat: 16.3067, lng: 80.4365, district: 'Guntur' },
    { name: 'Chennai (Coastal Lowlands)', lat: 13.0827, lng: 80.2707, district: 'Chennai' },
  ];

  const handleSelectDistrict = (d: typeof popularDistricts[0]) => {
    setManualLocation(d.lat, d.lng, d.district, d.name);
    setIsManualLocationOpen(false);
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Requirement 2: Device Location Permission & Awareness Banner in Live Mode */}
      {mode === 'live' && (
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
              userLocation.isDetected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>Location Context:</span>
                <span className="font-semibold text-emerald-800 font-mono">
                  {userLocation.address || userLocation.district || 'East Godavari Simulation Sector'}
                </span>
                {userLocation.isDetected && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-semibold">
                    GPS Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ResQsphere determines local weather, active flood risk, and nearest relief shelters for your immediate coordinates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!userLocation.isDetected && (
              <button
                onClick={() => requestDeviceLocation()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Use Current Location</span>
              </button>
            )}

            <button
              onClick={() => setIsManualLocationOpen(!isManualLocationOpen)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-xl transition text-xs border border-slate-200"
            >
              Select District Manually
            </button>
          </div>
        </div>
      )}

      {/* Manual Location Selection Dialog */}
      {isManualLocationOpen && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs animate-in fade-in">
          <div className="font-bold text-slate-800 mb-2">Select Target District or Coastal Sector:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {popularDistricts.map((d) => (
              <button
                key={d.name}
                onClick={() => handleSelectDistrict(d)}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900">{d.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{d.lat}°N, {d.lng}°E</div>
                </div>
                {userLocation.lat === d.lat && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero / Intro Banner */}
      <section className="bg-gradient-to-r from-[#1B4332] via-[#245740] to-[#2D6A4F] text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-36 -top-12 w-48 h-48 bg-emerald-400/10 rounded-full pointer-events-none" />

        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>ResQsphere — Disaster Preparedness & Relief Network</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans leading-tight">
            Safer Communities Preparedness & Early Response Platform
          </h1>

          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Connecting citizens, authorized emergency responders, and humanitarian relief partners across India to accelerate early warning, verified response assignment, and resource distribution.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActivePortal('citizen')}
              className="bg-white hover:bg-emerald-50 text-[#1B4332] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 group"
            >
              <span>Citizen Emergency Services</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setIsEmergencyCallModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helpline 112</span>
            </button>

            {mode === 'live' && (
              <button
                onClick={() => setMode('demo')}
                className="bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-400/40 text-xs px-3.5 py-2.5 rounded-xl font-medium transition"
              >
                Launch Demo Mode
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid: Weather & Official Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Card (Reliable Live Open-Meteo Integration) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-800">Current Weather & Telemetry</h3>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                  weather.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {weather.isLive ? 'Live Open-Meteo' : 'Demo Scenario'}
              </span>
            </div>

            {isWeatherLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-700 mb-2" />
                <p>Querying Open-Meteo meteorological feed...</p>
              </div>
            ) : weatherError ? (
              <div className="py-6 text-center text-xs text-amber-700 bg-amber-50 rounded-xl p-3 my-3 border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="font-bold">Weather Data Temporarily Unavailable</p>
                <p className="mt-1 text-[11px] text-slate-600">{weatherError}</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
                      {weather.temp}°C
                    </div>
                    <p className="text-xs font-semibold text-emerald-800 mt-0.5">{weather.condition}</p>
                    <p className="text-[11px] text-slate-500">{weather.city}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                      <span>Feels like {weather.apparentTemp}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Droplets className="w-3.5 h-3.5 text-slate-400" />
                      <span>Humidity: {weather.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Wind className="w-3.5 h-3.5 text-slate-400" />
                      <span>Wind: {weather.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>

                {/* 6-hour forecast timeline */}
                {weather.forecast && weather.forecast.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Upcoming Forecast
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                      {weather.forecast.slice(0, 6).map((fc, i) => (
                        <div key={i} className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block">{fc.time}</span>
                          <span className="font-bold text-slate-800 block mt-0.5">{fc.temp}°</span>
                          <span className="text-[9px] text-sky-700 font-medium block">
                            {fc.precipitation}% rain
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-3 flex justify-between items-center">
            <span>{weather.statusMessage}</span>
            <span>Synced: {weather.lastUpdated}</span>
          </div>
        </div>

        {/* Official Advisories & Warning Feeds */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Latest Verified Official Advisories
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                IMD & NDMA Advisory Stream
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {officialAlerts.length > 0 ? (
                officialAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl p-3.5 border text-xs ${
                      alert.severity === 'emergency'
                        ? 'bg-red-50/70 border-red-200 text-red-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                            alert.severity === 'emergency'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <h4 className="font-bold text-slate-900">{alert.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{alert.agency}</span>
                    </div>

                    <p className="mt-1 text-slate-700 leading-relaxed">{alert.description}</p>

                    {alert.instructions && alert.instructions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60">
                        <span className="font-semibold text-slate-800 text-[11px]">
                          Public Directives:
                        </span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 text-[11px]">
                          {alert.instructions.map((inst, i) => (
                            <li key={i}>{inst}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200">
                  <Info className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700">Official Alert Stream</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {mode === 'live'
                      ? 'No active red alert bulletins issued for this geographic zone by IMD or NDMA.'
                      : 'No simulated emergency advisories currently active.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-3 flex justify-between">
            <span>Verified government sources only</span>
            <span>Emergency helpline: 112</span>
          </div>
        </div>
      </section>

      {/* Requirement 5: Keep Incident Map on Public Home Page */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
              Local Risk Context & Incident Map
            </h2>
            <p className="text-xs text-slate-500">
              Live geographic overview showing verified community reports, flood inundation zones, and relief safe centers.
            </p>
          </div>
        </div>

        <DisasterMap
          incidents={publicVerifiedIncidents}
          shelters={shelters}
          height="450px"
          title="Verified Community Incidents & Safe Shelter Network"
        />
      </section>

      {/* Food and Water Readiness & Action Guidance Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Readiness Card 1: Food & Water Readiness */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
            <Droplets className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 mb-1">Food & Water Readiness</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ensure minimum 3 liters of potable water per person per day. Keep chlorine tablets or boil water for 10 minutes. Store high-calorie, non-perishable food (parched rice, dates, biscuits) above expected flood levels.
          </p>
          <div
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-800 flex items-center gap-1 cursor-pointer hover:underline"
            onClick={() => setActivePortal('citizen')}
          >
            <span>Request Emergency Rations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Readiness Card 2: Relief Coordination */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 mb-1">Relief Partner Network</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            NGOs, community groups, and donors can register dry food rations, drinking water, thermal blankets, and volunteers to match directly with pending citizen requests and shelter gaps.
          </p>
          <div
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-amber-800 flex items-center gap-1 cursor-pointer hover:underline"
            onClick={() => setActivePortal('partner')}
          >
            <span>Enter Relief Partner Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>
    </div>
  );
};
