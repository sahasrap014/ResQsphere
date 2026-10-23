import React, { useState } from 'react';
import { useDisaster } from '../state/DisasterContext';
import {
  IncidentType,
  IncidentSeverity,
  AssistanceCategory,
  RequestPriority,
} from '../types/disaster';
import { validateIndianMobile } from '../utils/phoneValidation';
import {
  geocodeLocation,
  validateCoordinates,
  GeocodingResult,
} from '../services/geocodingService';
import {
  AlertCircle,
  Home,
  Utensils,
  Wrench,
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
  AlertTriangle,
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
    mode,
    userLocation,
  } = useDisaster();

  // Active form feedback & validation errors
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Report Emergency Form & Geocoding Verification
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('Flash Flood');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>('high');
  const [peopleTrapped, setPeopleTrapped] = useState<number>(0);
  const [reportedPhone, setReportedPhone] = useState(user?.phone || '');

  // Geocoding & coordinate verification states (Requirement 3: Location Entry & Disambiguation)
  const [resolvedLat, setResolvedLat] = useState<number | null>(null);
  const [resolvedLng, setResolvedLng] = useState<number | null>(null);
  const [resolvedDistrict, setResolvedDistrict] = useState<string | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'searching' | 'resolved' | 'ambiguous' | 'failed'>('idle');
  const [candidateLocations, setCandidateLocations] = useState<GeocodingResult[]>([]);
  const [manualCoordinatesMode, setManualCoordinatesMode] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // 2. Request Assistance Form
  const [reqCategory, setReqCategory] = useState<AssistanceCategory>('food');
  const [reqPriority, setReqPriority] = useState<RequestPriority>('high');
  const [reqPeopleCount, setReqPeopleCount] = useState<number>(2);
  const [reqLocation, setReqLocation] = useState('');
  const [reqDetails, setReqDetails] = useState('');
  const [reqSpecialNeeds, setReqSpecialNeeds] = useState('');
  const [reqPhone, setReqPhone] = useState(user?.phone || '');
  const [reqLat, setReqLat] = useState<number | null>(null);
  const [reqLng, setReqLng] = useState<number | null>(null);
  const [reqDistrict, setReqDistrict] = useState<string | null>(null);
  const [reqGeocodingStatus, setReqGeocodingStatus] = useState<'idle' | 'searching' | 'resolved' | 'ambiguous' | 'failed'>('idle');
  const [reqCandidates, setReqCandidates] = useState<GeocodingResult[]>([]);

  // 3. Property Damage Form
  const [damagePropertyType, setDamagePropertyType] = useState<
    'Residential Home' | 'Commercial Building' | 'Agricultural Crop / Farm' | 'Infrastructure / Road'
  >('Residential Home');
  const [damageSeverity, setDamageSeverity] = useState<'Minor' | 'Moderate' | 'Severe' | 'Total Destruction'>('Moderate');
  const [damageLocation, setDamageLocation] = useState('');
  const [damageLossInr, setDamageLossInr] = useState('');
  const [isHazard, setIsHazard] = useState(false);
  const [damageDesc, setDamageDesc] = useState('');
  const [damagePhone, setDamagePhone] = useState(user?.phone || '');

  // Geocoding resolvers
  const handleResolveIncidentLocation = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : incidentLocation).trim();
    if (!q || q.length < 2) return;
    setGeocodingStatus('searching');
    setFormError(null);
    try {
      const res = await geocodeLocation(q);
      if (res.results.length === 1 || (res.results.length > 0 && res.results[0].isExact)) {
        const top = res.results[0];
        setResolvedLat(top.lat);
        setResolvedLng(top.lng);
        setResolvedDistrict(top.district);
        setIncidentLocation(top.displayName);
        setGeocodingStatus('resolved');
        setCandidateLocations([]);
      } else if (res.results.length > 1) {
        setCandidateLocations(res.results);
        setGeocodingStatus('ambiguous');
      } else {
        setGeocodingStatus('failed');
      }
    } catch {
      setGeocodingStatus('failed');
    }
  };

  const handleResolveReqLocation = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : reqLocation).trim();
    if (!q || q.length < 2) return;
    setReqGeocodingStatus('searching');
    try {
      const res = await geocodeLocation(q);
      if (res.results.length === 1 || (res.results.length > 0 && res.results[0].isExact)) {
        const top = res.results[0];
        setReqLat(top.lat);
        setReqLng(top.lng);
        setReqDistrict(top.district);
        setReqLocation(top.displayName);
        setReqGeocodingStatus('resolved');
        setReqCandidates([]);
      } else if (res.results.length > 1) {
        setReqCandidates(res.results);
        setReqGeocodingStatus('ambiguous');
      } else {
        setReqGeocodingStatus('failed');
      }
    } catch {
      setReqGeocodingStatus('failed');
    }
  };

  // Privacy-filtered Citizen submissions (Section 5: Persistent per Citizen)
  const myEmergencyReports = mode === 'demo'
    ? incidents.filter((inc) => inc.isDemo)
    : incidents.filter((inc) => user && (inc.reportedBy?.toLowerCase().includes(user.fullName?.toLowerCase()) || (inc as any).citizen_id === user.id));

  const myAssistanceRequests = mode === 'demo'
    ? assistanceRequests.filter((req) => req.isDemo)
    : assistanceRequests.filter((req) => user && (req.citizenId === user.id || (req as any).citizen_id === user.id));

  const myDamageReports = damageReports;

  // Handlers with Indian Mobile Validation & Geocoded Coordinates Resolution
  const handleReportEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!incidentTitle || !incidentLocation || !incidentDescription) return;

    const phoneToCheck = reportedPhone || user?.phone || '';
    const phoneVal = validateIndianMobile(phoneToCheck);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number.');
      return;
    }

    let targetLat: number;
    let targetLng: number;
    let targetDistrict: string = 'General Sector';

    if (manualCoordinatesMode) {
      const latNum = parseFloat(manualLat);
      const lngNum = parseFloat(manualLng);
      const val = validateCoordinates(latNum, lngNum);
      if (!val.isValid) {
        setFormError(val.error || 'Please enter valid Indian coordinates (Lat 6°–38°N, Lng 68°–98°E).');
        return;
      }
      targetLat = latNum;
      targetLng = lngNum;
    } else if (resolvedLat !== null && resolvedLng !== null) {
      targetLat = resolvedLat;
      targetLng = resolvedLng;
      targetDistrict = resolvedDistrict || 'General Sector';
    } else {
      // Resolve coordinates from location string
      const geo = await geocodeLocation(incidentLocation);
      if (geo.results.length === 1 || (geo.results.length > 0 && geo.results[0].isExact)) {
        targetLat = geo.results[0].lat;
        targetLng = geo.results[0].lng;
        targetDistrict = geo.results[0].district;
      } else if (geo.results.length > 1) {
        setCandidateLocations(geo.results);
        setGeocodingStatus('ambiguous');
        setFormError(`Multiple locations matched "${incidentLocation}". Please select your exact location from the suggestions below.`);
        return;
      } else {
        setGeocodingStatus('failed');
        setFormError(`Could not verify geographical coordinates for "${incidentLocation}". Please select from suggestions or enter coordinates manually.`);
        setManualCoordinatesMode(true);
        return;
      }
    }

    const finalCoordVal = validateCoordinates(targetLat, targetLng);
    if (!finalCoordVal.isValid) {
      setFormError(finalCoordVal.error || 'Coordinates must be valid Indian geographical coordinates.');
      return;
    }

    submitEmergencyReport({
      title: incidentTitle,
      type: incidentType,
      location: incidentLocation,
      district: targetDistrict,
      lat: Number(targetLat.toFixed(4)),
      lng: Number(targetLng.toFixed(4)),
      severity: incidentSeverity,
      description: incidentDescription,
      reportedBy: user ? user.fullName : 'Verified Citizen',
      reportedPhone: phoneVal.normalized,
      peopleTrapped,
      casualties: 0,
    });

    setSuccessFeedback(`Emergency report submitted with verified coordinates (${targetLat.toFixed(4)}°N, ${targetLng.toFixed(4)}°E). Routed to Authority Verification Queue.`);
    setIncidentTitle('');
    setIncidentLocation('');
    setIncidentDescription('');
    setPeopleTrapped(0);
    setResolvedLat(null);
    setResolvedLng(null);
    setGeocodingStatus('idle');
    setTimeout(() => {
      setSuccessFeedback(null);
      setCitizenAction('my_requests');
    }, 1500);
  };

  const handleRequestAssistance = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!reqLocation || !reqDetails) return;

    const phoneToCheck = reqPhone || user?.phone || '';
    const phoneVal = validateIndianMobile(phoneToCheck);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number.');
      return;
    }

    let targetLat: number;
    let targetLng: number;
    let targetDistrict: string = 'General Sector';

    if (reqLat !== null && reqLng !== null) {
      targetLat = reqLat;
      targetLng = reqLng;
      targetDistrict = reqDistrict || 'General Sector';
    } else {
      const geo = await geocodeLocation(reqLocation);
      if (geo.results.length > 0) {
        targetLat = geo.results[0].lat;
        targetLng = geo.results[0].lng;
        targetDistrict = geo.results[0].district;
      } else {
        targetLat = mode === 'demo' ? 16.985 : (userLocation.lat || 16.985);
        targetLng = mode === 'demo' ? 81.782 : (userLocation.lng || 81.782);
        targetDistrict = userLocation.district || 'General Sector';
      }
    }

    submitAssistanceRequest({
      citizenName: user ? user.fullName : 'Citizen Applicant',
      citizenId: user ? user.id : 'CIT-CURRENT',
      phone: phoneVal.normalized,
      category: reqCategory,
      priority: reqPriority,
      peopleCount: reqPeopleCount,
      quantityRequested: reqPeopleCount * 2,
      location: reqLocation,
      district: targetDistrict,
      lat: Number(targetLat.toFixed(4)),
      lng: Number(targetLng.toFixed(4)),
      details: reqDetails,
      specialNeeds: reqSpecialNeeds,
    });

    setSuccessFeedback('Assistance request recorded! Your tracking ID is now active in My Requests.');
    setReqLocation('');
    setReqDetails('');
    setReqSpecialNeeds('');
    setReqLat(null);
    setReqLng(null);
    setReqGeocodingStatus('idle');
    setTimeout(() => {
      setSuccessFeedback(null);
      setCitizenAction('my_requests');
    }, 1500);
  };

  const handleReportDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!damageLocation || !damageDesc) return;

    const phoneToCheck = damagePhone || user?.phone || '';
    const phoneVal = validateIndianMobile(phoneToCheck);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number.');
      return;
    }

    let targetLat = mode === 'demo' ? 16.98 : (userLocation.lat || 16.98);
    let targetLng = mode === 'demo' ? 81.78 : (userLocation.lng || 81.78);
    let targetDistrict = userLocation.district || 'East Godavari Simulation Sector';

    try {
      const geo = await geocodeLocation(damageLocation);
      if (geo.results.length > 0) {
        targetLat = geo.results[0].lat;
        targetLng = geo.results[0].lng;
        targetDistrict = geo.results[0].district;
      }
    } catch {}

    submitDamageReport({
      citizenName: user ? user.fullName : 'Property Claimant',
      citizenId: user ? user.id : 'CIT-CURRENT',
      phone: phoneVal.normalized,
      propertyType: damagePropertyType,
      damageSeverity,
      location: damageLocation,
      district: targetDistrict,
      lat: Number(targetLat.toFixed(4)),
      lng: Number(targetLng.toFixed(4)),
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

  // Requirement 4: EXACTLY FOUR PRIMARY ACTION CARDS
  // (Family & Personal Safety and View Evacuation Guidance have been completely removed)
  const fourPrimaryActionCards = [
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
            <span className="text-xs text-slate-500">ResQsphere Public Self-Service</span>
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

      {/* Notifications */}
      {successFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* VIEW 1: THE EXACT FOUR PRIMARY ACTION CARDS */}
      {citizenAction === 'main' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold">Citizen Emergency Services:</span> Select an option below to initiate an urgent request or find designated safe shelter.
              </div>
            </div>
            {!user && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-semibold underline text-emerald-800 hover:text-emerald-950"
              >
                Sign In to track your requests
              </button>
            )}
          </div>

          {/* EXACTLY FOUR CARDS IN RESPONSIVE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {fourPrimaryActionCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => setCitizenAction(card.id as any)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                      >
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Category *</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs bg-white"
                >
                  <option value="Flash Flood">Flash Flood</option>
                  <option value="Severe Waterlogging">Severe Waterlogging</option>
                  <option value="Structural Collapse / Damage">Structural Collapse / Damage</option>
                  <option value="Trapped Persons / Rescue Required">Trapped Persons / Rescue Required</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Electrical / Grid Hazard">Electrical / Grid Hazard</option>
                  <option value="Cyclone / High Winds">Cyclone / High Winds</option>
                  <option value="Other Emergency">Other Emergency</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perceived Urgency / Severity *</label>
                <select
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value as IncidentSeverity)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs bg-white"
                >
                  <option value="critical">Critical — Immediate Threat to Life</option>
                  <option value="high">High — Rapidly Worsening / Rescue Needed</option>
                  <option value="moderate">Moderate — Evacuation Advised</option>
                  <option value="low">Low — Localized Inconvenience</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Specific Location / Landmark *</label>
                  <button
                    type="button"
                    onClick={() => handleResolveIncidentLocation()}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Verify Geocoding</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={incidentLocation}
                  onChange={(e) => {
                    setIncidentLocation(e.target.value);
                    if (resolvedLat !== null) {
                      setResolvedLat(null);
                      setResolvedLng(null);
                      setGeocodingStatus('idle');
                    }
                  }}
                  onBlur={() => {
                    if (incidentLocation.trim().length >= 3 && geocodingStatus === 'idle') {
                      handleResolveIncidentLocation();
                    }
                  }}
                  placeholder="e.g. Hyderabad, Chennai, Kovvur Bund Rd, or Visakhapatnam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />

                {/* Geocoding Resolution Feedback */}
                {geocodingStatus === 'searching' && (
                  <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3 h-3" />
                    <span>Resolving geographical coordinates...</span>
                  </div>
                )}

                {resolvedLat !== null && resolvedLng !== null && (
                  <div className="mt-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Verified: <strong>{resolvedLat.toFixed(4)}°N, {resolvedLng.toFixed(4)}°E</strong> ({resolvedDistrict})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualCoordinatesMode(true)}
                      className="text-emerald-800 underline text-[10px] font-medium"
                    >
                      Edit Pin
                    </button>
                  </div>
                )}

                {/* Ambiguous Location Selection */}
                {geocodingStatus === 'ambiguous' && candidateLocations.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                    <div className="font-semibold text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Ambiguous Location. Please select exact administrative area:</span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {candidateLocations.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setResolvedLat(c.lat);
                            setResolvedLng(c.lng);
                            setResolvedDistrict(c.district);
                            setIncidentLocation(c.displayName);
                            setGeocodingStatus('resolved');
                            setCandidateLocations([]);
                          }}
                          className="w-full text-left p-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-100/60 text-slate-800 text-[11px] flex items-center justify-between transition"
                        >
                          <span className="truncate pr-2">{c.displayName}</span>
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">
                            {c.lat.toFixed(4)}°N, {c.lng.toFixed(4)}°E
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Coordinates Override */}
                {manualCoordinatesMode && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Manual Coordinate Entry (India Bounds: 6°–38°N, 68°–98°E)</span>
                      <button
                        type="button"
                        onClick={() => setManualCoordinatesMode(false)}
                        className="text-slate-500 hover:text-slate-800 font-normal text-[10px]"
                      >
                        Auto-resolve
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Latitude (°N)</label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="17.3850"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Longitude (°E)</label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="78.4867"
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Mobile Number (10-Digit Indian Mobile) *
                </label>
                <input
                  type="tel"
                  required
                  value={reportedPhone}
                  onChange={(e) => setReportedPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number of People Trapped or Cut Off</label>
              <input
                type="number"
                min="0"
                value={peopleTrapped}
                onChange={(e) => setPeopleTrapped(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Situation Description *</label>
              <textarea
                required
                rows={4}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Describe water depth, current speed, presence of children or elderly citizens, and safest access route."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCitizenAction('main')}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition"
              >
                Transmit Emergency Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: FIND SAFE SHELTER */}
      {citizenAction === 'find_shelter' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCitizenAction('main')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Citizen Services</span>
            </button>
            <span className="text-xs text-slate-500">{shelters.length} Designated Evacuation Safe Centers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shelters.map((shelter) => {
              const occupancyPct = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
              const isFull = shelter.status === 'full' || occupancyPct >= 100;
              return (
                <div
                  key={shelter.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-red-100 text-red-800'
                            : shelter.status === 'near_capacity'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isFull ? 'CAMP FULL' : shelter.status === 'near_capacity' ? 'NEAR CAPACITY' : 'SPACE AVAILABLE'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {shelter.currentOccupancy}/{shelter.capacity}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{shelter.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{shelter.address}</span>
                    </p>

                    {/* Occupancy bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Current Occupancy</span>
                        <span className="font-semibold text-slate-700">{occupancyPct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyPct >= 90 ? 'bg-red-600' : occupancyPct >= 75 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, occupancyPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Facilities badges */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {shelter.facilities.map((fac, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Camp Contact</span>
                      <span className="font-medium text-slate-700">{shelter.contactPerson}</span>
                    </div>
                    <a
                      href={`tel:${shelter.contactPhone}`}
                      className="inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{shelter.contactPhone}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: REQUEST FOOD / WATER / MEDICAL HELP */}
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
              <h2 className="text-lg font-bold text-slate-900">Request Relief Supplies & Assistance</h2>
              <p className="text-xs text-slate-500">
                Directly matches with registered NGOs, Civil Supplies, and community relief kitchens.
              </p>
            </div>
          </div>

          <form onSubmit={handleRequestAssistance} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relief Category *</label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as AssistanceCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs bg-white"
                >
                  <option value="food">Ready-to-Eat Food / Dry Rations</option>
                  <option value="water">Potable Drinking Water (Cans / Tankers)</option>
                  <option value="medical">Prescription Medicines / First Aid / Insulin</option>
                  <option value="clothing">Blankets / Dry Clothing / Tarpaulins</option>
                  <option value="sanitation">Sanitary Napkins / Chlorine Tablets / Soap</option>
                  <option value="shelter">Emergency Safe Shelter Space</option>
                  <option value="rescue">Evacuation Boat Transport</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Urgency Priority *</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value as RequestPriority)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs bg-white"
                >
                  <option value="urgent">Urgent — Severe Deprivation Within 6 Hours</option>
                  <option value="high">High — Needed Today</option>
                  <option value="medium">Medium — Supplies Low for Tomorrow</option>
                  <option value="low">Low — General Relief Request</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of People in Need *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reqPeopleCount}
                  onChange={(e) => setReqPeopleCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Mobile Number (10-Digit Indian Mobile) *
                </label>
                <input
                  type="tel"
                  required
                  value={reqPhone}
                  onChange={(e) => setReqPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Delivery / Staging Location *</label>
                <button
                  type="button"
                  onClick={() => handleResolveReqLocation()}
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Verify Location</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={reqLocation}
                onChange={(e) => {
                  setReqLocation(e.target.value);
                  if (reqLat !== null) {
                    setReqLat(null);
                    setReqLng(null);
                    setReqGeocodingStatus('idle');
                  }
                }}
                onBlur={() => {
                  if (reqLocation.trim().length >= 3 && reqGeocodingStatus === 'idle') {
                    handleResolveReqLocation();
                  }
                }}
                placeholder="e.g. Rajahmundry, Kovvur, or Visakhapatnam Sector"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />

              {reqLat !== null && reqLng !== null && (
                <div className="mt-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Location Verified: <strong>{reqLat.toFixed(4)}°N, {reqLng.toFixed(4)}°E</strong> ({reqDistrict})
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Specific Medical or Dietary Needs (Optional)
              </label>
              <input
                type="text"
                value={reqSpecialNeeds}
                onChange={(e) => setReqSpecialNeeds(e.target.value)}
                placeholder="e.g. Baby formula, Diabetics (need sugar-free / insulin), Elderly mobility support"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Details & Special Instructions *</label>
              <textarea
                required
                rows={3}
                value={reqDetails}
                onChange={(e) => setReqDetails(e.target.value)}
                placeholder="Describe current stock remaining and safest approach route for relief vehicles or boats."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCitizenAction('main')}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition"
              >
                Submit Assistance Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 5: REPORT PROPERTY DAMAGE */}
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
              <h2 className="text-lg font-bold text-slate-900">Report Property or Agricultural Damage</h2>
              <p className="text-xs text-slate-500">
                Log structural or crop inundation for official state disaster compensation assessment.
              </p>
            </div>
          </div>

          <form onSubmit={handleReportDamage} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Classification *</label>
                <select
                  value={damagePropertyType}
                  onChange={(e) => setDamagePropertyType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs bg-white"
                >
                  <option value="Residential Home">Residential Home</option>
                  <option value="Commercial Building">Commercial Shop / Small Enterprise</option>
                  <option value="Agricultural Crop / Farm">Agricultural Crop / Farm Inundation</option>
                  <option value="Infrastructure / Road">Community Approach Road / Culvert</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Damage Severity *</label>
                <select
                  value={damageSeverity}
                  onChange={(e) => setDamageSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs bg-white"
                >
                  <option value="Total Destruction">Total Destruction — Uninhabitable</option>
                  <option value="Severe">Severe — Roof or Wall Collapsed</option>
                  <option value="Moderate">Moderate — 1m+ Mud & Water Ingress</option>
                  <option value="Minor">Minor — Ground Dampness / Boundary Damage</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Address / Survey No *</label>
                <input
                  type="text"
                  required
                  value={damageLocation}
                  onChange={(e) => setDamageLocation(e.target.value)}
                  placeholder="e.g. Sy No 142/2, Main Road, Danavaipeta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Mobile Number (10-Digit Indian Mobile) *
                </label>
                <input
                  type="tel"
                  required
                  value={damagePhone}
                  onChange={(e) => setDamagePhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Financial Loss (INR)</label>
                <input
                  type="text"
                  value={damageLossInr}
                  onChange={(e) => setDamageLossInr(e.target.value)}
                  placeholder="e.g. ₹1,50,000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHazard}
                    onChange={(e) => setIsHazard(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <span className="text-xs text-red-800 font-semibold">Immediate Structural / Electric Hazard Present</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Damage Description & Circumstances *</label>
              <textarea
                required
                rows={3}
                value={damageDesc}
                onChange={(e) => setDamageDesc(e.target.value)}
                placeholder="Detail floodwater depth inside structure, collapsed walls, lost harvest acres, or electrical meter submersion."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCitizenAction('main')}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition"
              >
                Register Damage Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 6: MY REQUESTS & INCIDENTS (Privacy-Preserved Tracking) */}
      {citizenAction === 'my_requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Emergency Submissions & Tracking</h2>
              <p className="text-xs text-slate-500">
                Track status updates and response dispatches for your submitted incidents and relief requests.
              </p>
            </div>
            <button
              onClick={() => setCitizenAction('main')}
              className="text-xs text-emerald-800 font-semibold hover:underline"
            >
              ← Back to Services
            </button>
          </div>

          {/* Section: Assistance Requests */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-700" />
              <span>Assistance & Relief Requests ({myAssistanceRequests.length})</span>
            </h3>

            {myAssistanceRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p>No active relief assistance requests submitted yet.</p>
                <button
                  onClick={() => setCitizenAction('request_help')}
                  className="mt-2 text-emerald-800 font-bold underline"
                >
                  Submit a Relief Request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myAssistanceRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{req.id}</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold text-[10px]">
                          {req.category}
                        </span>
                        <span
                          className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.priority === 'urgent'
                              ? 'bg-red-100 text-red-800'
                              : req.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          req.status === 'fulfilled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'partially_fulfilled'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status === 'fulfilled'
                          ? '✓ FULFILLED'
                          : req.status === 'partially_fulfilled'
                          ? `PARTIALLY FULFILLED (${req.quantityFulfilled}/${req.quantityRequested})`
                          : 'PENDING ALLOCATION'}
                      </span>
                    </div>

                    <p className="text-slate-700">{req.details}</p>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>📍 {req.location}</span>
                      <span>Requested: {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {req.fulfilledBy && (
                        <span className="text-emerald-700 font-semibold">Matched: {req.fulfilledBy}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Emergency Incidents */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Reported Emergencies ({myEmergencyReports.length})</span>
            </h3>

            {myEmergencyReports.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p>No emergency incident reports registered.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myEmergencyReports.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{inc.id}</span>
                        <h4 className="font-bold text-slate-900">{inc.title}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          inc.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inc.status === 'dispatched'
                            ? 'bg-sky-100 text-sky-800'
                            : inc.status === 'resolved'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inc.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-600">{inc.description}</p>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>📍 {inc.location}</span>
                      {inc.assignedTeamName && (
                        <span className="text-sky-700 font-semibold">Dispatched: {inc.assignedTeamName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 7: PREPAREDNESS CHECKLIST (Preserved Feature) */}
      {citizenAction === 'checklist' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <button
                onClick={() => setCitizenAction('main')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Citizen Services</span>
              </button>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Disaster Preparedness Checklist</h2>
              <p className="text-xs text-slate-500">
                Track and verify essential household emergency items before cyclone and flood escalation.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  item.completed
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                    : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'
                }`}
              >
                <div className="mt-0.5 text-emerald-700 shrink-0">
                  {item.completed ? <CheckSquare className="w-5 h-5 text-emerald-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold ${item.completed ? 'line-through text-emerald-800' : 'text-slate-900'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
