import React, { useState } from 'react';
import { useDisaster } from '../state/DisasterContext';
import { PartnerSection, AssistanceCategory } from '../types/disaster';
import { validateIndianMobile } from '../utils/phoneValidation';
import {
  HeartHandshake,
  Package,
  Users,
  Truck,
  Layers,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';

export const ReliefPartnerPortal: React.FC = () => {
  const {
    partnerSection,
    setPartnerSection,
    resources,
    volunteers,
    vehicles,
    assistanceRequests,
    registerResource,
    registerVolunteer,
    registerVehicle,
    fulfillAssistanceRequest,
    canAccessPortal,
    logout,
    openAuthForRole,
    mode,
    user,
  } = useDisaster();

  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [committingId, setCommittingId] = useState<string | null>(null);
  const [allocationFeedback, setAllocationFeedback] = useState<{
    resourceName: string;
    previousQty: number;
    allocatedQty: number;
    remainingQty: number;
    unit: string;
    requestId: string;
  } | null>(null);

  // Form states:
  // 1. Register Resource Form
  const [partnerName, setPartnerName] = useState(user ? user.fullName : 'Akshaya Relief Mission Trust');
  const [resCategory, setResCategory] = useState<AssistanceCategory>('food');
  const [itemName, setItemName] = useState('');
  const [resQuantity, setResQuantity] = useState<number>(500);
  const [resUnit, setResUnit] = useState('meal packets');
  const [resLocation, setResLocation] = useState('Central Community Depot, Danavaipeta');
  const [resPhone, setResPhone] = useState('+91 98490 55112');

  // 2. Register Volunteer Form
  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volSkills, setVolSkills] = useState('First Aid, Food Distribution');
  const [volPreferredWork, setVolPreferredWork] = useState('Relief Camp Support');
  const [volHours, setVolHours] = useState('8 hrs/day');

  // 3. Register Vehicle Form
  const [vehType, setVehType] = useState<'Advanced Ambulance' | 'Inflatable Rescue Boat' | '4x4 High-Clearance Truck' | 'Cargo Van' | 'Water Tanker (10,000L)' | 'Tractor Trailer'>('Cargo Van');
  const [vehReg, setVehReg] = useState('');
  const [vehCapacity, setVehCapacity] = useState('1.5 Ton Rations / 2,000 Packets');
  const [vehDriver, setVehDriver] = useState('');
  const [vehDriverPhone, setVehDriverPhone] = useState('');
  const [vehLocation, setVehLocation] = useState('Municipal Town Hall Staging Area');

  // Filter pending relief requests that partners can fulfill
  const pendingNeeds = assistanceRequests.filter((r) => r.status === 'pending');

  const handleRegisterResource = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!itemName || !resLocation) return;

    const phoneVal = validateIndianMobile(resPhone);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number for partner contact.');
      return;
    }

    registerResource({
      partnerName,
      partnerId: user ? user.id : 'PARTNER-01',
      category: resCategory,
      itemName,
      quantity: resQuantity,
      unit: resUnit,
      location: resLocation,
      district: 'East Godavari Simulation Sector',
      lat: 16.99,
      lng: 81.78,
      contactPhone: phoneVal.normalized,
    });

    setSuccessFeedback('Relief resource registered successfully! Visible in Authority Allocation pool.');
    setItemName('');
    setTimeout(() => {
      setSuccessFeedback(null);
      setPartnerSection('resources_inventory');
    }, 1500);
  };

  const handleRegisterVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!volName || !volPhone) return;

    const phoneVal = validateIndianMobile(volPhone);
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number for volunteer contact.');
      return;
    }

    registerVolunteer({
      name: volName,
      phone: phoneVal.normalized,
      email: volEmail || 'volunteer@example.org',
      district: 'East Godavari Simulation Sector',
      skills: volSkills.split(',').map((s) => s.trim()),
      preferredWork: volPreferredWork,
      availableHours: volHours,
    });

    setSuccessFeedback('Volunteer successfully registered to the Disaster Relief Roster.');
    setVolName('');
    setVolPhone('');
    setTimeout(() => {
      setSuccessFeedback(null);
      setPartnerSection('main');
    }, 1500);
  };

  const handleRegisterVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!vehReg || !vehDriver) return;

    const phoneVal = validateIndianMobile(vehDriverPhone || '+91 98000 00000');
    if (!phoneVal.isValid) {
      setFormError(phoneVal.error || 'Enter a valid 10-digit Indian mobile number for driver contact.');
      return;
    }

    registerVehicle({
      partnerName: user ? user.fullName : 'Humanitarian Fleet Pool',
      vehicleType: vehType,
      registrationNumber: vehReg,
      capacity: vehCapacity,
      driverName: vehDriver,
      driverPhone: phoneVal.normalized,
      location: vehLocation,
      lat: 16.99,
      lng: 81.78,
    });

    setSuccessFeedback('Relief vehicle registered and marked available for mission dispatch.');
    setVehReg('');
    setVehDriver('');
    setVehDriverPhone('');
    setTimeout(() => {
      setSuccessFeedback(null);
      setPartnerSection('main');
    }, 1500);
  };

  // Section 2: Atomic Resource Deduction Workflow
  const handleCommitResource = async (needId: string, resourceId?: string) => {
    setFormError(null);
    setSuccessFeedback(null);
    setAllocationFeedback(null);

    const need = assistanceRequests.find((r) => r.id === needId);
    if (!need) return;

    const matchedRes = resourceId
      ? resources.find((r) => r.id === resourceId)
      : resources.find((r) => r.category === need.category && r.quantity > 0);

    if (!matchedRes) {
      setFormError(`No available ${need.category} inventory in stock to fulfill this request.`);
      return;
    }

    const previousQty = matchedRes.quantity;
    const qtyToAllocate = need.remainingQuantity ?? need.quantityRequested ?? 1;

    if (qtyToAllocate > previousQty) {
      setFormError(`Insufficient stock: Only ${previousQty} ${matchedRes.unit} available, but ${qtyToAllocate} required.`);
      return;
    }

    setCommittingId(needId);

    const res = await fulfillAssistanceRequest(needId, partnerName, matchedRes.id, qtyToAllocate);

    setCommittingId(null);

    if (!res.success) {
      setFormError(res.error || 'Failed to allocate relief resource.');
      return;
    }

    const remainingQty = previousQty - qtyToAllocate;
    setAllocationFeedback({
      resourceName: matchedRes.itemName,
      previousQty,
      allocatedQty: qtyToAllocate,
      remainingQty,
      unit: matchedRes.unit,
      requestId: needId,
    });

    setSuccessFeedback(
      `Transaction Successful: Allocated ${qtyToAllocate} ${matchedRes.unit} to request ${needId}. Previously available: ${previousQty}, Remaining inventory: ${remainingQty}.`
    );
  };

  // Section 3: Enforce strict role authorization
  const accessCheck = canAccessPortal('partner');
  if (!accessCheck.allowed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {accessCheck.reason === 'citizen_denied'
              ? 'You are signed in as a Citizen and do not have permission to access the Relief Partner portal. Please sign in with an authorized account.'
              : accessCheck.reason === 'pending_approval'
              ? 'Your Relief Partner account is currently pending administrator verification. Please contact disaster relief coordination.'
              : 'The Relief Partner Network is restricted to verified humanitarian agencies and relief organizations. Please sign in.'}
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
                  openAuthForRole('partner');
                }}
                className="px-4 py-2 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#245740] transition"
              >
                Sign In with Authorized Account
              </button>
            </>
          ) : (
            <button
              onClick={() => openAuthForRole('partner')}
              className="px-5 py-2.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#245740] transition"
            >
              Sign In as Relief Partner
            </button>
          )}
        </div>
      </div>
    );
  }

  // Requirement 13: Completely removed Impact Reports
  const partnerTabs: { id: PartnerSection; label: string; count?: number }[] = [
    { id: 'main', label: 'Overview' },
    { id: 'register_resource', label: 'Register Resources' },
    { id: 'resources_inventory', label: 'Supplies Inventory', count: resources.length },
    { id: 'register_volunteer', label: 'Volunteer Registration', count: volunteers.length },
    { id: 'register_vehicle', label: 'Relief Vehicles', count: vehicles.length },
    { id: 'pending_needs', label: 'Pending Citizen Requests', count: pendingNeeds.length },
    { id: 'matching', label: 'Resource-to-Need Matching' },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Relief Partner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              RELIEF PARTNER NETWORK
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">NGOs, Donors & Community Volunteers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5">
            Relief Supply & Volunteer Coordination Hub
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        {partnerTabs.map((tab) => {
          const isActive = partnerSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setPartnerSection(tab.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Notifications */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successFeedback}</span>
        </div>
      )}

      {/* VIEW 1: OVERVIEW */}
      {partnerSection === 'main' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Available Inventory</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">
                  {resources.length} lots
                </span>
                <span className="text-xs text-emerald-700 font-semibold mt-1 block">Food, water & blankets</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Registered Volunteers</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">
                  {volunteers.length}
                </span>
                <span className="text-xs text-sky-700 font-semibold mt-1 block">Medical & boat crew</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Relief Vehicles</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">
                  {vehicles.length}
                </span>
                <span className="text-xs text-indigo-700 font-semibold mt-1 block">Ambulances, boats & 4x4s</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Unfulfilled Requests</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">
                  {pendingNeeds.length}
                </span>
                <span className="text-xs text-amber-700 font-semibold mt-1 block">Awaiting partner dispatch</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              onClick={() => setPartnerSection('register_resource')}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-600 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Register Supplies & Donations</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Register food packets, drinking water bottles, thermal blankets, or medicines into the central relief pool.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 mt-4 flex items-center gap-1">
                <span>Add Resources</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            <div
              onClick={() => setPartnerSection('matching')}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-600 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Resource-to-Need Matching</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Directly match your organization's resources against open citizen food, water, or medical requests.
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-800 mt-4 flex items-center gap-1">
                <span>Open Matchmaker</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            <div
              onClick={() => setPartnerSection('register_volunteer')}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-600 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Mobilize Volunteers</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enroll medical responders, boat navigators, kitchen workers, and counseling specialists for active shelter deployment.
                </p>
              </div>
              <span className="text-xs font-semibold text-sky-800 mt-4 flex items-center gap-1">
                <span>Enroll Volunteers</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: REGISTER RESOURCES */}
      {partnerSection === 'register_resource' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Register Relief Supplies</h2>
              <p className="text-xs text-slate-500">
                Registered supplies are added to the active inventory visible to government incident command.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterResource} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Partner Organization *</label>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. Red Cross / Rotary / Akshaya"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                >
                  <option value="food">Ready-to-Eat Food / Rations</option>
                  <option value="water">Drinking Water</option>
                  <option value="medical">Medical / First Aid Kits</option>
                  <option value="clothing">Blankets & Clothing</option>
                  <option value="sanitation">Sanitation & Hygiene Kits</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Item Title & Specifications *</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. 500 Pouch Ready-to-Eat Khichdi & Biscuits"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity Available *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={resQuantity}
                  onChange={(e) => setResQuantity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit of Measurement *</label>
                <input
                  type="text"
                  required
                  value={resUnit}
                  onChange={(e) => setResUnit(e.target.value)}
                  placeholder="e.g. meal packets, 20L cans, kits"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Depot / Warehouse Location *</label>
              <input
                type="text"
                required
                value={resLocation}
                onChange={(e) => setResLocation(e.target.value)}
                placeholder="e.g. Red Cross Warehouse, Danavaipeta"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={resPhone}
                onChange={(e) => setResPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#245740] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition"
              >
                Register Supplies into Central Disaster Pool
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: INVENTORY */}
      {partnerSection === 'resources_inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Supplies Inventory</h2>
              <p className="text-xs text-slate-500">Live stock available for dispatch across relief camps.</p>
            </div>
            <button
              onClick={() => setPartnerSection('register_resource')}
              className="px-3 py-1.5 bg-[#1B4332] text-white rounded-xl text-xs font-semibold"
            >
              + Register New Stock
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((res) => (
              <div key={res.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{res.id}</span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {res.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{res.itemName}</h3>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2">
                    {res.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">{res.unit}</span>
                  </div>

                  <div className="text-xs text-slate-500 border-t border-slate-200 pt-3 mt-3 space-y-1">
                    <div>Partner: <strong>{res.partnerName}</strong></div>
                    <div>Location: {res.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: VOLUNTEER REGISTRATION */}
      {partnerSection === 'register_volunteer' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Volunteer Enlistment Form</h2>
                <p className="text-xs text-slate-500">Join the active civilian disaster relief taskforce.</p>
              </div>
            </div>

            <form onSubmit={handleRegisterVolunteer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                    placeholder="e.g. Dr. Sandeep Varma"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={volPhone}
                    onChange={(e) => setVolPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Skills & Capabilities *</label>
                <input
                  type="text"
                  required
                  value={volSkills}
                  onChange={(e) => setVolSkills(e.target.value)}
                  placeholder="e.g. First Aid, Motor Boat Operation, Heavy Driver, Cook"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Work Role</label>
                  <select
                    value={volPreferredWork}
                    onChange={(e) => setVolPreferredWork(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  >
                    <option value="Relief Camp Support">Relief Camp Support / Distribution</option>
                    <option value="Boat Evacuation & Rescue">Boat Evacuation & Rescue</option>
                    <option value="Medical Booth Triage">Medical Booth Triage</option>
                    <option value="Comms & Ham Radio">Comms & Ham Radio Backup</option>
                    <option value="Community Kitchen">Community Kitchen Service</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Availability</label>
                  <input
                    type="text"
                    value={volHours}
                    onChange={(e) => setVolHours(e.target.value)}
                    placeholder="e.g. 10 hrs/day (Immediate)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#245740] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition"
                >
                  Register Volunteer
                </button>
              </div>
            </form>
          </div>

          {/* Volunteer Roster */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Active Volunteer Roster ({volunteers.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volunteers.map((vol) => (
                <div key={vol.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{vol.name}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 capitalize">
                      {vol.status}
                    </span>
                  </div>
                  <p className="text-slate-600">{vol.preferredWork}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {vol.skills.map((s, i) => (
                      <span key={i} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: VEHICLE REGISTRATION */}
      {partnerSection === 'register_vehicle' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register Transport & Rescue Vehicle</h2>
                <p className="text-xs text-slate-500">Provide high-clearance trucks, boats, or ambulances for relief operations.</p>
              </div>
            </div>

            <form onSubmit={handleRegisterVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Type *</label>
                  <select
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  >
                    <option value="Advanced Ambulance">Advanced Ambulance</option>
                    <option value="Inflatable Rescue Boat">Inflatable Rescue Boat</option>
                    <option value="4x4 High-Clearance Truck">4x4 High-Clearance Truck</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Water Tanker (10,000L)">Water Tanker (10,000L)</option>
                    <option value="Tractor Trailer">Tractor Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration / Fleet ID *</label>
                  <input
                    type="text"
                    required
                    value={vehReg}
                    onChange={(e) => setVehReg(e.target.value)}
                    placeholder="e.g. AP 05 TX 9988"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payload / Passenger Capacity *</label>
                  <input
                    type="text"
                    required
                    value={vehCapacity}
                    onChange={(e) => setVehCapacity(e.target.value)}
                    placeholder="e.g. 10 Evacuees / 2 Tons cargo"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Driver / Pilot *</label>
                  <input
                    type="text"
                    required
                    value={vehDriver}
                    onChange={(e) => setVehDriver(e.target.value)}
                    placeholder="e.g. Srikanth Varma"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staging Area Location *</label>
                <input
                  type="text"
                  required
                  value={vehLocation}
                  onChange={(e) => setVehLocation(e.target.value)}
                  placeholder="e.g. Kovvur Embankment Bridgehead"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#245740] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition"
                >
                  Register Vehicle to Fleet
                </button>
              </div>
            </form>
          </div>

          {/* Vehicle Fleet Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Registered Relief Transport ({vehicles.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((veh) => (
                <div key={veh.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{veh.vehicleType}</span>
                    <span className="font-mono text-[10px] text-slate-500">{veh.registrationNumber}</span>
                  </div>
                  <p className="text-slate-600">Capacity: <strong>{veh.capacity}</strong></p>
                  <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 space-y-0.5">
                    <div>Driver: {veh.driverName} ({veh.driverPhone})</div>
                    <div>Location: {veh.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: PENDING CITIZEN REQUESTS */}
      {partnerSection === 'pending_needs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Open Citizen Assistance Requests ({pendingNeeds.length})</h2>
            <p className="text-xs text-slate-500">
              Needs submitted by stranded citizens and community leaders awaiting relief partner adoption.
            </p>
          </div>

          <div className="space-y-3">
            {pendingNeeds.map((req) => (
              <div
                key={req.id}
                className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{req.id}</span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {req.category}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {req.priority}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {req.peopleCount} people affected
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{req.details}</h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{req.location}</span>
                  </p>

                  {req.specialNeeds && (
                    <div className="text-[11px] text-red-700 font-medium">
                      ⚠️ Special Needs: {req.specialNeeds}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    disabled={committingId === req.id}
                    onClick={() => handleCommitResource(req.id)}
                    className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    {committingId === req.id ? 'Fulfilling...' : 'Commit & Adopt Need'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 7: RESOURCE-TO-NEED MATCHING */}
      {partnerSection === 'matching' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <span className="text-[10px] font-bold font-mono text-emerald-800 uppercase tracking-wider">
              INTELLIGENT ALLOCATION
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">Resource-to-Need Matching Matrix</h2>
            <p className="text-xs text-slate-500">
              Matches unserved citizen requirements with compatible inventory supplies based on category, quantity, and proximity.
            </p>
          </div>

          <div className="space-y-4">
            {pendingNeeds.map((need) => {
              // Find matching available resource in same category
              const matchedResource = resources.find((r) => r.category === need.category && r.quantity > 0);
              const requestedQty = need.remainingQuantity ?? need.quantityRequested ?? 1;
              const hasEnoughStock = matchedResource ? matchedResource.quantity >= requestedQty : false;

              return (
                <div key={need.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{need.id}</span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Need: {need.category}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        Requires: {requestedQty} {need.unit || 'units'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{need.details}</h4>
                    <p className="text-xs text-slate-500">{need.location} ({need.peopleCount} evacuees)</p>

                    {allocationFeedback && allocationFeedback.requestId === need.id && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs space-y-0.5 animate-in fade-in">
                        <div className="font-bold">Transaction Confirmed for {allocationFeedback.resourceName}:</div>
                        <div>• Previously available: <strong>{allocationFeedback.previousQty} {allocationFeedback.unit}</strong></div>
                        <div>• Quantity allocated: <strong>{allocationFeedback.allocatedQty} {allocationFeedback.unit}</strong></div>
                        <div>• Remaining available stock: <strong>{allocationFeedback.remainingQty} {allocationFeedback.unit}</strong></div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {matchedResource ? (
                      <div className="text-right text-xs">
                        <span className="text-[10px] text-slate-400 block">Matched Stock:</span>
                        <span className="font-bold text-emerald-800">{matchedResource.itemName}</span>
                        <span className="text-[10px] text-slate-500 block">Available: <strong>{matchedResource.quantity}</strong> {matchedResource.unit}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No compatible stock in inventory</span>
                    )}

                    <button
                      disabled={!matchedResource || !hasEnoughStock || committingId === need.id}
                      onClick={() => handleCommitResource(need.id, matchedResource?.id)}
                      className="py-2.5 px-4 bg-[#1B4332] hover:bg-[#245740] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      {committingId === need.id ? (
                        <span>Processing...</span>
                      ) : (
                        <span>Commit and Fulfil Request</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
