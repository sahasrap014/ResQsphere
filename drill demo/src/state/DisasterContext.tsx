import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Incident,
  AssistanceRequest,
  Shelter,
  AddShelterInput,
  ResponseTeam,
  AddResponseTeamInput,
  ReliefResource,
  ResourceAllocation,
  Volunteer,
  Vehicle,
  PropertyDamageReport,
  ChecklistItem,
  OfficialAlert,
  WeatherData,
  UserProfile,
  UserLocation,
  PortalType,
  AuthoritySection,
  CitizenAction,
  PartnerSection,
  IncidentStatus,
} from '../types/disaster';
import {
  INITIAL_DEMO_INCIDENTS,
  INITIAL_DEMO_SHELTERS,
  INITIAL_DEMO_TEAMS,
  INITIAL_DEMO_REQUESTS,
  INITIAL_DEMO_RESOURCES,
  INITIAL_DEMO_VOLUNTEERS,
  INITIAL_DEMO_VEHICLES,
  INITIAL_DEMO_DAMAGE_REPORTS,
  INITIAL_DEMO_CHECKLIST,
  INITIAL_DEMO_OFFICIAL_ALERTS,
} from '../data/demoScenario';
import { fetchLiveWeather, DEMO_WEATHER } from '../services/weatherService';
import {
  supabase,
  isSupabaseConfigured,
  checkSupabaseConnection,
  SupabaseConnectionStatus,
  fetchUserProfile,
} from '../services/supabaseClient';
import { validateIndianMobile } from '../utils/phoneValidation';

interface DisasterContextType {
  mode: 'live' | 'demo';
  setMode: (mode: 'live' | 'demo') => void;
  activePortal: PortalType;
  setActivePortal: (portal: PortalType) => void;
  authoritySection: AuthoritySection;
  setAuthoritySection: (sec: AuthoritySection) => void;
  citizenAction: CitizenAction;
  setCitizenAction: (act: CitizenAction) => void;
  partnerSection: PartnerSection;
  setPartnerSection: (sec: PartnerSection) => void;

  // Location Management (Requirement 2)
  userLocation: UserLocation;
  requestDeviceLocation: () => Promise<void>;
  setManualLocation: (lat: number, lng: number, district: string, address?: string) => void;

  // Active User / Auth (Requirement 3)
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalInitialRole: 'citizen' | 'authority' | 'partner';
  openAuthForRole: (role: 'citizen' | 'authority' | 'partner') => void;
  supabaseStatus: SupabaseConnectionStatus;
  refreshSupabaseStatus: () => Promise<void>;

  // Data sets (active based on mode)
  incidents: Incident[];
  shelters: Shelter[];
  responseTeams: ResponseTeam[];
  assistanceRequests: AssistanceRequest[];
  resources: ReliefResource[];
  allocations: ResourceAllocation[];
  volunteers: Volunteer[];
  vehicles: Vehicle[];
  damageReports: PropertyDamageReport[];
  checklist: ChecklistItem[];
  officialAlerts: OfficialAlert[];
  weather: WeatherData;
  isWeatherLoading: boolean;
  weatherError: string | null;

  // Overview calculated statistics (Exactly four primary cards)
  stats: {
    totalIncidents: number;
    activeResponseTeams: number;
    peopleInShelters: number;
    pendingAssistance: number;
  };

  // Operational Actions
  resetScenario: () => void;
  submitEmergencyReport: (report: Omit<Incident, 'id' | 'reportedAt' | 'status'>) => Incident;
  verifyIncident: (id: string, newStatus: 'verified' | 'rejected', notes?: string) => void;
  
  // Requirement 7: Prevent repeat deployment of response teams
  assignTeamToIncident: (incidentId: string, teamId: string) => { success: boolean; error?: string };
  
  submitAssistanceRequest: (req: Omit<AssistanceRequest, 'id' | 'requestedAt' | 'status'>) => AssistanceRequest;
  fulfillAssistanceRequest: (
    requestId: string,
    partnerName: string,
    resourceId?: string,
    quantity?: number
  ) => Promise<{ success: boolean; error?: string; allocated?: number; remainingResource?: number }>;
  
  // Requirement 9: Real Match Resources workflow
  matchAndAllocateResource: (
    requestId: string,
    resourceId: string,
    quantityToAllocate: number,
    allocatedBy: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Requirement 6: Add Shelter functionality with strict capacity validation
  addShelter: (input: AddShelterInput) => { success: boolean; error?: string; shelter?: Shelter };
  updateShelterOccupancy: (shelterId: string, newOccupancy: number) => { success: boolean; error?: string };

  // Response Teams: Add Response Team functionality
  addResponseTeam: (input: AddResponseTeamInput) => { success: boolean; error?: string; team?: ResponseTeam };

  // Role-based portal access verification
  canAccessPortal: (portal: PortalType) => {
    allowed: boolean;
    reason?: 'unauthenticated' | 'citizen_denied' | 'partner_denied' | 'authority_denied' | 'pending_approval';
  };

  registerResource: (res: Omit<ReliefResource, 'id' | 'registeredAt' | 'status'>) => ReliefResource;
  registerVolunteer: (vol: Omit<Volunteer, 'id' | 'registeredAt' | 'status'>) => Volunteer;
  registerVehicle: (veh: Omit<Vehicle, 'id' | 'status'>) => Vehicle;
  submitDamageReport: (dmg: Omit<PropertyDamageReport, 'id' | 'submittedAt' | 'status'>) => PropertyDamageReport;
  toggleChecklistItem: (id: string) => void;

  // Requirement 8: Fix Duplicate Review actions
  linkDuplicateToPrimary: (duplicateId: string, primaryId: string, notes?: string) => { success: boolean; error?: string };
  keepIncidentDistinct: (incidentId: string, notes?: string) => { success: boolean; error?: string };

  // Emergency Call Modal
  isEmergencyCallModalOpen: boolean;
  setIsEmergencyCallModalOpen: (open: boolean) => void;
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export const DisasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode: Live Data Mode is the default
  const [mode, setModeState] = useState<'live' | 'demo'>('live');

  // Navigation: Requirement 15 (Every top-level portal must open its Overview first)
  const [activePortal, setActivePortalState] = useState<PortalType>('home');
  const [authoritySection, setAuthoritySection] = useState<AuthoritySection>('overview');
  const [citizenAction, setCitizenAction] = useState<CitizenAction>('main');
  const [partnerSection, setPartnerSection] = useState<PartnerSection>('main');

  // Location State (Requirement 2 & Section 1: No fake AP default in Live Mode)
  const [userLocation, setUserLocation] = useState<UserLocation>(() => {
    try {
      const saved = localStorage.getItem('resqsphere_user_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      lat: 20.5937,
      lng: 78.9629,
      address: undefined,
      district: undefined,
      isDetected: false,
      isManual: false,
      permissionStatus: 'prompt',
    };
  });

  // Auth User - restored from session
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('resqsphere_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<'citizen' | 'authority' | 'partner'>('citizen');
  const [isEmergencyCallModalOpen, setIsEmergencyCallModalOpen] = useState(false);

  // Supabase Status
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>({
    isConfigured: isSupabaseConfigured,
    status: isSupabaseConfigured ? 'unverified' : 'not_configured',
    message: isSupabaseConfigured
      ? 'Client initialized · project access not yet verified'
      : 'Authentication is not configured yet. Set the Supabase URL and publishable key.',
    url: 'https://pnykpvjsxwyezvvvjqjf.supabase.co',
  });

  // Demo state stores (Fully populated and interactive)
  const [demoIncidents, setDemoIncidents] = useState<Incident[]>(INITIAL_DEMO_INCIDENTS);
  const [demoShelters, setDemoShelters] = useState<Shelter[]>(INITIAL_DEMO_SHELTERS);
  const [demoTeams, setDemoTeams] = useState<ResponseTeam[]>(INITIAL_DEMO_TEAMS);
  const [demoRequests, setDemoRequests] = useState<AssistanceRequest[]>(INITIAL_DEMO_REQUESTS);
  const [demoResources, setDemoResources] = useState<ReliefResource[]>(INITIAL_DEMO_RESOURCES);
  const [demoAllocations, setDemoAllocations] = useState<ResourceAllocation[]>([
    {
      id: 'ALC-DEMO-01',
      requestId: 'REQ-2026-107',
      resourceId: 'RES-01',
      resourceName: 'Ready-to-Eat Hygienic Meal Packets',
      category: 'food',
      allocatedQuantity: 4,
      unit: 'meal packets',
      allocatedBy: 'Akshaya Relief Mission Trust',
      allocatedAt: '2026-10-23T08:00:00Z',
      isDemo: true,
    },
  ]);
  const [demoVolunteers, setDemoVolunteers] = useState<Volunteer[]>(INITIAL_DEMO_VOLUNTEERS);
  const [demoVehicles, setDemoVehicles] = useState<Vehicle[]>(INITIAL_DEMO_VEHICLES);
  const [demoDamageReports, setDemoDamageReports] = useState<PropertyDamageReport[]>(INITIAL_DEMO_DAMAGE_REPORTS);
  const [demoChecklist, setDemoChecklist] = useState<ChecklistItem[]>(INITIAL_DEMO_CHECKLIST);

  // Live state stores
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [liveShelters, setLiveShelters] = useState<Shelter[]>([]);
  const [liveTeams, setLiveTeams] = useState<ResponseTeam[]>([]);
  const [liveRequests, setLiveRequests] = useState<AssistanceRequest[]>([]);
  const [liveResources, setLiveResources] = useState<ReliefResource[]>([]);
  const [liveAllocations, setLiveAllocations] = useState<ResourceAllocation[]>([]);
  const [liveVolunteers, setLiveVolunteers] = useState<Volunteer[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
  const [liveDamageReports, setLiveDamageReports] = useState<PropertyDamageReport[]>([]);
  const [liveChecklist, setLiveChecklist] = useState<ChecklistItem[]>(
    INITIAL_DEMO_CHECKLIST.map((c) => ({ ...c, completed: false }))
  );

  // Weather state
  const [weather, setWeather] = useState<WeatherData>(DEMO_WEATHER);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Official Alerts
  const [officialAlerts, setOfficialAlerts] = useState<OfficialAlert[]>(INITIAL_DEMO_OFFICIAL_ALERTS);

  // Top-Level Portal Navigation Handler (Requirement 15)
  const setActivePortal = (portal: PortalType) => {
    setActivePortalState(portal);
    // Always open that portal's Overview dashboard first
    if (portal === 'citizen') {
      setCitizenAction('main');
    } else if (portal === 'authority') {
      setAuthoritySection('overview');
    } else if (portal === 'partner') {
      setPartnerSection('main');
    }
  };

  // Dedicated role modal opener (Requirement 3)
  const openAuthForRole = (role: 'citizen' | 'authority' | 'partner') => {
    setAuthModalInitialRole(role);
    setIsAuthModalOpen(true);
  };

  // Restore authenticated session from Supabase on mount
  useEffect(() => {
    refreshSupabaseStatus();

    if (supabase && isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id).then((profile) => {
            if (profile) {
              setUser(profile);
              localStorage.setItem('resqsphere_user', JSON.stringify(profile));
            }
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchUserProfile(session.user.id).then((profile) => {
            if (profile) {
              setUser(profile);
              localStorage.setItem('resqsphere_user', JSON.stringify(profile));
            }
          });
        } else {
          setUser(null);
          localStorage.removeItem('resqsphere_user');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const refreshSupabaseStatus = async () => {
    const res = await checkSupabaseConnection();
    setSupabaseStatus(res);
  };

  // Geolocation Request (Section 1: Live mode requires sign-in first)
  const requestDeviceLocation = async () => {
    if (mode === 'live' && !user) {
      console.warn('In Live Mode, geolocation request is blocked before user authentication.');
      return;
    }

    if (!navigator.geolocation) {
      setUserLocation((prev) => ({
        ...prev,
        permissionStatus: 'unavailable',
      }));
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(4));
            const lng = Number(pos.coords.longitude.toFixed(4));
            const detectedArea = `GPS Coordinates (${lat}°N, ${lng}°E)`;

            const updatedLoc: UserLocation = {
              lat,
              lng,
              address: detectedArea,
              district: 'Current Device Location (GPS)',
              isDetected: true,
              isManual: false,
              permissionStatus: 'granted',
            };

            setUserLocation(updatedLoc);
            try {
              localStorage.setItem('resqsphere_user_location', JSON.stringify(updatedLoc));
            } catch {}

            // Immediately load weather for detected coordinates
            if (mode === 'live') {
              setIsWeatherLoading(true);
              fetchLiveWeather(lat, lng, detectedArea)
                .then((data) => {
                  setWeather(data);
                  setIsWeatherLoading(false);
                })
                .catch(() => {
                  setIsWeatherLoading(false);
                });
            }
            resolve();
          },
          (err) => {
            console.warn('Geolocation denied or timed out:', err.message);
            const updatedLoc: UserLocation = {
              ...userLocation,
              isDetected: false,
              permissionStatus: err.code === 1 ? 'denied' : 'unavailable',
            };
            setUserLocation(updatedLoc);
            try {
              localStorage.setItem('resqsphere_user_location', JSON.stringify(updatedLoc));
            } catch {}
            reject(err);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    } catch {
      // Gracefully handled; user can select manual location
    }
  };

  const setManualLocation = (lat: number, lng: number, district: string, address?: string) => {
    const loc: UserLocation = {
      lat,
      lng,
      district,
      address: address || `${district} Zone`,
      isDetected: false,
      isManual: true,
      permissionStatus: 'granted',
    };
    setUserLocation(loc);
    try {
      localStorage.setItem('resqsphere_user_location', JSON.stringify(loc));
    } catch {}

    if (mode === 'live') {
      setIsWeatherLoading(true);
      fetchLiveWeather(lat, lng, loc.address || district)
        .then((data) => {
          setWeather(data);
          setIsWeatherLoading(false);
        })
        .catch(() => {
          setIsWeatherLoading(false);
        });
    }
  };

  // Weather fetcher based on active mode & userLocation
  useEffect(() => {
    if (mode === 'demo') {
      setWeather(DEMO_WEATHER);
      setIsWeatherLoading(false);
      setWeatherError(null);
      setOfficialAlerts(INITIAL_DEMO_OFFICIAL_ALERTS);
      return;
    }

    // Live mode: fetch real Open-Meteo weather for current user location
    let isMounted = true;
    setIsWeatherLoading(true);
    setWeatherError(null);

    const targetLat = userLocation.lat || 16.9891;
    const targetLng = userLocation.lng || 81.784;
    const targetName = userLocation.address || userLocation.district || 'Local Station';

    fetchLiveWeather(targetLat, targetLng, targetName)
      .then((data) => {
        if (isMounted) {
          setWeather(data);
          setIsWeatherLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Live weather fetch error:', err);
          setWeatherError('Weather service connection unavailable. Check network access.');
          setIsWeatherLoading(false);
        }
      });

    // In live mode, alerts must not be fabricated
    setOfficialAlerts([]);

    return () => {
      isMounted = false;
    };
  }, [mode, userLocation.lat, userLocation.lng]);

  const setMode = (newMode: 'live' | 'demo') => {
    setModeState(newMode);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('resqsphere_user');
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  // Current active records based on mode
  const incidents = mode === 'demo' ? demoIncidents : liveIncidents;
  const shelters = mode === 'demo' ? demoShelters : liveShelters;
  const responseTeams = mode === 'demo' ? demoTeams : liveTeams;
  const assistanceRequests = mode === 'demo' ? demoRequests : liveRequests;
  const resources = mode === 'demo' ? demoResources : liveResources;
  const allocations = mode === 'demo' ? demoAllocations : liveAllocations;
  const volunteers = mode === 'demo' ? demoVolunteers : liveVolunteers;
  const vehicles = mode === 'demo' ? demoVehicles : liveVehicles;
  const damageReports = mode === 'demo' ? demoDamageReports : liveDamageReports;
  const checklist = mode === 'demo' ? demoChecklist : liveChecklist;

  // Four Primary Statistics (Calculated dynamically)
  const stats = useMemo(() => {
    const totalIncidents = incidents.filter((i) => i.status !== 'rejected').length;
    const activeResponseTeams = responseTeams.filter(
      (t) => t.status === 'deployed' || t.status === 'on_site'
    ).length;
    const peopleInShelters = shelters.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0);
    const pendingAssistance = assistanceRequests.filter((r) => r.status === 'pending' || r.status === 'partially_fulfilled').length;

    return {
      totalIncidents,
      activeResponseTeams,
      peopleInShelters,
      pendingAssistance,
    };
  }, [incidents, responseTeams, shelters, assistanceRequests]);

  // Operational Actions
  const resetScenario = () => {
    setDemoIncidents(INITIAL_DEMO_INCIDENTS);
    setDemoShelters(INITIAL_DEMO_SHELTERS);
    setDemoTeams(INITIAL_DEMO_TEAMS);
    setDemoRequests(INITIAL_DEMO_REQUESTS);
    setDemoResources(INITIAL_DEMO_RESOURCES);
    setDemoVolunteers(INITIAL_DEMO_VOLUNTEERS);
    setDemoVehicles(INITIAL_DEMO_VEHICLES);
    setDemoDamageReports(INITIAL_DEMO_DAMAGE_REPORTS);
    setDemoChecklist(INITIAL_DEMO_CHECKLIST);
    setWeather(DEMO_WEATHER);
  };

  const submitEmergencyReport = (report: Omit<Incident, 'id' | 'reportedAt' | 'status'>): Incident => {
    const id = `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newIncident: Incident = {
      ...report,
      id,
      reportedAt: new Date().toISOString(),
      status: 'pending_verification',
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoIncidents((prev) => [newIncident, ...prev]);
    } else {
      setLiveIncidents((prev) => [newIncident, ...prev]);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(supabase.from('incidents').insert([newIncident])).catch((err: any) => {
          console.warn('Failed to sync incident to Supabase:', err);
        });
      }
    }

    return newIncident;
  };

  const verifyIncident = (id: string, newStatus: 'verified' | 'rejected', notes?: string) => {
    const updater = (prev: Incident[]) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: newStatus as IncidentStatus,
              verifiedAt: new Date().toISOString(),
              verifiedBy: user?.fullName || 'Authorized Operations Officer',
              verificationNotes: notes || inc.verificationNotes,
            }
          : inc
      );

    if (mode === 'demo') {
      setDemoIncidents(updater);
    } else {
      setLiveIncidents(updater);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase.from('incidents').update({ status: newStatus, verification_notes: notes }).eq('id', id)
        ).catch(() => {});
      }
    }
  };

  // Requirement 7: Prevent repeat deployment of response teams
  const assignTeamToIncident = (incidentId: string, teamId: string): { success: boolean; error?: string } => {
    const currentTeams = mode === 'demo' ? demoTeams : liveTeams;
    const targetTeam = currentTeams.find((t) => t.id === teamId);

    if (!targetTeam) {
      return { success: false, error: 'Selected response team was not found.' };
    }

    // Underlying enforcement: reject if already deployed or on site
    if (targetTeam.status === 'deployed' || targetTeam.status === 'on_site') {
      return {
        success: false,
        error: `Cannot deploy ${targetTeam.name}: Unit is already active and deployed to incident "${targetTeam.currentIncidentTitle || targetTeam.currentIncidentId}".`,
      };
    }

    const currentIncidents = mode === 'demo' ? demoIncidents : liveIncidents;
    const targetIncident = currentIncidents.find((i) => i.id === incidentId);
    const incidentTitle = targetIncident?.title || incidentId;

    // 1. Update team status
    const teamUpdater = (prev: ResponseTeam[]) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              status: 'deployed' as const,
              currentIncidentId: incidentId,
              currentIncidentTitle: incidentTitle,
            }
          : team
      );

    // 2. Update incident status
    const incidentUpdater = (prev: Incident[]) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status: 'dispatched' as IncidentStatus,
              assignedTeamId: teamId,
              assignedTeamName: targetTeam.name,
            }
          : inc
      );

    if (mode === 'demo') {
      setDemoTeams(teamUpdater);
      setDemoIncidents(incidentUpdater);
    } else {
      setLiveTeams(teamUpdater);
      setLiveIncidents(incidentUpdater);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase
            .from('response_teams')
            .update({ status: 'deployed', current_incident_id: incidentId, current_incident_title: incidentTitle })
            .eq('id', teamId)
        ).catch(() => {});
        Promise.resolve(
          supabase
            .from('incidents')
            .update({ status: 'dispatched', assigned_team_id: teamId, assigned_team_name: targetTeam.name })
            .eq('id', incidentId)
        ).catch(() => {});
      }
    }

    return { success: true };
  };

  const submitAssistanceRequest = (
    req: Omit<AssistanceRequest, 'id' | 'requestedAt' | 'status'>
  ): AssistanceRequest => {
    const id = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const qty = req.quantityRequested || req.peopleCount || 1;
    const newReq: AssistanceRequest = {
      ...req,
      id,
      quantityRequested: qty,
      quantityFulfilled: 0,
      remainingQuantity: qty,
      unit: req.unit || 'units',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoRequests((prev) => [newReq, ...prev]);
    } else {
      setLiveRequests((prev) => [newReq, ...prev]);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(supabase.from('assistance_requests').insert([newReq])).catch(() => {});
      }
    }

    return newReq;
  };

  // Requirement 9: Real Match Resources workflow with atomic inventory decrement
  const matchAndAllocateResource = async (
    requestId: string,
    resourceId: string,
    quantityToAllocate: number,
    allocatedBy: string
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Validation
    if (!Number.isInteger(quantityToAllocate) || quantityToAllocate <= 0) {
      return { success: false, error: 'Allocation quantity must be a positive whole number.' };
    }

    const currentRequests = mode === 'demo' ? demoRequests : liveRequests;
    const currentResources = mode === 'demo' ? demoResources : liveResources;

    const targetReq = currentRequests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { success: false, error: 'Assistance request was not found.' };
    }

    const targetRes = currentResources.find((r) => r.id === resourceId);
    if (!targetRes) {
      return { success: false, error: 'Selected relief resource was not found.' };
    }

    const remainingNeeded = targetReq.remainingQuantity ?? targetReq.quantityRequested ?? targetReq.peopleCount;
    if (quantityToAllocate > remainingNeeded) {
      return {
        success: false,
        error: `Cannot allocate ${quantityToAllocate} ${targetRes.unit}. Requested remaining need is only ${remainingNeeded} ${targetReq.unit || 'units'}.`,
      };
    }

    if (quantityToAllocate > targetRes.quantity) {
      return {
        success: false,
        error: `Insufficient inventory: only ${targetRes.quantity} ${targetRes.unit} available in stock.`,
      };
    }

    // 2. Perform allocation
    const allocId = `ALC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAllocation: ResourceAllocation = {
      id: allocId,
      requestId,
      resourceId,
      resourceName: targetRes.itemName,
      category: targetRes.category,
      allocatedQuantity: quantityToAllocate,
      unit: targetRes.unit,
      allocatedBy,
      allocatedAt: new Date().toISOString(),
      isDemo: mode === 'demo',
    };

    // New request metrics
    const newFulfilled = (targetReq.quantityFulfilled || 0) + quantityToAllocate;
    const totalRequired = targetReq.quantityRequested || remainingNeeded;
    const newRemaining = Math.max(0, totalRequired - newFulfilled);
    const newStatus = newRemaining === 0 ? ('fulfilled' as const) : ('partially_fulfilled' as const);

    // New resource metric
    const newResQty = targetRes.quantity - quantityToAllocate;
    const newResStatus = newResQty === 0 ? ('allocated' as const) : targetRes.status;

    if (mode === 'demo') {
      // Demo Mode Isolated Atomic Update
      setDemoRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                quantityFulfilled: newFulfilled,
                remainingQuantity: newRemaining,
                status: newStatus,
                fulfilledBy: allocatedBy,
                fulfilledAt: new Date().toISOString(),
                allocatedResourceId: resourceId,
              }
            : r
        )
      );

      setDemoResources((prev) =>
        prev.map((res) =>
          res.id === resourceId
            ? {
                ...res,
                quantity: newResQty,
                status: newResStatus,
              }
            : res
        )
      );

      setDemoAllocations((prev) => [newAllocation, ...prev]);
      return { success: true };
    } else {
      // Live Mode: Supabase atomic update / RPC call
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.rpc('allocate_relief_resource', {
            p_request_id: requestId,
            p_resource_id: resourceId,
            p_quantity: quantityToAllocate,
            p_allocated_by: allocatedBy,
          });

          if (error) {
            return { success: false, error: error.message };
          }
          if (data && !data.success) {
            return { success: false, error: data.error };
          }
        } catch (rpcErr: any) {
          console.warn('RPC failed, falling back to sequential transaction:', rpcErr);
          // Fallback update
          await supabase.from('relief_resources').update({ quantity: newResQty }).eq('id', resourceId);
          await supabase
            .from('assistance_requests')
            .update({
              quantity_fulfilled: newFulfilled,
              remaining_quantity: newRemaining,
              status: newStatus,
              fulfilled_by: allocatedBy,
              fulfilled_at: new Date().toISOString(),
            })
            .eq('id', requestId);
          await supabase.from('allocations').insert([
            {
              id: allocId,
              request_id: requestId,
              resource_id: resourceId,
              allocated_quantity: quantityToAllocate,
              unit: targetRes.unit,
              allocated_by: allocatedBy,
            },
          ]);
        }
      }

      setLiveRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                quantityFulfilled: newFulfilled,
                remainingQuantity: newRemaining,
                status: newStatus,
                fulfilledBy: allocatedBy,
                fulfilledAt: new Date().toISOString(),
                allocatedResourceId: resourceId,
              }
            : r
        )
      );

      setLiveResources((prev) =>
        prev.map((res) =>
          res.id === resourceId
            ? {
                ...res,
                quantity: newResQty,
                status: newResStatus,
              }
            : res
        )
      );

      setLiveAllocations((prev) => [newAllocation, ...prev]);
      return { success: true };
    }
  };

  // Section 2: Precise and atomic resource deduction workflow
  const fulfillAssistanceRequest = async (
    requestId: string,
    partnerName: string,
    resourceId?: string,
    quantity?: number
  ): Promise<{ success: boolean; error?: string; allocated?: number; remainingResource?: number }> => {
    // 1. Locate the request
    const currentRequests = mode === 'demo' ? demoRequests : liveRequests;
    const targetReq = currentRequests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { success: false, error: 'Assistance request not found.' };
    }

    // 2. Locate the matching resource
    const currentResources = mode === 'demo' ? demoResources : liveResources;
    let targetRes = resourceId
      ? currentResources.find((r) => r.id === resourceId)
      : currentResources.find((r) => r.category === targetReq.category && r.quantity > 0);

    if (!targetRes) {
      return {
        success: false,
        error: `No compatible ${targetReq.category} inventory supplies available in stock to fulfill this request.`,
      };
    }

    // 3. Determine quantity to commit & fulfill
    const remainingNeed = targetReq.remainingQuantity ?? targetReq.quantityRequested ?? 1;
    const qtyToAllocate = quantity && quantity > 0 ? quantity : remainingNeed;

    // Strict Validations
    if (!Number.isInteger(qtyToAllocate) || qtyToAllocate <= 0) {
      return { success: false, error: 'Allocation quantity must be a positive whole number greater than 0.' };
    }

    if (qtyToAllocate > targetRes.quantity) {
      return {
        success: false,
        error: `Insufficient stock: only ${targetRes.quantity} ${targetRes.unit} available, but attempted to commit ${qtyToAllocate} ${targetRes.unit}.`,
      };
    }

    if (qtyToAllocate > remainingNeed) {
      return {
        success: false,
        error: `Over-allocation rejected: attempted to commit ${qtyToAllocate} ${targetRes.unit}, but remaining need is only ${remainingNeed} ${targetRes.unit}.`,
      };
    }

    // Exact inventory deduction
    const newResQty = targetRes.quantity - qtyToAllocate;
    const newResStatus = newResQty === 0 ? ('allocated' as const) : ('available' as const);
    const newFulfilled = (targetReq.quantityFulfilled || 0) + qtyToAllocate;
    const newRemaining = Math.max(0, (targetReq.quantityRequested || remainingNeed) - newFulfilled);
    const newStatus = newRemaining === 0 ? ('fulfilled' as const) : ('partially_fulfilled' as const);

    const allocId = `ALC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newAllocation: ResourceAllocation = {
      id: allocId,
      requestId,
      resourceId: targetRes.id,
      resourceName: targetRes.itemName,
      category: targetRes.category,
      allocatedQuantity: qtyToAllocate,
      unit: targetRes.unit,
      allocatedBy: partnerName,
      allocatedAt: new Date().toISOString(),
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                quantityFulfilled: newFulfilled,
                remainingQuantity: newRemaining,
                status: newStatus,
                fulfilledBy: partnerName,
                fulfilledAt: new Date().toISOString(),
                allocatedResourceId: targetRes!.id,
              }
            : r
        )
      );

      setDemoResources((prev) =>
        prev.map((res) =>
          res.id === targetRes!.id
            ? {
                ...res,
                quantity: newResQty,
                status: newResStatus,
              }
            : res
        )
      );

      setDemoAllocations((prev) => [newAllocation, ...prev]);
      return { success: true, allocated: qtyToAllocate, remainingResource: newResQty };
    } else {
      // Live Mode: Atomic RPC or direct Supabase update
      if (supabase && isSupabaseConfigured) {
        try {
          const { error } = await supabase.rpc('allocate_relief_resource', {
            p_request_id: requestId,
            p_resource_id: targetRes.id,
            p_quantity: qtyToAllocate,
            p_allocated_by: partnerName,
          });

          if (error) {
            console.warn('RPC allocate_relief_resource fallback:', error.message);
            await supabase.from('relief_resources').update({ quantity: newResQty, status: newResStatus }).eq('id', targetRes.id);
            await supabase
              .from('assistance_requests')
              .update({
                quantity_fulfilled: newFulfilled,
                remaining_quantity: newRemaining,
                status: newStatus,
                fulfilled_by: partnerName,
                fulfilled_at: new Date().toISOString(),
                allocated_resource_id: targetRes.id,
              })
              .eq('id', requestId);
            await supabase.from('allocations').insert([
              {
                id: allocId,
                request_id: requestId,
                resource_id: targetRes.id,
                allocated_quantity: qtyToAllocate,
                unit: targetRes.unit,
                allocated_by: partnerName,
              },
            ]);
          }
        } catch (dbErr: any) {
          return { success: false, error: dbErr?.message || 'Database allocation failed.' };
        }
      }

      setLiveRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                quantityFulfilled: newFulfilled,
                remainingQuantity: newRemaining,
                status: newStatus,
                fulfilledBy: partnerName,
                fulfilledAt: new Date().toISOString(),
                allocatedResourceId: targetRes!.id,
              }
            : r
        )
      );

      setLiveResources((prev) =>
        prev.map((res) =>
          res.id === targetRes!.id
            ? {
                ...res,
                quantity: newResQty,
                status: newResStatus,
              }
            : res
        )
      );

      setLiveAllocations((prev) => [newAllocation, ...prev]);
      return { success: true, allocated: qtyToAllocate, remainingResource: newResQty };
    }
  };

  // Add Response Team Functionality
  const addResponseTeam = (
    input: AddResponseTeamInput
  ): { success: boolean; error?: string; team?: ResponseTeam } => {
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: 'Response team name is required.' };
    }

    if (!Number.isInteger(input.membersCount) || input.membersCount <= 0) {
      return { success: false, error: 'Team size must be a positive whole number (at least 1 crew member).' };
    }

    if (!input.baseLocation || input.baseLocation.trim().length === 0) {
      return { success: false, error: 'Operational base or staging location is required.' };
    }

    let phoneNormalized = '+91 98000 00000';
    if (input.contactPhone) {
      const phoneVal = validateIndianMobile(input.contactPhone);
      if (!phoneVal.isValid) {
        return { success: false, error: phoneVal.error || 'Enter a valid 10-digit Indian mobile number for team contact.' };
      }
      phoneNormalized = phoneVal.normalized;
    }

    // Check duplicate team name
    const currentTeams = mode === 'demo' ? demoTeams : liveTeams;
    if (currentTeams.some((t) => t.name.toLowerCase() === input.name.trim().toLowerCase())) {
      return { success: false, error: `A response team named "${input.name.trim()}" already exists in the registry.` };
    }

    const id = `TEAM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newTeam: ResponseTeam = {
      id,
      name: input.name.trim(),
      agency: input.agency || 'SDRF',
      type: input.type || 'Search & Rescue',
      leader: input.leader || 'Team Commander',
      contactPhone: phoneNormalized,
      membersCount: input.membersCount,
      status: input.status || 'available',
      baseLocation: input.baseLocation.trim(),
      lat: input.lat || (mode === 'demo' ? 16.989 : userLocation.lat),
      lng: input.lng || (mode === 'demo' ? 81.784 : userLocation.lng),
      specialties: input.specialties || ['Emergency Search', 'First Aid'],
      notes: input.notes,
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoTeams((prev) => [newTeam, ...prev]);
    } else {
      setLiveTeams((prev) => [newTeam, ...prev]);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase.from('response_teams').insert([
            {
              id: newTeam.id,
              name: newTeam.name,
              agency: newTeam.agency,
              type: newTeam.type,
              leader: newTeam.leader,
              contact_phone: newTeam.contactPhone,
              members_count: newTeam.membersCount,
              status: newTeam.status,
              base_location: newTeam.baseLocation,
              lat: newTeam.lat,
              lng: newTeam.lng,
              specialties: newTeam.specialties,
            },
          ])
        ).catch((err: any) => {
          console.warn('Failed to insert response team to Supabase:', err);
        });
      }
    }

    return { success: true, team: newTeam };
  };

  // Section 3: Role-based portal access verification
  const canAccessPortal = (
    portal: PortalType
  ): {
    allowed: boolean;
    reason?: 'unauthenticated' | 'citizen_denied' | 'partner_denied' | 'authority_denied' | 'pending_approval';
  } => {
    if (mode === 'demo') {
      return { allowed: true };
    }

    if (portal === 'home' || portal === 'citizen') {
      return { allowed: true };
    }

    if (portal === 'authority') {
      if (!user) return { allowed: false, reason: 'unauthenticated' };
      if (user.role === 'citizen') return { allowed: false, reason: 'citizen_denied' };
      if (user.role === 'partner') return { allowed: false, reason: 'partner_denied' };
      if (user.role === 'authority') {
        if (user.isApproved === false) return { allowed: false, reason: 'pending_approval' };
        return { allowed: true };
      }
      return { allowed: false, reason: 'citizen_denied' };
    }

    if (portal === 'partner') {
      if (!user) return { allowed: false, reason: 'unauthenticated' };
      if (user.role === 'citizen') return { allowed: false, reason: 'citizen_denied' };
      if (user.role === 'partner') {
        if (user.isApproved === false) return { allowed: false, reason: 'pending_approval' };
        return { allowed: true };
      }
      if (user.role === 'authority') return { allowed: true };
      return { allowed: false, reason: 'citizen_denied' };
    }

    return { allowed: true };
  };

  // Requirement 6: Add Shelter functionality with strict capacity validation
  const addShelter = (input: AddShelterInput): { success: boolean; error?: string; shelter?: Shelter } => {
    // 1. Validation
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: 'Shelter name is required.' };
    }

    if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
      return { success: false, error: 'Maximum capacity must be a positive whole number greater than 0.' };
    }

    if (!Number.isInteger(input.currentOccupancy) || input.currentOccupancy < 0) {
      return { success: false, error: 'Current occupancy must be a non-negative whole number (0 or greater).' };
    }

    // Critical Requirement: Current occupancy must never exceed maximum capacity
    if (input.currentOccupancy > input.capacity) {
      return {
        success: false,
        error: `Occupancy (${input.currentOccupancy}) exceeds maximum capacity (${input.capacity}). Occupancy can never exceed shelter capacity.`,
      };
    }

    // Phone validation
    const phoneVal = validateIndianMobile(input.contactPhone);
    if (!phoneVal.isValid) {
      return { success: false, error: phoneVal.error || 'Enter a valid 10-digit Indian mobile number for shelter contact.' };
    }

    // Determine status
    let status = input.status || 'active';
    if (input.currentOccupancy >= input.capacity) {
      status = 'full';
    } else if (input.currentOccupancy >= input.capacity * 0.85) {
      status = 'near_capacity';
    }

    const id = `SHL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newShelter: Shelter = {
      id,
      name: input.name.trim(),
      address: input.address.trim(),
      district: input.district || 'East Godavari Simulation Sector',
      lat: input.lat || 16.989,
      lng: input.lng || 81.784,
      capacity: input.capacity,
      currentOccupancy: input.currentOccupancy,
      status,
      facilities: input.facilities || ['Safe Drinking Water', 'Emergency Power', 'Restrooms'],
      contactPhone: phoneVal.normalized,
      contactPerson: input.contactPerson || 'Camp Administrator',
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoShelters((prev) => [newShelter, ...prev]);
    } else {
      setLiveShelters((prev) => [newShelter, ...prev]);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase.from('shelters').insert([
            {
              id: newShelter.id,
              name: newShelter.name,
              address: newShelter.address,
              district: newShelter.district,
              lat: newShelter.lat,
              lng: newShelter.lng,
              capacity: newShelter.capacity,
              current_occupancy: newShelter.currentOccupancy,
              status: newShelter.status,
              facilities: newShelter.facilities,
              contact_phone: newShelter.contactPhone,
              contact_person: newShelter.contactPerson,
            },
          ])
        ).catch((err: any) => {
          console.warn('Failed to insert shelter in Supabase:', err);
        });
      }
    }

    return { success: true, shelter: newShelter };
  };

  const updateShelterOccupancy = (
    shelterId: string,
    newOccupancy: number
  ): { success: boolean; error?: string } => {
    if (!Number.isInteger(newOccupancy) || newOccupancy < 0) {
      return { success: false, error: 'Occupancy must be a non-negative whole number.' };
    }

    const currentShelters = mode === 'demo' ? demoShelters : liveShelters;
    const targetShelter = currentShelters.find((s) => s.id === shelterId);
    if (!targetShelter) {
      return { success: false, error: 'Shelter not found.' };
    }

    // Critical Requirement: Occupancy must never exceed capacity
    if (newOccupancy > targetShelter.capacity) {
      return {
        success: false,
        error: `Cannot set occupancy to ${newOccupancy}: Shelter maximum capacity is ${targetShelter.capacity}.`,
      };
    }

    let status = targetShelter.status;
    if (newOccupancy >= targetShelter.capacity) status = 'full';
    else if (newOccupancy >= targetShelter.capacity * 0.85) status = 'near_capacity';
    else status = 'active';

    const updater = (prev: Shelter[]) =>
      prev.map((s) => (s.id === shelterId ? { ...s, currentOccupancy: newOccupancy, status } : s));

    if (mode === 'demo') {
      setDemoShelters(updater);
    } else {
      setLiveShelters(updater);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase
            .from('shelters')
            .update({ current_occupancy: newOccupancy, status })
            .eq('id', shelterId)
        ).catch(() => {});
      }
    }

    return { success: true };
  };

  // Requirement 8: Fix Duplicate Review actions
  const linkDuplicateToPrimary = (
    duplicateId: string,
    primaryId: string,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (duplicateId === primaryId) {
      return { success: false, error: 'Cannot link an incident to itself as a duplicate.' };
    }

    const currentIncidents = mode === 'demo' ? demoIncidents : liveIncidents;
    const primaryIncident = currentIncidents.find((i) => i.id === primaryId);
    if (!primaryIncident) {
      return { success: false, error: 'Selected primary incident was not found.' };
    }

    // Prevent circular linkage
    if (primaryIncident.isDuplicateOf === duplicateId) {
      return { success: false, error: 'Circular duplicate link detected. Primary incident is already linked to this report.' };
    }

    const updater = (prev: Incident[]) =>
      prev.map((inc) =>
        inc.id === duplicateId
          ? {
              ...inc,
              isDuplicateOf: primaryId,
              isPotentialDuplicate: true,
              duplicateReviewed: true,
              status: 'duplicate' as IncidentStatus,
              verificationNotes: notes || `Linked as duplicate of ${primaryId} (${primaryIncident.title})`,
            }
          : inc
      );

    if (mode === 'demo') {
      setDemoIncidents(updater);
    } else {
      setLiveIncidents(updater);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase
            .from('incidents')
            .update({
              is_duplicate_of: primaryId,
              is_potential_duplicate: true,
              duplicate_reviewed: true,
              status: 'duplicate',
              verification_notes: notes || `Linked as duplicate of ${primaryId}`,
            })
            .eq('id', duplicateId)
        ).catch(() => {});
      }
    }

    return { success: true };
  };

  const keepIncidentDistinct = (incidentId: string, notes?: string): { success: boolean; error?: string } => {
    const updater = (prev: Incident[]) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              isPotentialDuplicate: false,
              isDuplicateOf: undefined,
              duplicateReviewed: true,
              verificationNotes: notes || 'Reviewed by Authority: Verified as distinct emergency incident.',
            }
          : inc
      );

    if (mode === 'demo') {
      setDemoIncidents(updater);
    } else {
      setLiveIncidents(updater);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase
            .from('incidents')
            .update({
              is_potential_duplicate: false,
              is_duplicate_of: null,
              duplicate_reviewed: true,
              verification_notes: notes || 'Reviewed by Authority: Verified as distinct emergency incident.',
            })
            .eq('id', incidentId)
        ).catch(() => {});
      }
    }

    return { success: true };
  };

  const registerResource = (
    res: Omit<ReliefResource, 'id' | 'registeredAt' | 'status'>
  ): ReliefResource => {
    const id = `RES-${Math.floor(10 + Math.random() * 90)}`;
    const newRes: ReliefResource = {
      ...res,
      id,
      registeredAt: new Date().toISOString(),
      status: 'available',
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoResources((prev) => [newRes, ...prev]);
    } else {
      setLiveResources((prev) => [newRes, ...prev]);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase.from('relief_resources').insert([
            {
              id: newRes.id,
              partner_name: newRes.partnerName,
              partner_id: newRes.partnerId,
              category: newRes.category,
              item_name: newRes.itemName,
              quantity: newRes.quantity,
              unit: newRes.unit,
              location: newRes.location,
              district: newRes.district,
              lat: newRes.lat,
              lng: newRes.lng,
              status: newRes.status,
              contact_phone: newRes.contactPhone,
            },
          ])
        ).catch(() => {});
      }
    }

    return newRes;
  };

  const registerVolunteer = (
    vol: Omit<Volunteer, 'id' | 'registeredAt' | 'status'>
  ): Volunteer => {
    const id = `VOL-${Math.floor(10 + Math.random() * 90)}`;
    const newVol: Volunteer = {
      ...vol,
      id,
      registeredAt: new Date().toISOString(),
      status: 'registered',
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoVolunteers((prev) => [newVol, ...prev]);
    } else {
      setLiveVolunteers((prev) => [newVol, ...prev]);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase.from('volunteers').insert([
            {
              id: newVol.id,
              name: newVol.name,
              phone: newVol.phone,
              email: newVol.email,
              district: newVol.district,
              skills: newVol.skills,
              preferred_work: newVol.preferredWork,
              available_hours: newVol.availableHours,
              status: newVol.status,
            },
          ])
        ).catch(() => {});
      }
    }

    return newVol;
  };

  const registerVehicle = (veh: Omit<Vehicle, 'id' | 'status'>): Vehicle => {
    const id = `VEH-${Math.floor(10 + Math.random() * 90)}`;
    const newVeh: Vehicle = {
      ...veh,
      id,
      status: 'available',
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoVehicles((prev) => [newVeh, ...prev]);
    } else {
      setLiveVehicles((prev) => [newVeh, ...prev]);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(
          supabase.from('vehicles').insert([
            {
              id: newVeh.id,
              partner_name: newVeh.partnerName,
              vehicle_type: newVeh.vehicleType,
              registration_number: newVeh.registrationNumber,
              capacity: newVeh.capacity,
              driver_name: newVeh.driverName,
              driver_phone: newVeh.driverPhone,
              location: newVeh.location,
              status: newVeh.status,
              lat: newVeh.lat,
              lng: newVeh.lng,
            },
          ])
        ).catch(() => {});
      }
    }

    return newVeh;
  };

  const submitDamageReport = (
    dmg: Omit<PropertyDamageReport, 'id' | 'submittedAt' | 'status'>
  ): PropertyDamageReport => {
    const id = `DAM-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;
    const newDmg: PropertyDamageReport = {
      ...dmg,
      id,
      submittedAt: new Date().toISOString(),
      status: 'pending_survey',
      isDemo: mode === 'demo',
    };

    if (mode === 'demo') {
      setDemoDamageReports((prev) => [newDmg, ...prev]);
    } else {
      setLiveDamageReports((prev) => [newDmg, ...prev]);
    }

    return newDmg;
  };

  const toggleChecklistItem = (id: string) => {
    const updater = (prev: ChecklistItem[]) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c));

    if (mode === 'demo') {
      setDemoChecklist(updater);
    } else {
      setLiveChecklist(updater);
    }
  };

  return (
    <DisasterContext.Provider
      value={{
        mode,
        setMode,
        activePortal,
        setActivePortal,
        authoritySection,
        setAuthoritySection,
        citizenAction,
        setCitizenAction,
        partnerSection,
        setPartnerSection,
        userLocation,
        requestDeviceLocation,
        setManualLocation,
        user,
        setUser,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalInitialRole,
        openAuthForRole,
        supabaseStatus,
        refreshSupabaseStatus,
        incidents,
        shelters,
        responseTeams,
        assistanceRequests,
        resources,
        allocations,
        volunteers,
        vehicles,
        damageReports,
        checklist,
        officialAlerts,
        weather,
        isWeatherLoading,
        weatherError,
        stats,
        resetScenario,
        submitEmergencyReport,
        verifyIncident,
        assignTeamToIncident,
        submitAssistanceRequest,
        fulfillAssistanceRequest,
        matchAndAllocateResource,
        addShelter,
        updateShelterOccupancy,
        addResponseTeam,
        canAccessPortal,
        registerResource,
        registerVolunteer,
        registerVehicle,
        submitDamageReport,
        toggleChecklistItem,
        linkDuplicateToPrimary,
        keepIncidentDistinct,
        isEmergencyCallModalOpen,
        setIsEmergencyCallModalOpen,
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
};

export const useDisaster = () => {
  const context = useContext(DisasterContext);
  if (!context) {
    throw new Error('useDisaster must be used within a DisasterProvider');
  }
  return context;
};
