import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Shelter, UserLocation } from '../../types/disaster';
import { ShieldAlert, Home, Eye, MapPin, Navigation } from 'lucide-react';

interface DisasterMapProps {
  incidents: Incident[];
  shelters?: Shelter[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  showShelters?: boolean;
  title?: string;
  userLocation?: UserLocation;
  isDemo?: boolean;
}

// Helper to keep Leaflet map centered when props or geolocation change
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== undefined && center[1] !== undefined) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
};

// Custom Marker for User's Active Location (GPS or Manual)
const createUserLocationIcon = (isManual?: boolean) => {
  const bg = isManual ? '#0284C7' : '#059669'; // Blue if manual, Emerald if GPS
  return L.divIcon({
    className: 'custom-user-location-marker',
    html: `
      <div style="
        background-color: ${bg};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 4px ${isManual ? 'rgba(2, 132, 199, 0.35)' : 'rgba(5, 150, 105, 0.4)'}, 0 4px 6px -1px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Custom Leaflet DivIcon Generators
const createIncidentIcon = (severity: string, status: string) => {
  let bgColor = '#EA580C'; // orange / high
  if (severity === 'critical') bgColor = '#DC2626'; // red
  else if (severity === 'moderate') bgColor = '#D97706'; // amber
  else if (severity === 'low') bgColor = '#16A34A'; // green

  const isVerified = status !== 'pending_verification';
  const pulseClass = severity === 'critical' ? 'pulse-marker' : '';

  return L.divIcon({
    className: 'custom-disaster-marker',
    html: `
      <div class="${pulseClass}" style="
        background-color: ${bgColor};
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

const createShelterIcon = (status: string) => {
  let bgColor = '#0284C7'; // Blue
  if (status === 'full') bgColor = '#9333EA'; // Purple / full
  else if (status === 'near_capacity') bgColor = '#0D9488'; // Teal

  return L.divIcon({
    className: 'custom-shelter-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 26px;
        height: 26px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

export const DisasterMap: React.FC<DisasterMapProps> = ({
  incidents,
  shelters = [],
  height = '420px',
  center,
  zoom,
  showShelters = true,
  title = 'Live Incident & Safe Shelter Map',
  userLocation,
  isDemo = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'shelters'>('all');

  // Dynamic Center & Zoom
  const activeCenter: [number, number] = React.useMemo(() => {
    // 1. Explicitly passed center (e.g. selected incident or explicit coordinate) always takes precedence
    if (center && center[0] && center[1]) return center;

    // 2. In Demo Mode, never override demo scenario with device GPS
    if (isDemo) {
      return [16.9891, 81.784];
    }

    // 3. In Live Mode, use user location if detected or manually chosen
    if (userLocation && (userLocation.isDetected || userLocation.isManual)) {
      return [userLocation.lat, userLocation.lng];
    }

    // 4. Neutral pan-India overview when location not yet obtained
    return [20.5937, 78.9629];
  }, [center, userLocation?.lat, userLocation?.lng, userLocation?.isDetected, userLocation?.isManual, isDemo]);

  const activeZoom = React.useMemo(() => {
    if (zoom) return zoom;
    if (center && center[0] && center[1]) return 13;
    if (isDemo) return 12;
    if (userLocation && (userLocation.isDetected || userLocation.isManual)) {
      return 12;
    }
    return 5; // India-wide zoom
  }, [zoom, center, userLocation?.isDetected, userLocation?.isManual, isDemo]);

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === 'verified') return inc.status === 'verified' || inc.status === 'dispatched' || inc.status === 'in_progress';
    if (filter === 'pending') return inc.status === 'pending_verification';
    return inc.status !== 'rejected';
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Map Header Toolbar */}
      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-sm text-slate-800">{title}</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
            {filteredIncidents.length} Incidents {showShelters ? `· ${shelters.length} Shelters` : ''}
          </span>
          {userLocation?.isDetected && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
              <Navigation className="w-2.5 h-2.5" /> GPS Locked
            </span>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filter === 'all' ? 'bg-[#1B4332] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Active
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filter === 'verified' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div style={{ height, width: '100%' }} className="relative z-10">
        <MapContainer
          center={activeCenter}
          zoom={activeZoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={activeCenter} zoom={activeZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location Marker (GPS or Manual) */}
          {userLocation && (userLocation.isDetected || userLocation.isManual) && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon(userLocation.isManual)}
            >
              <Popup>
                <div className="p-1 space-y-1 min-w-[200px] text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{userLocation.isDetected ? 'Current Device Location (GPS)' : 'Manually Selected Zone'}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    {userLocation.address || userLocation.district || 'Selected Sector'}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                    Coordinates: {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Demo-only low lying flood inundation simulation buffer ring */}
          {isDemo && (
            <Circle
              center={[16.985, 81.775]}
              radius={2800}
              pathOptions={{
                color: '#38BDF8',
                fillColor: '#38BDF8',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />
          )}

          {/* Incident Markers */}
          {filteredIncidents.map((inc) => (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={createIncidentIcon(inc.severity, inc.status)}
            >
              <Popup>
                <div className="p-1 space-y-1.5 min-w-[210px] text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{inc.id}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        inc.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : inc.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs leading-snug">{inc.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{inc.description}</p>

                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 space-y-0.5">
                    <div>
                      <strong>Location:</strong> {inc.location}
                    </div>
                    <div>
                      <strong>Status:</strong>{' '}
                      <span className="capitalize font-semibold text-slate-700">
                        {inc.status.replace('_', ' ')}
                      </span>
                    </div>
                    {inc.assignedTeamName && (
                      <div className="text-emerald-700 font-medium">
                        <strong>Assigned:</strong> {inc.assignedTeamName}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Shelter Markers */}
          {showShelters &&
            shelters.map((shelter) => (
              <Marker
                key={shelter.id}
                position={[shelter.lat, shelter.lng]}
                icon={createShelterIcon(shelter.status)}
              >
                <Popup>
                  <div className="p-1 space-y-1.5 min-w-[220px] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-900 text-[10px] flex items-center gap-1">
                        <Home className="w-3 h-3 text-sky-700" /> Safe Shelter
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          shelter.status === 'full'
                            ? 'bg-purple-100 text-purple-800'
                            : shelter.status === 'near_capacity'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {shelter.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs">{shelter.name}</h4>
                    <p className="text-[11px] text-slate-600">{shelter.address}</p>

                    {/* Capacity Progress Bar */}
                    <div className="pt-1 border-t border-slate-100">
                      <div className="flex justify-between text-[10px] font-medium text-slate-700 mb-1">
                        <span>Occupancy</span>
                        <span>
                          {shelter.currentOccupancy} / {shelter.capacity} people
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            shelter.currentOccupancy >= shelter.capacity
                              ? 'bg-purple-600'
                              : shelter.currentOccupancy >= shelter.capacity * 0.8
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((shelter.currentOccupancy / shelter.capacity) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 pt-1">
                      <div>Contact: {shelter.contactPhone}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* Map Legend Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-xs inline-block" />
            Critical Incident
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-xs inline-block" />
            High Severity
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs inline-block" />
            Moderate
          </span>
          {showShelters && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-600 border border-white shadow-xs inline-block" />
              Relief Shelter
            </span>
          )}
          {userLocation && (userLocation.isDetected || userLocation.isManual) && (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs inline-block" />
              Your Location
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {userLocation && (userLocation.isDetected || userLocation.isManual)
            ? `Active Coordinates: ${activeCenter[0].toFixed(4)}° N, ${activeCenter[1].toFixed(4)}° E · ${userLocation.district || 'Local Sector'}`
            : isDemo
            ? 'Demo Simulation Sector: 16.98° N, 81.78° E · East Godavari Delta Basin'
            : `Map Center: ${activeCenter[0].toFixed(2)}° N, ${activeCenter[1].toFixed(2)}° E (Select location or sign in for local GPS)`}
        </div>
      </div>
    </div>
  );
};
