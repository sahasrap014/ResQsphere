import React, { useState } from 'react';
import { useDisaster } from '../state/DisasterContext';
import { DisasterMap } from '../components/map/DisasterMap';
import {
  AuthoritySection,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  ResponseTeam,
  Shelter,
  AssistanceRequest,
  ReliefResource,
} from '../types/disaster';
import { validateIndianMobile } from '../utils/phoneValidation';
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  MapPin,
  Sparkles,
  Link2,
  GitFork,
  Plus,
  Package,
  Layers,
  Phone,
  Droplets,
  Activity,
  FileText,
  X,
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
    addShelter,
    addResponseTeam,
    canAccessPortal,
    linkDuplicateToPrimary,
    keepIncidentDistinct,
    matchAndAllocateResource,
    mode,
    resetScenario,
    user,
    logout,
    openAuthForRole,
    userLocation,
  } = useDisaster();

  // Focused coordinates for Tactical Map
  const [mapFocusCenter, setMapFocusCenter] = useState<[number, number] | undefined>(undefined);
  const [assignModalIncident, setAssignModalIncident] = useState<Incident | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [assignError, setAssignError] = useState<string | null>(null);

  // Response Team form state (Add Response Team feature)
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamAgency, setTeamAgency] = useState('SDRF');
  const [teamType, setTeamType] = useState('Search & Rescue (USAR)');
  const [teamLeader, setTeamLeader] = useState('');
  const [teamPhone, setTeamPhone] = useState('');
  const [teamMembersCount, setTeamMembersCount] = useState<number>(12);
  const [teamBaseLocation, setTeamBaseLocation] = useState('');
  const [teamStatus, setTeamStatus] = useState<'available' | 'deployed' | 'resting'>('available');
  const [teamSpecialties, setTeamSpecialties] = useState('');
  const [teamNotes, setTeamNotes] = useState('');
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [teamFormSuccess, setTeamFormSuccess] = useState<string | null>(null);

  // Shelter state
  const [isAddShelterOpen, setIsAddShelterOpen] = useState(false);
  const [shelterName, setShelterName] = useState('');
  const [shelterAddress, setShelterAddress] = useState('');
  const [shelterCapacity, setShelterCapacity] = useState<number>(500);
  const [shelterOccupancy, setShelterOccupancy] = useState<number>(0);
  const [shelterPhone, setShelterPhone] = useState('');
  const [shelterContactPerson, setShelterContactPerson] = useState('');
  const [shelterFormError, setShelterFormError] = useState<string | null>(null);
  const [shelterFormSuccess, setShelterFormSuccess] = useState<string | null>(null);

  // Shelter quick occupancy editor
  const [editingShelterId, setEditingShelterId] = useState<string | null>(null);
  const [newOccupancyValue, setNewOccupancyValue] = useState<number>(0);
  const [occupancyEditError, setOccupancyEditError] = useState<string | null>(null);

  // Duplicate Review State
  const [linkingIncident, setLinkingIncident] = useState<Incident | null>(null);
  const [targetPrimaryId, setTargetPrimaryId] = useState<string>('');
  const [duplicateActionFeedback, setDuplicateActionFeedback] = useState<string | null>(null);

  // Match Resources State (Requirement 9)
  const [matchingRequest, setMatchingRequest] = useState<AssistanceRequest | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [quantityToAllocate, setQuantityToAllocate] = useState<number>(1);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [matchingSuccess, setMatchingSuccess] = useState<string | null>(null);
  const [isMatchingSubmitting, setIsMatchingSubmitting] = useState(false);

  // Filtering
  const pendingIncidents = incidents.filter((inc) => inc.status === 'pending_verification');
  // Unresolved duplicates: marked potential or duplicate, but not yet explicitly reviewed as distinct
  const unresolvedDuplicates = incidents.filter(
    (inc) => (inc.isPotentialDuplicate || inc.isDuplicateOf) && !inc.duplicateReviewed
  );

  // Clean sub-navigation items: Exactly 7 operational sections
  const subNavItems: { id: AuthoritySection; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'verification', label: 'Incident Verification', count: pendingIncidents.length },
    { id: 'duplicates', label: 'Duplicate Review', count: unresolvedDuplicates.length },
    { id: 'shelters', label: 'Shelter Management', count: shelters.length },
    { id: 'teams', label: 'Response Teams', count: responseTeams.length },
    { id: 'resources', label: 'Resource Allocation', count: resources.length },
    { id: 'unmet_needs', label: 'Unmet Needs Detection', count: stats.pendingAssistance },
  ];

  // Handlers
  const handleAssignTeam = () => {
    if (!assignModalIncident || !selectedTeamId) return;
    setAssignError(null);
    const result = assignTeamToIncident(assignModalIncident.id, selectedTeamId);
    if (!result.success) {
      setAssignError(result.error || 'Failed to deploy team.');
      return;
    }
    setAssignModalIncident(null);
    setSelectedTeamId('');
  };

  const handleSaveOccupancy = (shelterId: string) => {
    setOccupancyEditError(null);
    const res = updateShelterOccupancy(shelterId, newOccupancyValue);
    if (!res.success) {
      setOccupancyEditError(res.error || 'Occupancy exceeds capacity.');
      return;
    }
    setEditingShelterId(null);
  };

  const handleAddShelterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShelterFormError(null);
    setShelterFormSuccess(null);

    const res = addShelter({
      name: shelterName,
      address: shelterAddress,
      district: 'East Godavari Simulation Sector',
      lat: 16.989 + (Math.random() - 0.5) * 0.02,
      lng: 81.784 + (Math.random() - 0.5) * 0.02,
      capacity: shelterCapacity,
      currentOccupancy: shelterOccupancy,
      contactPerson: shelterContactPerson || 'Shelter Administrator',
      contactPhone: shelterPhone,
      facilities: ['Drinking Water', 'Generator Power', 'First Aid', 'Restrooms'],
    });

    if (!res.success) {
      setShelterFormError(res.error || 'Failed to create shelter.');
      return;
    }

    setShelterFormSuccess(`Shelter "${shelterName}" successfully registered and operational.`);
    setShelterName('');
    setShelterAddress('');
    setShelterPhone('');
    setShelterContactPerson('');
    setShelterOccupancy(0);
    setShelterCapacity(500);
    setTimeout(() => {
      setIsAddShelterOpen(false);
      setShelterFormSuccess(null);
    }, 1200);
  };

  const handleConfirmLinkDuplicate = () => {
    if (!linkingIncident || !targetPrimaryId) return;
    const res = linkDuplicateToPrimary(linkingIncident.id, targetPrimaryId);
    if (!res.success) {
      setDuplicateActionFeedback(`Error: ${res.error}`);
      return;
    }
    setDuplicateActionFeedback(`Report ${linkingIncident.id} linked as duplicate to ${targetPrimaryId}.`);
    setLinkingIncident(null);
    setTargetPrimaryId('');
    setTimeout(() => setDuplicateActionFeedback(null), 2500);
  };

  const handleKeepDistinctAction = (incidentId: string) => {
    const res = keepIncidentDistinct(incidentId);
    if (!res.success) {
      setDuplicateActionFeedback(`Error: ${res.error}`);
      return;
    }
    setDuplicateActionFeedback(`Incident ${incidentId} confirmed as distinct incident.`);
    setTimeout(() => setDuplicateActionFeedback(null), 2500);
  };

  const handleExecuteAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchingRequest || !selectedResourceId) return;
    setMatchingError(null);
    setIsMatchingSubmitting(true);

    const officerName = user?.fullName || 'District Relief Command Officer';
    const res = await matchAndAllocateResource(
      matchingRequest.id,
      selectedResourceId,
      quantityToAllocate,
      officerName
    );

    setIsMatchingSubmitting(false);

    if (!res.success) {
      setMatchingError(res.error || 'Failed to allocate relief resources.');
      return;
    }

    setMatchingSuccess(
      `Successfully allocated ${quantityToAllocate} units to request ${matchingRequest.id}. Available inventory has been deducted.`
    );
    setTimeout(() => {
      setMatchingRequest(null);
      setSelectedResourceId('');
      setMatchingSuccess(null);
    }, 1400);
  };

  const handleAddTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamFormError(null);
    setTeamFormSuccess(null);

    const result = addResponseTeam({
      name: teamName,
      agency: teamAgency,
      type: teamType,
      leader: teamLeader || 'Team Commander',
      contactPhone: teamPhone,
      membersCount: teamMembersCount,
      baseLocation: teamBaseLocation,
      status: teamStatus,
      specialties: teamSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      notes: teamNotes,
    });

    if (!result.success) {
      setTeamFormError(result.error || 'Failed to add response team.');
      return;
    }

    setTeamFormSuccess(`Response team "${teamName}" registered successfully! Available for mission dispatch.`);
    setTeamName('');
    setTeamLeader('');
    setTeamPhone('');
    setTeamBaseLocation('');
    setTeamSpecialties('');
    setTeamNotes('');
    setTimeout(() => {
      setTeamFormSuccess(null);
      setIsAddTeamOpen(false);
    }, 1500);
  };

  // Section 3: Enforce strict role authorization
  const accessCheck = canAccessPortal('authority');
  if (!accessCheck.allowed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {accessCheck.reason === 'citizen_denied'
              ? 'You are signed in as a Citizen and do not have permission to access the Authority/Responder portal. Please sign in with an authorized account.'
              : accessCheck.reason === 'partner_denied'
              ? 'You are signed in as a Relief Partner and do not have permission to access the Authority/Responder portal. Please sign in with an authorized account.'
              : accessCheck.reason === 'pending_approval'
              ? 'Your Authority account is currently pending administrator verification. Please contact state disaster command.'
              : 'The Authority Command Center is restricted to verified emergency personnel. Please sign in with an authorized Authority / Responder account.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          {user ? (
            <>
              <button
                onClick={logout}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Sign Out
              </button>
              <button
                onClick={() => {
                  logout();
                  openAuthForRole('authority');
                }}
                className="px-4 py-2 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#245740] transition"
              >
                Sign In with Authorized Account
              </button>
            </>
          ) : (
            <button
              onClick={() => openAuthForRole('authority')}
              className="px-5 py-2.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#245740] transition"
            >
              Sign In as Authority / Responder
            </button>
          )}
        </div>
      </div>
    );
  }

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
            <span className="text-xs text-slate-500">ResQsphere Incident Command System</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5">
            Operational Disaster Coordination & Logistics
          </h1>
        </div>

        {mode === 'demo' && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-medium">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Interactive Demo Scenario Active</span>
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
                  <span>Across {shelters.length} active safe camps</span>
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
                  Real-time tactical overview showing verified incidents, assigned teams, and shelter capacities.
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
              center={mapFocusCenter}
              userLocation={userLocation}
              isDemo={mode === 'demo'}
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
                  <div
                    key={inc.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{inc.title}</div>
                      <div className="text-[11px] text-slate-500">📍 {inc.location}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setMapFocusCenter([inc.lat, inc.lng]);
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className="px-2 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-[11px]"
                        title="Center Tactical Map on this incident"
                      >
                        Map
                      </button>
                      <button
                        onClick={() => setAuthoritySection('verification')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-semibold text-[11px]"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Response Team Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-700" />
                  <h3 className="font-bold text-sm text-slate-900">Response Team Deployments</h3>
                </div>
                <button
                  onClick={() => setAuthoritySection('teams')}
                  className="text-xs text-emerald-800 font-semibold hover:underline"
                >
                  Manage Teams ({responseTeams.length})
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {responseTeams.slice(0, 3).map((team) => (
                  <div
                    key={team.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{team.name}</div>
                      <div className="text-[11px] text-slate-500">{team.agency} · {team.leader}</div>
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
              <span className="text-xs text-slate-500">Showing submissions requiring review</span>
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
                          <span className="text-red-700 font-bold">⚠️ {inc.peopleTrapped} people trapped</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                      <button
                        onClick={() => verifyIncident(inc.id, 'verified', 'Confirmed by Duty Operations Officer')}
                        className="w-full sm:w-auto py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify Incident</span>
                      </button>

                      <button
                        onClick={() => verifyIncident(inc.id, 'rejected', 'Rejected: Duplicate / Insufficient grounding')}
                        className="w-full sm:w-auto py-2 px-3 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => {
                          setMapFocusCenter([inc.lat, inc.lng]);
                          setAuthoritySection('overview');
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition"
                        title="Locate coordinates on tactical map"
                      >
                        Locate on Map
                      </button>

                      <button
                        onClick={() => setAssignModalIncident(inc)}
                        className="w-full sm:w-auto py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
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

      {/* SECTION 3: DUPLICATE REVIEW (Requirement 8) */}
      {authoritySection === 'duplicates' && (
        <div className="space-y-4">
          {duplicateActionFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{duplicateActionFeedback}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Duplicate Report Cluster Review</h2>
              <p className="text-xs text-slate-500">
                Flagged submissions with overlapping geographic coordinates or identical incident types. Associate duplicates with the primary incident cluster or confirm them as distinct.
              </p>
            </div>

            {unresolvedDuplicates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {unresolvedDuplicates.map((inc) => (
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
                      {/* Action 1: Link to Primary Cluster */}
                      <button
                        onClick={() => {
                          setLinkingIncident(inc);
                          // Default to first verified incident not equal to inc.id
                          const firstOther = incidents.find((i) => i.id !== inc.id);
                          if (firstOther) setTargetPrimaryId(firstOther.id);
                        }}
                        className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Link to Primary Cluster</span>
                      </button>

                      {/* Action 2: Keep Distinct */}
                      <button
                        onClick={() => handleKeepDistinctAction(inc.id)}
                        className="py-2 px-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 flex items-center gap-1 transition"
                      >
                        <GitFork className="w-3.5 h-3.5" />
                        <span>Keep Distinct</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">No Unresolved Duplicate Clusters</p>
                <p className="mt-1">All geographically adjacent reports have been reviewed and verified.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: SHELTER MANAGEMENT (Requirement 6: Add Shelter option) */}
      {authoritySection === 'shelters' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Evacuation Shelter Network & Occupancy</h2>
                <p className="text-xs text-slate-500">
                  {stats.peopleInShelters.toLocaleString()} current evacuees across {shelters.length} active safe facilities
                </p>
              </div>

              {/* Requirement 6: Add Shelter Button */}
              <button
                onClick={() => setIsAddShelterOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Shelter</span>
              </button>
            </div>

            {occupancyEditError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{occupancyEditError}</span>
              </div>
            )}

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

                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Current Evacuees:</span>
                        <span className="text-slate-900 font-bold">{shelter.currentOccupancy} / {shelter.capacity}</span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            shelter.currentOccupancy >= shelter.capacity
                              ? 'bg-purple-600'
                              : shelter.currentOccupancy >= shelter.capacity * 0.85
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
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
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                          <span>Set Headcount (Max {shelter.capacity}):</span>
                        </div>
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
                          <button
                            onClick={() => setEditingShelterId(null)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800"
                          >
                            Cancel
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

      {/* SECTION 5: RESPONSE TEAMS (Requirement 7: Prevent Repeat Deployment) */}
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

              {/* Add Response Team Action */}
              <button
                onClick={() => {
                  setTeamFormError(null);
                  setTeamFormSuccess(null);
                  setIsAddTeamOpen(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Response Team</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {responseTeams.map((team) => {
                const isAlreadyDeployed = team.status === 'deployed' || team.status === 'on_site';

                return (
                  <div key={team.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          {team.agency}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${
                            isAlreadyDeployed
                              ? 'bg-amber-100 text-amber-800'
                              : team.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isAlreadyDeployed ? 'Deployed / On Site' : team.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900">{team.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">Leader: {team.leader} ({team.membersCount} crew)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Base: {team.baseLocation}</p>

                      {team.currentIncidentTitle && (
                        <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                          <span className="font-bold block text-[10px] uppercase text-amber-700">Active Incident:</span>
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

                      {/* Requirement 7: Prevent repeat deployment of response teams */}
                      {isAlreadyDeployed ? (
                        <button
                          disabled
                          className="px-2.5 py-1 bg-slate-200 text-slate-400 rounded-lg font-semibold cursor-not-allowed text-xs"
                          title="Team is already deployed to an active incident"
                        >
                          Already Deployed
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const verifiedUnassigned = incidents.find(
                              (inc) => (inc.status === 'verified' || inc.status === 'pending_verification') && !inc.assignedTeamId
                            );
                            if (verifiedUnassigned) {
                              setAssignModalIncident(verifiedUnassigned);
                              setSelectedTeamId(team.id);
                            } else {
                              alert('All verified incidents already have response teams dispatched.');
                            }
                          }}
                          className="px-2.5 py-1 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#245740] transition"
                        >
                          Deploy to Incident
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: RESOURCE ALLOCATION */}
      {authoritySection === 'resources' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Relief Resource Reserves & Inventory Pool</h2>
              <p className="text-xs text-slate-500">
                Supplies committed by accredited partners, available for dispatch to shelters and isolated citizen clusters.
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

      {/* SECTION 7: UNMET NEEDS DETECTION & REAL MATCHING WORKFLOW (Requirement 9) */}
      {authoritySection === 'unmet_needs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Unmet Needs & Relief Allocation Workflow</h2>
              <p className="text-xs text-slate-500">
                Live citizen assistance requests awaiting relief distribution. Match available partner inventory to fulfill requests directly.
              </p>
            </div>

            <div className="space-y-3">
              {assistanceRequests
                .filter((r) => r.status === 'pending' || r.status === 'partially_fulfilled')
                .map((req) => {
                  const rem = req.remainingQuantity ?? req.quantityRequested ?? req.peopleCount;
                  const ful = req.quantityFulfilled ?? 0;
                  const reqTot = req.quantityRequested ?? rem;

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-red-200 bg-red-50/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-600">{req.id}</span>
                          <span className="bg-red-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                            {req.status === 'partially_fulfilled' ? 'Partially Fulfilled' : `Unserved ${req.priority}`}
                          </span>
                          <span className="font-semibold text-slate-800">
                            Need: {rem} {req.unit || 'units'} ({req.peopleCount} people)
                          </span>
                          {ful > 0 && (
                            <span className="text-emerald-700 font-bold text-[10px]">
                              ({ful}/{reqTot} delivered)
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{req.details}</h4>
                        <p className="text-slate-500">📍 {req.location}</p>
                      </div>

                      {/* Requirement 9: Dedicated Match Resources Modal Opener */}
                      <button
                        onClick={() => {
                          setMatchingRequest(req);
                          setMatchingError(null);
                          setMatchingSuccess(null);
                          // Default allocation quantity
                          setQuantityToAllocate(rem);
                          // Pre-select matching resource if available
                          const matchingRes = resources.find(
                            (res) => res.category === req.category && res.quantity > 0
                          );
                          if (matchingRes) setSelectedResourceId(matchingRes.id);
                        }}
                        className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <Package className="w-4 h-4" />
                        <span>Match Resources</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SHELTER (Requirement 6) */}
      {isAddShelterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 relative">
            <button
              onClick={() => setIsAddShelterOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Evacuation Shelter</h3>
                <p className="text-xs text-slate-500">Register new designated cyclone/flood relief camp</p>
              </div>
            </div>

            {shelterFormError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{shelterFormError}</span>
              </div>
            )}

            {shelterFormSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shelterFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddShelterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shelter Name *</label>
                <input
                  type="text"
                  required
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  placeholder="e.g. Zilla Parishad Model High School Shelter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Address *</label>
                <input
                  type="text"
                  required
                  value={shelterAddress}
                  onChange={(e) => setShelterAddress(e.target.value)}
                  placeholder="e.g. Near Bus Stand, High Grounds, Kovvur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={shelterCapacity}
                    onChange={(e) => setShelterCapacity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Occupancy *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={shelterOccupancy}
                    onChange={(e) => setShelterOccupancy(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400">Must not exceed capacity</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Camp Administrator *</label>
                  <input
                    type="text"
                    required
                    value={shelterContactPerson}
                    onChange={(e) => setShelterContactPerson(e.target.value)}
                    placeholder="e.g. M. Rama Rao, Tahsildar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Mobile Number (10-Digit Indian Mobile) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={shelterPhone}
                    onChange={(e) => setShelterPhone(e.target.value)}
                    placeholder="+91 98480 12345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddShelterOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs"
                >
                  Save Shelter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK TO PRIMARY CLUSTER (Requirement 8) */}
      {linkingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 relative">
            <button
              onClick={() => setLinkingIncident(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 mb-1">Link to Primary Incident Cluster</h3>
            <p className="text-xs text-slate-500 mb-4">
              Associate report <strong>{linkingIncident.id}</strong> ({linkingIncident.title}) with the master incident:
            </p>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">Select Master Incident:</label>
              <select
                value={targetPrimaryId}
                onChange={(e) => setTargetPrimaryId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
              >
                {incidents
                  .filter((i) => i.id !== linkingIncident.id)
                  .map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      {inc.id} — {inc.title} ({inc.location})
                    </option>
                  ))}
              </select>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                Note: The original report will be preserved with full history and linked to the master response dispatch.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setLinkingIncident(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLinkDuplicate}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-5 py-2 rounded-xl"
                >
                  Confirm Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MATCH RESOURCES WORKFLOW (Requirement 9) */}
      {matchingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 relative">
            <button
              onClick={() => setMatchingRequest(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Relief Resource Allocation Workflow</h3>
                <p className="text-xs text-slate-500">Match active requests to partner stock reserves</p>
              </div>
            </div>

            {matchingError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{matchingError}</span>
              </div>
            )}

            {matchingSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{matchingSuccess}</span>
              </div>
            )}

            {/* Request Summary Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-slate-700">{matchingRequest.id}</span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-slate-200 font-semibold text-[10px]">
                  {matchingRequest.category}
                </span>
              </div>
              <h4 className="font-bold text-slate-900">{matchingRequest.details}</h4>
              <p className="text-slate-500">📍 {matchingRequest.location}</p>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Requested Total</span>
                  <span className="font-bold text-slate-800">
                    {matchingRequest.quantityRequested || matchingRequest.peopleCount} {matchingRequest.unit || 'units'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Already Fulfilled</span>
                  <span className="font-bold text-emerald-700">
                    {matchingRequest.quantityFulfilled || 0} {matchingRequest.unit || 'units'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Remaining Need</span>
                  <span className="font-bold text-red-700">
                    {matchingRequest.remainingQuantity ?? matchingRequest.quantityRequested ?? matchingRequest.peopleCount} {matchingRequest.unit || 'units'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleExecuteAllocation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Compatible Partner Inventory *
                </label>
                <select
                  required
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="">-- Choose Stock Lot --</option>
                  {resources.map((res) => (
                    <option key={res.id} value={res.id} disabled={res.quantity <= 0}>
                      {res.itemName} — {res.quantity} {res.unit} available ({res.partnerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity to Allocate and Dispatch *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityToAllocate}
                  onChange={(e) => setQuantityToAllocate(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Example: 450 available, allocate 50 → Remaining stock will become 400.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMatchingRequest(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMatchingSubmitting || !selectedResourceId}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold px-5 py-2 rounded-xl shadow-xs transition"
                >
                  {isMatchingSubmitting ? 'Allocating...' : 'Confirm Allocation & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TEAM ASSIGNMENT */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 relative">
            <button
              onClick={() => setAssignModalIncident(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base text-slate-900 mb-1">Deploy Response Team</h3>
            <p className="text-xs text-slate-500 mb-4">
              Assign tactical unit to: <strong>{assignModalIncident.title}</strong>
            </p>

            {assignError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                {assignError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">Available Response Units:</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="">-- Choose Unit --</option>
                {responseTeams.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                    disabled={team.status === 'deployed' || team.status === 'on_site'}
                  >
                    {team.name} ({team.agency}) — {team.status === 'deployed' ? 'ALREADY DEPLOYED' : 'AVAILABLE'}
                  </option>
                ))}
              </select>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setAssignModalIncident(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTeam}
                  disabled={!selectedTeamId}
                  className="bg-[#1B4332] hover:bg-[#245740] disabled:bg-slate-300 text-white font-bold px-5 py-2 rounded-xl"
                >
                  Deploy Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD RESPONSE TEAM */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 relative my-8">
            <button
              onClick={() => setIsAddTeamOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Emergency Response Team</h3>
                <p className="text-xs text-slate-500">Register new disaster rescue unit to active operational command</p>
              </div>
            </div>

            {teamFormError && (
              <div className="my-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{teamFormError}</span>
              </div>
            )}

            {teamFormSuccess && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{teamFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddTeamSubmit} className="space-y-3.5 text-xs mt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SDRF Water Rescue Unit 04"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agency / Service</label>
                  <select
                    value={teamAgency}
                    onChange={(e) => setTeamAgency(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="SDRF">SDRF (State Disaster Response)</option>
                    <option value="NDRF">NDRF (National Disaster Response)</option>
                    <option value="Fire & Rescue">Fire & Emergency Services</option>
                    <option value="Medical Corps">Emergency Medical Services</option>
                    <option value="Civil Defence">Civil Defence Volunteers</option>
                    <option value="Police Quick Response">Police Rapid Action Force</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialization / Role</label>
                  <select
                    value={teamType}
                    onChange={(e) => setTeamType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Search & Rescue (USAR)">Search & Rescue (USAR)</option>
                    <option value="Boat & Flood Evacuation">Boat & Flood Evacuation</option>
                    <option value="Emergency Medical Trauma">Emergency Medical Trauma</option>
                    <option value="Logistics & Food Distribution">Logistics & Food Distribution</option>
                    <option value="Firefighting & Hazmat">Firefighting & Hazmat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Team Leader / Officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Insp. Rajesh Sharma"
                    value={teamLeader}
                    onChange={(e) => setTeamLeader(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone (+91) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98490 12345"
                    value={teamPhone}
                    onChange={(e) => setTeamPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Crew Size (Members) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={teamMembersCount}
                    onChange={(e) => setTeamMembersCount(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={teamStatus}
                    onChange={(e) => setTeamStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="available">Available (Ready for Dispatch)</option>
                    <option value="deployed">Deployed</option>
                    <option value="resting">Resting / Standby</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operational Base / Staging Post <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kovvur Barrage Staging Area"
                  value={teamBaseLocation}
                  onChange={(e) => setTeamBaseLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialties & Equipment</label>
                <input
                  type="text"
                  placeholder="e.g. Gemini Inflatable Boats, SCUBA, First Aid"
                  value={teamSpecialties}
                  onChange={(e) => setTeamSpecialties(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTeamOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl shadow-xs transition"
                >
                  Save Response Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
