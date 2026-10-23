import React, { useState } from 'react';
import { useDisaster } from '../state/DisasterContext';
import {
  IncidentType,
  IncidentSeverity,
  AssistanceCategory,
  RequestPriority,
} from '../types/disaster';
import {
  AlertCircle,
  Home,
  Navigation,
  Utensils,
  Wrench,
  Shield,
  ShieldCheck,
  FileCheck,
  CheckSquare,
  Square,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  PlusCircle,
  Info,
  Phone,
  Flame,
  Droplets,
  HeartPulse,
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const {
    citizenAction,
    setCitizenAction,
    incidents,
    shelters,
    assistanceRequests,
    damageReports,
    checklist,
    toggleChecklistItem,
    submitEmergencyReport,
    submitAssistanceRequest,
    submitDamageReport,
    user,
    setIsAuthModalOpen,
  } = useDisaster();

  // Active form feedback
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Form states:
  // 1. Report Emergency Form
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('Flash Flood');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>('high');
  const [peopleTrapped, setPeopleTrapped] = useState<number>(0);
  const [reportedPhone, setReportedPhone] = useState('');

  // 2. Request Assistance Form
  const [reqCategory, setReqCategory] = useState<AssistanceCategory>('food');
  const [reqPriority, setReqPriority] = useState<RequestPriority>('high');
  const [reqPeopleCount, setReqPeopleCount] = useState<number>(2);
  const [reqLocation, setReqLocation] = useState('');
  const [reqDetails, setReqDetails] = useState('');
  const [reqSpecialNeeds, setReqSpecialNeeds] = useState('');
  const [reqPhone, setReqPhone] = useState('');

  // 3. Property Damage Form
  const [damagePropertyType, setDamagePropertyType] = useState<'Residential Home' | 'Commercial Building' | 'Agricultural Crop / Farm' | 'Infrastructure / Road'>('Residential Home');
  const [damageSeverity, setDamageSeverity] = useState<'Minor' | 'Moderate' | 'Severe' | 'Total Destruction'>('Moderate');
  const [damageLocation, setDamageLocation] = useState('');
  const [damageLossInr, setDamageLossInr] = useState('');
  const [isHazard, setIsHazard] = useState(false);
  const [damageDesc, setDamageDesc] = useState('');
  const [damagePhone, setDamagePhone] = useState('');

  // Citizen's requests (privacy filter: if user logged in, match user id/email or show citizen requests)
  const myEmergencyReports = incidents.filter(
    (inc) =>
      (user && inc.reportedBy?.toLowerCase().includes(user.fullName?.toLowerCase())) ||
      inc.reportedBy?.includes('Citizen') ||
      inc.reportedPhone === '+91 97011 88321' ||
      inc.isDemo
  );

  const myAssistanceRequests = assistanceRequests.filter(
    (req) =>
      (user && req.citizenId === user.id) ||
      req.citizenId?.startsWith('CIT-DEMO') ||
      req.citizenName?.includes('Ramana')
  );

  const myDamageReports = damageReports;

  // Handlers
  const handleReportEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle || !incidentLocation || !incidentDescription) return;

    submitEmergencyReport({
      title: incidentTitle,
      type: incidentType,
      location: incidentLocation,
      district: 'East Godavari Simulation Sector',
      lat: 16.989 + (Math.random() - 0.5) * 0.03,
      lng: 81.784 + (Math.random() - 0.5) * 0.03,
      severity: incidentSeverity,
      description: incidentDescription,
      reportedBy: user ? user.fullName : 'Verified Citizen',
      reportedPhone: reportedPhone || '+91 98000 12345',
      peopleTrapped,
      casualties: 0,
    });

    setSuccessFeedback('Emergency report submitted successfully. It has been routed to the Authority Verification Queue.');
    setIncidentTitle('');
    setIncidentLocation('');
    setIncidentDescription('');
    setPeopleTrapped(0);
    setTimeout(() => {
      setSuccessFeedback(null);
      setCitizenAction('my_requests');
    }, 1500);
  };

  const handleRequestAssistance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqLocation || !reqDetails) return;

    submitAssistanceRequest({
      citizenName: user ? user.fullName : 'Citizen Applicant',
      citizenId: user ? user.id : 'CIT-CURRENT',
      phone: reqPhone || '+91 98480 99887',
      category: reqCategory,
      priority: reqPriority,
      peopleCount: reqPeopleCount,
      location: reqLocation,
      district: 'East Godavari Simulation Sector',
      lat: 16.985 + (Math.random() - 0.5) * 0.02,
      lng: 81.782 + (Math.random() - 0.5) * 0.02,
      details: reqDetails,
      specialNeeds: reqSpecialNeeds,
    });

    setSuccessFeedback('Assistance request recorded! Your tracking ID is now active in My Requests.');
    setReqLocation('');
    setReqDetails('');
    setReqSpecialNeeds('');
    setTimeout(() => {
      setSuccessFeedback(null);
      setCitizenAction('my_requests');
    }, 1500);
  };

  const handleReportDamage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!damageLocation || !damageDesc) return;

    submitDamageReport({
      citizenName: user ? user.fullName : 'Property Claimant',
      citizenId: user ? user.id : 'CIT-CURRENT',
      phone: damagePhone || '+91 97000 22334',
      propertyType: damagePropertyType,
      damageSeverity,
      location: damageLocation,
      district: 'East Godavari Simulation Sector',
      lat: 16.98 + (Math.random() - 0.5) * 0.02,
      lng: 81.78 + (Math.random() - 0.5) * 0.02,
      estimatedLossInr: damageLossInr || 'Under Assessment',
      isStructuralHazard: isHazard,
      description: damageDesc,
    });

    setSuccessFeedback('Property damage assessment submitted for revenue survey review.');
    setDamageLocation('');
    setDamageDesc('');
    setDamageLossInr('');
    setTimeout(() => {
      setSuccessFeedback(null);
      setCitizenAction('my_requests');
    }, 1500);
  };

  // Six primary action card definitions
  const sixPrimaryActionCards = [
    {
      id: 'report_emergency',
      title: 'Report an Emergency',
      description: 'Report flash floods, rising water, trapped residents, or life-safety emergencies directly to responders.',
      icon: AlertCircle,
      iconBg: 'bg-red-50 text-red-600 border border-red-200',
      badge: 'URGENT DISPATCH',
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      id: 'find_shelter',
      title: 'Find Safe Shelter',
      description: 'Locate designated government relief camps, model schools, indoor stadiums, and verified safe buildings.',
      icon: Home,
      iconBg: 'bg-sky-50 text-sky-700 border border-sky-200',
      badge: `${shelters.length} ACTIVE CAMPS`,
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'evacuation_guidance',
      title: 'View Evacuation Guidance',
      description: 'Official flood route safety protocols, high-ground staging zones, and electrical safety advisories.',
      icon: Navigation,
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      badge: 'SAFETY PROTOCOLS',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'request_help',
      title: 'Request Food / Water / Medical Help',
      description: 'Submit urgent requirements for drinking water, dry rations, infant formula, or prescription medicines.',
      icon: Utensils,
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
      badge: 'RELIEF ALLOCATION',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'report_damage',
      title: 'Report Property Damage',
      description: 'Register damage to residential houses, agricultural crops, or shops for official relief compensation surveys.',
      icon: Wrench,
      iconBg: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      badge: 'GOVT REVENUE SURVEY',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'safety_guidance',
      title: 'Family & Personal Safety',
      description: 'Family emergency meeting plans, vulnerable member safe registration, and reunification guidance.',
      icon: Shield,
      iconBg: 'bg-teal-50 text-teal-700 border border-teal-200',
      badge: 'PREPAREDNESS SUPPORT',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Citizen Portal Top Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">
              CITIZEN PORTAL
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Public Self-Service & Safety</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5">
            Emergency Assistance & Preparedness Dashboard
          </h1>
        </div>

        {/* Action Toggle Switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCitizenAction('main')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              citizenAction === 'main'
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Service Cards
          </button>
          <button
            onClick={() => setCitizenAction('my_requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              citizenAction === 'my_requests'
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Requests ({myAssistanceRequests.length + myEmergencyReports.length})</span>
          </button>
          <button
            onClick={() => setCitizenAction('checklist')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              citizenAction === 'checklist'
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Preparedness Checklist</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* VIEW 1: THE EXACT SIX PRIMARY ACTION CARDS */}
      {citizenAction === 'main' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold">Citizen Emergency Services:</span> Select an option below to initiate a request or browse verified safety guidance.
              </div>
            </div>
            {!user && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-semibold underline text-emerald-800 hover:text-emerald-950"
              >
                Sign In to auto-save profile details
              </button>
            )}
          </div>

          {/* EXACTLY SIX CARDS ARRANGED IN A RESPONSIVE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sixPrimaryActionCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => setCitizenAction(card.id as any)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition">
                      {card.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:text-emerald-950">
                    <span>Open Service</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ACTION FORM — REPORT AN EMERGENCY */}
      {citizenAction === 'report_emergency' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
          <button
            onClick={() => setCitizenAction('main')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Services</span>
          </button>

          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Report an Emergency Incident</h2>
              <p className="text-xs text-slate-500">
                Community submissions are reviewed by authorized responders before official dispatch.
              </p>
            </div>
          </div>

          <form onSubmit={handleReportEmergency} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Incident Headline / Summary *</label>
              <input
                type="text"
                required
                value={incidentTitle}
                onChange={(e) => setIncidentTitle(e.target.value)}
                placeholder="e.g. Flash flood overflowing canal into residential street"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-red-600 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Incident Category *</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-red-600 focus:bg-white"
                >
                  <option value="Flash Flood">Flash Flood</option>
                  <option value="Severe Waterlogging">Severe Waterlogging</option>
                  <option value="Trapped Persons / Rescue Required">Trapped Persons / Rescue</option>
                  <option value="Structural Collapse / Damage">Structural Collapse / Damage</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Landslide">Landslide</option>
                  <option value="Electrical / Grid Hazard">Electrical Hazard</option>
                  <option value="Cyclone / High Winds">Cyclone / High Winds</option>
                  <option value="Fire Outbreak">Fire Outbreak</option>
                  <option value="Other Emergency">Other Emergency</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Severity *</label>
                <select
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-red-600 focus:bg-white"
                >
                  <option value="critical">Critical (Immediate Life Danger)</option>
                  <option value="high">High (Fast Escalating)</option>
                  <option value="moderate">Moderate (Hazard / Inconvenience)</option>
                  <option value="low">Low (Precautionary)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Exact Location / Landmark *</label>
                <input
                  type="text"
                  required
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="e.g. Ward 4, Canal Bund Rd near High School"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-red-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">People Trapped / Awaiting Rescue</label>
                <input
                  type="number"
                  min="0"
                  value={peopleTrapped}
                  onChange={(e) => setPeopleTrapped(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-red-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                required
                rows={3}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Describe current water depth, flow speed, landmarks, vulnerable people, or urgent assistance needs..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-red-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
              <input
                type="tel"
                value={reportedPhone}
                onChange={(e) => setReportedPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-red-600 focus:bg-white"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/20 transition"
              >
                Submit Emergency Report for Authority Verification
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: FIND SAFE SHELTER */}
      {citizenAction === 'find_shelter' && (
        <div className="space-y-4">
          <button
            onClick={() => setCitizenAction('main')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Services</span>
          </button>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Verified Relief Shelters & Safe Camps</h2>
            <p className="text-xs text-slate-500 mb-6">
              Official shelters with clean potable water, kitchen facilities, medical booths, and high-ground protection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shelters.map((shelter) => (
                <div
                  key={shelter.id}
                  className="bg-slate-50/60 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold font-mono text-slate-500">{shelter.id}</span>
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

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{shelter.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{shelter.address}</span>
                    </p>

                    {/* Occupancy bar */}
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Capacity: {shelter.capacity}</span>
                        <span>Occupied: {shelter.currentOccupancy} ({shelter.capacity - shelter.currentOccupancy} free)</span>
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

                    {/* Facilities Pills */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {shelter.facilities.map((fac, i) => (
                        <span key={i} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Contact Officer</span>
                      <span className="font-medium text-slate-800">{shelter.contactPerson}</span>
                    </div>
                    <a
                      href={`tel:${shelter.contactPhone}`}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Call Camp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: VIEW EVACUATION GUIDANCE */}
      {citizenAction === 'evacuation_guidance' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <button
            onClick={() => setCitizenAction('main')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Services</span>
          </button>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-bold font-mono text-emerald-800 uppercase tracking-wider">
                SAFETY & EVACUATION PROTOCOLS
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Official Flood Safety Guidelines</h2>
              <p className="text-xs text-slate-500">
                Follow these protocols to safely evacuate and avoid hazardous floodwater currents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-xs text-red-950 space-y-2">
                <h3 className="font-bold text-red-900 text-sm flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  What NOT to Do During Floods
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-red-900/90 leading-relaxed">
                  <li><strong>Never walk through moving water:</strong> Fast-moving water just 15cm deep can sweep an adult off their feet.</li>
                  <li><strong>Do not drive over submerged causeways:</strong> Water hides washed-out roadbeds and culverts.</li>
                  <li><strong>Avoid downed power cables:</strong> Live electrical wires in standing water create fatal shock zones.</li>
                  <li><strong>Do not consume raw tap water:</strong> Sewage backflow contaminates water table pipelines.</li>
                </ul>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-950 space-y-2">
                <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Recommended Evacuation Steps
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-emerald-900/90 leading-relaxed">
                  <li><strong>Switch off main circuit breaker</strong> and gas valve before leaving the premises.</li>
                  <li><strong>Pack critical documents</strong> (Aadhaar, property deed, bank records) in waterproof ziplock bags.</li>
                  <li><strong>Wear sturdy footwear</strong> to protect feet from submerged debris, snakes, or glass.</li>
                  <li><strong>Follow official designated high-elevation routes</strong> to your assigned relief shelter.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: REQUEST FOOD / WATER / MEDICAL HELP */}
      {citizenAction === 'request_help' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
          <button
            onClick={() => setCitizenAction('main')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Services</span>
          </button>

          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Request Relief Assistance</h2>
              <p className="text-xs text-slate-500">
                Your request is directly visible to disaster authorities and accredited relief partners for supply dispatch.
              </p>
            </div>
          </div>

          <form onSubmit={handleRequestAssistance} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assistance Category *</label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                >
                  <option value="food">Ready-to-Eat Food / Rations</option>
                  <option value="water">Potable Drinking Water</option>
                  <option value="medical">Medical Supplies / Prescriptions</option>
                  <option value="clothing">Blankets & Dry Clothing</option>
                  <option value="rescue">Boat Pickup / Evacuation Assist</option>
                  <option value="shelter">Emergency Camp Placement</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Urgency Priority *</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                >
                  <option value="urgent">Urgent (Immediate Need)</option>
                  <option value="high">High (Needed within 4 hours)</option>
                  <option value="medium">Medium (Needed today)</option>
                  <option value="low">Low (Replenishment)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of People Affected *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reqPeopleCount}
                  onChange={(e) => setReqPeopleCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={reqPhone}
                  onChange={(e) => setReqPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Exact Location / Stranded Address *</label>
              <input
                type="text"
                required
                value={reqLocation}
                onChange={(e) => setReqLocation(e.target.value)}
                placeholder="e.g. Terrace of House 42, Weavers Colony, Ward 9"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Specific Details & Quantity *</label>
              <textarea
                required
                rows={3}
                value={reqDetails}
                onChange={(e) => setReqDetails(e.target.value)}
                placeholder="Explain what items are needed, current water access, or condition of stranded individuals..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vulnerable Needs (Infants, Elderly, Diabetes, Pregnancy)</label>
              <input
                type="text"
                value={reqSpecialNeeds}
                onChange={(e) => setReqSpecialNeeds(e.target.value)}
                placeholder="e.g. 1 baby formula needed, 1 insulin patient"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#245740] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition"
              >
                Submit Assistance Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 6: REPORT PROPERTY DAMAGE */}
      {citizenAction === 'report_damage' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
          <button
            onClick={() => setCitizenAction('main')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Services</span>
          </button>

          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Report Property or Crop Damage</h2>
              <p className="text-xs text-slate-500">
                Submit damage claims for state government revenue survey verification and compensation schemes.
              </p>
            </div>
          </div>

          <form onSubmit={handleReportDamage} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Type *</label>
                <select
                  value={damagePropertyType}
                  onChange={(e) => setDamagePropertyType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  <option value="Residential Home">Residential Home / Hut</option>
                  <option value="Agricultural Crop / Farm">Agricultural Crop / Farm Field</option>
                  <option value="Commercial Building">Commercial Shop / Store</option>
                  <option value="Infrastructure / Road">Local Boundary Wall / Borewell</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Severity of Damage *</label>
                <select
                  value={damageSeverity}
                  onChange={(e) => setDamageSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  <option value="Total Destruction">Total Destruction (Collapsed / Scoured)</option>
                  <option value="Severe">Severe (Structural Cracks / Submerged)</option>
                  <option value="Moderate">Moderate (Inventory / Waterlogged)</option>
                  <option value="Minor">Minor (Wall Plaster / Roof Tiles)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location / Survey / Plot Number *</label>
              <input
                type="text"
                required
                value={damageLocation}
                onChange={(e) => setDamageLocation(e.target.value)}
                placeholder="e.g. Survey No. 128, Kadiyam Mandal / Plot 14, Main Road"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Financial Loss (INR)</label>
                <input
                  type="text"
                  value={damageLossInr}
                  onChange={(e) => setDamageLossInr(e.target.value)}
                  placeholder="e.g. ₹ 2,50,000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={damagePhone}
                  onChange={(e) => setDamagePhone(e.target.value)}
                  placeholder="+91 97XXX XXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="hazard"
                checked={isHazard}
                onChange={(e) => setIsHazard(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="hazard" className="text-xs font-semibold text-red-700 cursor-pointer">
                Immediate Structural Hazard: Risk of sudden wall or ceiling collapse
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Damage Description *</label>
              <textarea
                required
                rows={3}
                value={damageDesc}
                onChange={(e) => setDamageDesc(e.target.value)}
                placeholder="Explain the extent of inundation, wall scouring, loss of crops or equipment..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/20 transition"
              >
                Submit Damage Survey Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 7: FAMILY & PERSONAL SAFETY */}
      {citizenAction === 'safety_guidance' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <button
            onClick={() => setCitizenAction('main')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Services</span>
          </button>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-bold font-mono text-teal-800 uppercase tracking-wider">
                PERSONAL & COMMUNITY SAFETY
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Family Emergency Action Plan</h2>
              <p className="text-xs text-slate-500">
                Practical preparedness steps to protect vulnerable family members and ensure reunification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-xs">Pre-Identified Meeting Place</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Designate an elevated, recognizable landmark outside your flood zone (e.g., Zilla Parishad High School or Community Hall) where family members meet if separated.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-xs">Out-of-District Contact</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Memorize one relative's phone number located outside the disaster district. During local tower congestion, long-distance SMS text messages are more likely to transmit.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="h-8 w-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-xs">Elderly & Infant Safeguards</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fasten an identification tag or wristband with emergency contact details and medical conditions on children, seniors, and persons with disabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 8: MY REQUESTS (CITIZEN TRACKING AREA) */}
      {citizenAction === 'my_requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Requests & Emergency Reports</h2>
              <p className="text-xs text-slate-500">
                Track live verification status, assigned responder teams, and fulfillment updates for your submissions.
              </p>
            </div>
            <button
              onClick={() => setCitizenAction('main')}
              className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>+ New Submission</span>
            </button>
          </div>

          {/* Section 1: Assistance Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              Relief Assistance Submissions ({myAssistanceRequests.length})
            </h3>

            {myAssistanceRequests.length > 0 ? (
              <div className="space-y-3">
                {myAssistanceRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{req.id}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {req.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            req.status === 'fulfilled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'matched'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Status: {req.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{req.details}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{req.location} ({req.peopleCount} people affected)</span>
                      </p>

                      {req.fulfilledBy && (
                        <div className="text-xs text-emerald-800 font-semibold pt-1">
                          Fulfilled / Committed by: {req.fulfilledBy}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      <span>Submitted: {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Assistance Requests Submitted</p>
                <p className="mt-0.5">You have not submitted any food, water, or medical requests yet.</p>
                <button
                  onClick={() => setCitizenAction('request_help')}
                  className="mt-3 px-3 py-1.5 bg-[#1B4332] text-white rounded-xl text-xs font-semibold"
                >
                  Request Help Now
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Emergency Incident Reports */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              Emergency Incident Submissions ({myEmergencyReports.length})
            </h3>

            {myEmergencyReports.length > 0 ? (
              <div className="space-y-3">
                {myEmergencyReports.map((inc) => (
                  <div
                    key={inc.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{inc.id}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {inc.type}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            inc.status === 'verified' || inc.status === 'in_progress'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inc.status === 'rejected'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Status: {inc.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{inc.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{inc.location}</span>
                      </p>

                      {inc.assignedTeamName && (
                        <div className="text-xs text-emerald-800 font-semibold pt-1">
                          Dispatched Team: {inc.assignedTeamName}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      <span>Reported: {new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Emergency Incident Reports</p>
                <p className="mt-0.5">You have not reported any flood or life-safety emergencies.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 9: PREPAREDNESS CHECKLIST (MOVED FROM HOME) */}
      {citizenAction === 'checklist' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <button
            onClick={() => setCitizenAction('main')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Citizen Services</span>
          </button>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold font-mono text-emerald-800 uppercase tracking-wider">
                  CITIZEN READINESS
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Disaster Preparedness Checklist</h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-800">
                  {checklist.filter((c) => c.completed).length} of {checklist.length} Complete
                </span>
              </div>
            </div>

            {/* Checklist Progress Bar */}
            <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((checklist.filter((c) => c.completed).length / checklist.length) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Review and mark items as you assemble your household emergency supply kit. Your progress is saved automatically.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  item.completed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="mt-0.5 text-emerald-700 shrink-0">
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`text-xs font-bold ${item.completed ? 'text-emerald-950 line-through opacity-80' : 'text-slate-900'}`}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
