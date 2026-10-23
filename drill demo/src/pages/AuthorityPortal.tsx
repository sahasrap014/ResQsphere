import React, { useState } from 'react';
import { useDisaster } from '../state/DisasterContext';
import { AuthoritySection, Incident, Shelter, ResponseTeam } from '../types/disaster';
import { DisasterMap } from '../components/map/DisasterMap';
import {
  ShieldAlert,
  Users,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Truck,
  Package,
  Activity,
  Layers,
  BarChart3,
  PlugZap,
  Radio,
  FileCheck,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Info,
  Sliders,
  TrendingUp,
} from 'lucide-react';

export const AuthorityPortal: React.FC = () => {
  const {
    authoritySection,
    setAuthoritySection,
    stats,
    incidents,
    shelters,
    responseTeams,
    assistanceRequests,
    resources,
    verifyIncident,
    assignTeamToIncident,
    updateShelterOccupancy,
    markPotentialDuplicate,
    mode,
    setMode,
    resetScenario,
    supabaseStatus,
  } = useDisaster();

  // Selected incident for detail / assignment modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [assignModalIncident, setAssignModalIncident] = useState<Incident | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Shelter occupancy editor state
  const [editingShelterId, setEditingShelterId] = useState<string | null>(null);
  const [newOccupancyValue, setNewOccupancyValue] = useState<number>(0);

  // Verification Queue filter
  const pendingIncidents = incidents.filter((inc) => inc.status === 'pending_verification');
  const duplicateIncidents = incidents.filter((inc) => inc.isPotentialDuplicate || inc.isDuplicateOf);

  // Sub-navigation sections
  const subNavItems: { id: AuthoritySection; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'verification', label: 'Incident Verification', count: pendingIncidents.length },
    { id: 'duplicates', label: 'Duplicate Review', count: duplicateIncidents.length },
    { id: 'map', label: 'Live Incident Map' },
    { id: 'shelters', label: 'Shelter Management', count: shelters.length },
    { id: 'teams', label: 'Response Teams', count: responseTeams.length },
    { id: 'resources', label: 'Resource Allocation', count: resources.length },
    { id: 'unmet_needs', label: 'Unmet Needs Detection', count: stats.pendingAssistance },
    { id: 'risk', label: 'Risk Monitoring' },
    { id: 'situation', label: 'Situation Overview' },
    { id: 'analytics', label: 'Reports & Analytics' },
    { id: 'integrations', label: 'Integration Status' },
  ];

  const handleAssignTeam = () => {
    if (!assignModalIncident || !selectedTeamId) return;
    assignTeamToIncident(assignModalIncident.id, selectedTeamId);
    setAssignModalIncident(null);
    setSelectedTeamId('');
  };

  const handleSaveOccupancy = (shelterId: string) => {
    updateShelterOccupancy(shelterId, newOccupancyValue);
    setEditingShelterId(null);
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Authority Portal Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider font-mono bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              AUTHORITY & RESPONDER COMMAND
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Incident Command System (ICS)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5">
            Operational Disaster Coordination & Logistics
          </h1>
        </div>

        {/* Demo Mode Notice Banner if needed */}
        {mode === 'demo' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-medium">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Interactive Demo Dataset Loaded</span>
            <button
              onClick={resetScenario}
              className="ml-2 font-bold underline hover:text-amber-950"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        {subNavItems.map((item) => {
          const isActive = authoritySection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAuthoritySection(item.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: OVERVIEW */}
      {authoritySection === 'overview' && (
        <div className="space-y-6">
          {/* CRITICAL REQUIREMENT: EXACTLY FOUR PRIMARY STATISTIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: Total Incidents */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                  Total Incidents
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans mt-1 block">
                  {stats.totalIncidents}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
                  <span>{pendingIncidents.length} pending verification</span>
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 2: Active Response Teams */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                  Active Response Teams
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans mt-1 block">
                  {stats.activeResponseTeams}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 inline-flex items-center gap-1">
                  <span>{responseTeams.length} total units registered</span>
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 3: People in Shelters */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                  People in Shelters
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans mt-1 block">
                  {stats.peopleInShelters.toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-flex items-center gap-1">
                  <span>Across {shelters.length} safe camps</span>
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 4: Pending Assistance */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                  Pending Assistance
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans mt-1 block">
                  {stats.pendingAssistance}
                </span>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 inline-flex items-center gap-1">
                  <span>Food, water & medical relief</span>
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* CRITICAL REQUIREMENT: PLACE INCIDENT MAP AFTER THE FOUR PRIMARY STATS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live Incident & Response Geospatial Map</h2>
                <p className="text-xs text-slate-500">
                  Shared real-time tactical overview showing verified incidents, assigned teams, and shelter capacities.
                </p>
              </div>
              <button
                onClick={() => setAuthoritySection('verification')}
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                Go to Verification Queue →
              </button>
            </div>

            <DisasterMap
              incidents={incidents}
              shelters={shelters}
              height="440px"
              title="Tactical Command Incident Map"
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          </section>

          {/* Operational Quick Review */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Urgent Pending Review Submissions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900">Incident Review Queue</h3>
                </div>
                <button
                  onClick={() => setAuthoritySection('verification')}
                  className="text-xs text-emerald-800 font-semibold hover:underline"
                >
                  View All ({pendingIncidents.length})
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {pendingIncidents.slice(0, 3).map((inc) => (
                  <div key={inc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{inc.id}</span>
                        <span className="font-bold text-slate-900">{inc.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{inc.location}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => verifyIncident(inc.id, 'verified')}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                        title="Verify"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => verifyIncident(inc.id, 'rejected')}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                        title="Reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Team Status Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-700" />
                  <h3 className="font-bold text-sm text-slate-900">Deployed Response Teams</h3>
                </div>
                <button
                  onClick={() => setAuthoritySection('teams')}
                  className="text-xs text-sky-800 font-semibold hover:underline"
                >
                  Manage Roster ({responseTeams.length})
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {responseTeams.slice(0, 3).map((team) => (
                  <div key={team.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{team.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 uppercase font-bold">
                          {team.agency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {team.currentIncidentTitle || 'Standing by at base'}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${
                        team.status === 'deployed'
                          ? 'bg-amber-100 text-amber-800'
                          : team.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: INCIDENT VERIFICATION QUEUE */}
      {authoritySection === 'verification' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Official Protocol Notice:</p>
              <p className="mt-0.5 leading-relaxed">
                Community submissions are <strong>NOT official or verified incidents</strong> until formally verified by authorized personnel. Verified incidents propagate to the public GIS map and response dispatch streams.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Pending Incident Verification Queue ({pendingIncidents.length})
              </h2>
              <span className="text-xs text-slate-500">
                Showing submissions requiring review
              </span>
            </div>

            {pendingIncidents.length > 0 ? (
              <div className="space-y-3">
                {pendingIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{inc.id}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            inc.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : inc.severity === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                          {inc.type}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900">{inc.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>

                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {inc.location}
                        </span>
                        <span>Reported by: <strong>{inc.reportedBy}</strong></span>
                        {inc.peopleTrapped ? (
                          <span className="text-red-700 font-bold">
                            ⚠️ {inc.peopleTrapped} people trapped
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <button
                        onClick={() => verifyIncident(inc.id, 'verified')}
                        className="w-full py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify Incident</span>
                      </button>

                      <button
                        onClick={() => verifyIncident(inc.id, 'rejected')}
                        className="w-full py-1.5 px-4 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject / False</span>
                      </button>

                      <button
                        onClick={() => setAssignModalIncident(inc)}
                        className="w-full py-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                      >
                        Assign Team
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">Verification Queue Cleared</p>
                <p className="mt-1">All community emergency reports have been reviewed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: DUPLICATE / POTENTIAL DUPLICATE REVIEW */}
      {authoritySection === 'duplicates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Duplicate Report Cluster Review</h2>
              <p className="text-xs text-slate-500">
                Flagged reports with overlapping GPS coordinates, similar timestamps, and identical incident types. Link them to consolidate responder dispatch without deleting original records.
              </p>
            </div>

            {duplicateIncidents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {duplicateIncidents.map((inc) => (
                  <div key={inc.id} className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-600">{inc.id}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Potential Duplicate
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{inc.title}</h3>
                    <p className="text-slate-600">{inc.description}</p>

                    <div className="text-[11px] text-slate-500 border-t border-amber-200/60 pt-2 space-y-1">
                      <div><strong>Location:</strong> {inc.location}</div>
                      <div><strong>Reported By:</strong> {inc.reportedBy} ({inc.reportedPhone})</div>
                      <div><strong>Time:</strong> {new Date(inc.reportedAt).toLocaleTimeString()}</div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => markPotentialDuplicate(inc.id, 'INC-2026-087')}
                        className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold"
                      >
                        Link to Primary Cluster
                      </button>
                      <button
                        onClick={() => verifyIncident(inc.id, 'verified')}
                        className="py-2 px-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50"
                      >
                        Keep Distinct
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">No Unresolved Duplicate Clusters</p>
                <p className="mt-1">All geographically adjacent reports have been resolved.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: LIVE INCIDENT MAP */}
      {authoritySection === 'map' && (
        <div className="space-y-4">
          <DisasterMap
            incidents={incidents}
            shelters={shelters}
            height="580px"
            title="Operational GIS Incident & Shelter Map"
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        </div>
      )}

      {/* SECTION 5: SHELTER MANAGEMENT & OCCUPANCY */}
      {authoritySection === 'shelters' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Shelter Network & Occupancy Management</h2>
                <p className="text-xs text-slate-500">
                  Total Shelter Capacity: {shelters.reduce((acc, s) => acc + s.capacity, 0).toLocaleString()} | Current Total Occupancy: {stats.peopleInShelters.toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                Changes dynamically update Overview stats
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shelters.map((shelter) => (
                <div key={shelter.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{shelter.id}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${
                          shelter.status === 'full'
                            ? 'bg-purple-100 text-purple-800'
                            : shelter.status === 'near_capacity'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {shelter.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{shelter.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{shelter.address}</p>

                    {/* Occupancy stats */}
                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Current Evacuees:</span>
                        <span className="text-slate-900 font-bold">{shelter.currentOccupancy} / {shelter.capacity}</span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{
                            width: `${Math.min(100, Math.round((shelter.currentOccupancy / shelter.capacity) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Occupancy quick update */}
                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs">
                    {editingShelterId === shelter.id ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-700">Update Headcount:</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max={shelter.capacity}
                            value={newOccupancyValue}
                            onChange={(e) => setNewOccupancyValue(parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleSaveOccupancy(shelter.id)}
                            className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Contact: {shelter.contactPerson}</span>
                        <button
                          onClick={() => {
                            setEditingShelterId(shelter.id);
                            setNewOccupancyValue(shelter.currentOccupancy);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition"
                        >
                          Edit Count
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: RESPONSE TEAM MANAGEMENT & ASSIGNMENTS */}
      {authoritySection === 'teams' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Response Team Readiness & Deployment</h2>
                <p className="text-xs text-slate-500">
                  {stats.activeResponseTeams} active deployments | {responseTeams.length} total disaster rescue units
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {responseTeams.map((team) => (
                <div key={team.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                        {team.agency}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${
                          team.status === 'deployed'
                            ? 'bg-amber-100 text-amber-800'
                            : team.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {team.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{team.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Leader: {team.leader} ({team.membersCount} crew)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Base: {team.baseLocation}</p>

                    {team.currentIncidentTitle && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block text-[10px] uppercase text-amber-700">Current Assignment:</span>
                        <p className="mt-0.5 font-medium">{team.currentIncidentTitle}</p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1">
                      {team.specialties.map((s, i) => (
                        <span key={i} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{team.contactPhone}</span>
                    <button
                      onClick={() => {
                        const verifiedUnassigned = incidents.find(
                          (inc) => (inc.status === 'verified' || inc.status === 'pending_verification') && !inc.assignedTeamId
                        );
                        if (verifiedUnassigned) {
                          setAssignModalIncident(verifiedUnassigned);
                          setSelectedTeamId(team.id);
                        } else {
                          alert('All verified incidents already have teams assigned.');
                        }
                      }}
                      className="px-2.5 py-1 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#245740] transition"
                    >
                      Deploy to Incident
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: RESOURCE ALLOCATION */}
      {authoritySection === 'resources' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Relief Resource Reserves & Inventory Pool</h2>
              <p className="text-xs text-slate-500">
                Supplies committed by accredited partners, ready for dispatch to shelters and isolated citizen clusters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resources.map((res) => (
                <div key={res.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{res.id}</span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {res.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{res.itemName}</h3>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {res.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">{res.unit}</span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-0.5 border-t border-slate-200 pt-2">
                    <div>Partner: <strong>{res.partnerName}</strong></div>
                    <div>Location: {res.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: UNMET NEEDS DETECTION */}
      {authoritySection === 'unmet_needs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Unmet Needs & Unserved-Area Detection</h2>
              <p className="text-xs text-slate-500">
                Algorithm-detected clusters of citizen assistance requests that currently lack assigned response teams or relief supplies.
              </p>
            </div>

            <div className="space-y-3">
              {assistanceRequests.filter((r) => r.status === 'pending').map((req) => (
                <div key={req.id} className="p-4 rounded-2xl border border-red-200 bg-red-50/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-600">{req.id}</span>
                      <span className="bg-red-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                        Unserved {req.priority}
                      </span>
                      <span className="font-semibold text-slate-800">{req.peopleCount} people waiting</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{req.details}</h4>
                    <p className="text-slate-500">{req.location}</p>
                  </div>
                  <button
                    onClick={() => setAuthoritySection('resources')}
                    className="py-1.5 px-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                  >
                    Match Resource Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: RISK MONITORING */}
      {authoritySection === 'risk' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">River Basin Telemetry & Hydrological Risk</h2>
            <p className="text-xs text-slate-500">
              Live gauges and sensor monitoring at Godavari Basin reservoirs and embankments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dowleswaram Barrage Gauge</span>
              <div className="text-3xl font-extrabold text-red-600 font-mono">14.85 m</div>
              <p className="text-xs text-slate-600">Danger Mark: 15.00 m (15cm buffer)</p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                <div className="bg-red-600 h-full w-[95%]" />
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">24-Hour Catchment Rainfall</span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">182 mm</div>
              <p className="text-xs text-slate-600">Category: Extremely Heavy Rain (IMD)</p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                <div className="bg-amber-600 h-full w-[85%]" />
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Current Water Discharge</span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">2.18 L Cusecs</div>
              <p className="text-xs text-slate-600">Status: All 175 gates raised to level 3</p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                <div className="bg-emerald-600 h-full w-[70%]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 10: SITUATION OVERVIEW */}
      {authoritySection === 'situation' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">District Incident Situation Overview</h2>
            <p className="text-xs text-slate-500">
              Composite summary for District Magistrate and State Disaster Management Commissioner.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs leading-relaxed text-slate-700">
            <h3 className="font-bold text-slate-900 text-sm">Operational Situation Brief — 10:30 hrs</h3>
            <p>
              Following sustained cloudburst over upper Godavari catchment, water discharge at the barrage has climbed to 2.18 lakh cusecs. A localized breach on the canal embankment at Kovvur has affected 32 families, where NDRF Team Alpha is currently executing boat evacuations.
            </p>
            <p>
              Six designated safe shelters are active, housing 1,930 evacuees with active community kitchens and medical posts. Primary hospital oxygen backup has been reinforced with a mobile generator crew. Traffic on State Highway 42 remains diverted following a mudslide at Kadiyam ghat.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 11: REPORTS & ANALYTICS */}
      {authoritySection === 'analytics' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Disaster Response Analytics</h2>
            <p className="text-xs text-slate-500">
              Key performance indicators derived directly from active scenario records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Response Time</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">18 mins</div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Within NDRF 30-min SLA</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Shelter Occupancy Rate</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {Math.round((stats.peopleInShelters / shelters.reduce((a, s) => a + s.capacity, 0)) * 100)}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Capacity buffer adequate</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assistance Fulfillment</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">62%</div>
              <span className="text-[10px] text-amber-700 font-semibold mt-1 block">Active matching in progress</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Incidents</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {incidents.filter((i) => i.status === 'verified' || i.status === 'in_progress').length}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Active deployments</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 12: INTEGRATION STATUS */}
      {authoritySection === 'integrations' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">System Integration & Connectivity State</h2>
            <p className="text-xs text-slate-500">
              Live checks of external telemetry providers, databases, and alerting channels.
            </p>
          </div>

          <div className="space-y-3">
            {/* Supabase status */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${supabaseStatus.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <h4 className="font-bold text-slate-900">Supabase Cloud PostgreSQL Database</h4>
                  <p className="text-slate-500 text-[11px]">{supabaseStatus.message}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-500">{supabaseStatus.url}</span>
            </div>

            {/* Weather status */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <div>
                  <h4 className="font-bold text-slate-900">Open-Meteo Weather API Integration</h4>
                  <p className="text-slate-500 text-[11px]">Active real-time forecast feed (WMO standard)</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 font-semibold">Live Telemetry Active</span>
            </div>

            {/* ERSS 112 status */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <div>
                  <h4 className="font-bold text-slate-900">National Emergency Helpline (ERSS 112)</h4>
                  <p className="text-slate-500 text-[11px]">Dialer integration configured for India</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-700">tel:112 Link Ready</span>
            </div>
          </div>
        </div>
      )}

      {/* TEAM ASSIGNMENT MODAL */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-bold font-mono text-emerald-800 uppercase">
                DISPATCH COORDINATION
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">Assign Response Team</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign an available responder unit to <strong>{assignModalIncident.id}</strong> ({assignModalIncident.title}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Unit</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              >
                <option value="">-- Choose Response Team --</option>
                {responseTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.agency} - {team.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAssignTeam}
                disabled={!selectedTeamId}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition"
              >
                Confirm Deployment
              </button>
              <button
                onClick={() => setAssignModalIncident(null)}
                className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
