import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Incident,
  AssistanceRequest,
  Shelter,
  ResponseTeam,
  ReliefResource,
  Volunteer,
  Vehicle,
  PropertyDamageReport,
  ChecklistItem,
  OfficialAlert,
  WeatherData,
  UserProfile,
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
import { supabase, isSupabaseConfigured, checkSupabaseConnection, SupabaseConnectionStatus } from '../services/supabaseClient';

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

  // Active User / Auth
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  supabaseStatus: SupabaseConnectionStatus;
  refreshSupabaseStatus: () => Promise<void>;

  // Data sets (active based on mode)
  incidents: Incident[];
  shelters: Shelter[];
  responseTeams: ResponseTeam[];
  assistanceRequests: AssistanceRequest[];
  resources: ReliefResource[];
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
  assignTeamToIncident: (incidentId: string, teamId: string) => void;
  submitAssistanceRequest: (req: Omit<AssistanceRequest, 'id' | 'requestedAt' | 'status'>) => AssistanceRequest;
  fulfillAssistanceRequest: (requestId: string, partnerName: string, resourceId?: string) => void;
  updateShelterOccupancy: (shelterId: string, newOccupancy: number) => void;
  registerResource: (res: Omit<ReliefResource, 'id' | 'registeredAt' | 'status'>) => ReliefResource;
  registerVolunteer: (vol: Omit<Volunteer, 'id' | 'registeredAt' | 'status'>) => Volunteer;
  registerVehicle: (veh: Omit<Vehicle, 'id' | 'status'>) => Vehicle;
  submitDamageReport: (dmg: Omit<PropertyDamageReport, 'id' | 'submittedAt' | 'status'>) => PropertyDamageReport;
  toggleChecklistItem: (id: string) => void;
  markPotentialDuplicate: (incidentId: string, primaryId: string) => void;

  // Modals
  isEmergencyCallModalOpen: boolean;
  setIsEmergencyCallModalOpen: (open: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export const DisasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode: Live Data Mode is the default
  const [mode, setModeState] = useState<'live' | 'demo'>('live');

  // Navigation
  const [activePortal, setActivePortal] = useState<PortalType>('home');
  const [authoritySection, setAuthoritySection] = useState<AuthoritySection>('overview');
  const [citizenAction, setCitizenAction] = useState<CitizenAction>('main');
  const [partnerSection, setPartnerSection] = useState<PartnerSection>('main');

  // Auth User - default to public demo user or restored session
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('disastershield_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEmergencyCallModalOpen, setIsEmergencyCallModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // Supabase Status
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>({
    isConfigured: isSupabaseConfigured,
    status: isSupabaseConfigured ? 'unverified' : 'not_configured',
    message: isSupabaseConfigured
      ? 'Client initialized · project access not yet verified'
      : 'Authentication is not configured yet. Set the Supabase URL and anon key.',
    url: 'https://xlihhtmqfbaymzddzjqp.supabase.co',
  });

  // Demo state stores (Fully populated and interactive)
  const [demoIncidents, setDemoIncidents] = useState<Incident[]>(INITIAL_DEMO_INCIDENTS);
  const [demoShelters, setDemoShelters] = useState<Shelter[]>(INITIAL_DEMO_SHELTERS);
  const [demoTeams, setDemoTeams] = useState<ResponseTeam[]>(INITIAL_DEMO_TEAMS);
  const [demoRequests, setDemoRequests] = useState<AssistanceRequest[]>(INITIAL_DEMO_REQUESTS);
  const [demoResources, setDemoResources] = useState<ReliefResource[]>(INITIAL_DEMO_RESOURCES);
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
  const [liveVolunteers, setLiveVolunteers] = useState<Volunteer[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>([]);
  const [liveDamageReports, setLiveDamageReports] = useState<PropertyDamageReport[]>([]);
  const [liveChecklist, setLiveChecklist] = useState<ChecklistItem[]>(INITIAL_DEMO_CHECKLIST.map((c) => ({ ...c, completed: false })));

  // Weather state
  const [weather, setWeather] = useState<WeatherData>(DEMO_WEATHER);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Official Alerts
  const [officialAlerts, setOfficialAlerts] = useState<OfficialAlert[]>(INITIAL_DEMO_OFFICIAL_ALERTS);

  // Initialize and check connection
  useEffect(() => {
    refreshSupabaseStatus();
  }, []);

  const refreshSupabaseStatus = async () => {
    const res = await checkSupabaseConnection();
    setSupabaseStatus(res);
  };

  // Weather fetcher based on active mode
  useEffect(() => {
    if (mode === 'demo') {
      setWeather(DEMO_WEATHER);
      setIsWeatherLoading(false);
      setWeatherError(null);
      setOfficialAlerts(INITIAL_DEMO_OFFICIAL_ALERTS);
      return;
    }

    // Live mode: fetch real Open-Meteo weather
    let isMounted = true;
    setIsWeatherLoading(true);
    setWeatherError(null);

    fetchLiveWeather(16.9891, 81.784, 'Rajahmundry / Godavari Basin')
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

    // In live mode, official alerts must not be made up
    // Set to empty or configured official notices
    setOfficialAlerts([]);

    return () => {
      isMounted = false;
    };
  }, [mode]);

  const setMode = (newMode: 'live' | 'demo') => {
    setModeState(newMode);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('disastershield_user');
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
  const volunteers = mode === 'demo' ? demoVolunteers : liveVolunteers;
  const vehicles = mode === 'demo' ? demoVehicles : liveVehicles;
  const damageReports = mode === 'demo' ? demoDamageReports : liveDamageReports;
  const checklist = mode === 'demo' ? demoChecklist : liveChecklist;

  // Four Primary Statistics (Calculated dynamically)
  const stats = useMemo(() => {
    // 1. Total Incidents
    const totalIncidents = incidents.filter((i) => i.status !== 'rejected').length;

    // 2. Active Response Teams (deployed or on_site)
    const activeResponseTeams = responseTeams.filter(
      (t) => t.status === 'deployed' || t.status === 'on_site'
    ).length;

    // 3. People in Shelters (sum of currentOccupancy)
    const peopleInShelters = shelters.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0);

    // 4. Pending Assistance (status === 'pending')
    const pendingAssistance = assistanceRequests.filter((r) => r.status === 'pending').length;

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
        Promise.resolve(supabase.from('incidents').update({ status: newStatus, verification_notes: notes }).eq('id', id)).catch(() => {});
      }
    }
  };

  const assignTeamToIncident = (incidentId: string, teamId: string) => {
    let assignedTeamName = '';

    // Update Team Status to 'deployed'
    const teamUpdater = (prev: ResponseTeam[]) =>
      prev.map((team) => {
        if (team.id === teamId) {
          assignedTeamName = team.name;
          return {
            ...team,
            status: 'deployed' as const,
            currentIncidentId: incidentId,
          };
        }
        return team;
      });

    // Update Incident Status to 'dispatched'
    const incidentUpdater = (prev: Incident[]) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: 'dispatched' as IncidentStatus,
            assignedTeamId: teamId,
            assignedTeamName: assignedTeamName || inc.assignedTeamName,
          };
        }
        return inc;
      });

    if (mode === 'demo') {
      setDemoTeams(teamUpdater);
      setDemoIncidents(incidentUpdater);
    } else {
      setLiveTeams(teamUpdater);
      setLiveIncidents(incidentUpdater);
    }
  };

  const submitAssistanceRequest = (
    req: Omit<AssistanceRequest, 'id' | 'requestedAt' | 'status'>
  ): AssistanceRequest => {
    const id = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReq: AssistanceRequest = {
      ...req,
      id,
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

  const fulfillAssistanceRequest = (requestId: string, partnerName: string, resourceId?: string) => {
    // 1. Update Request
    const requestUpdater = (prev: AssistanceRequest[]) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'fulfilled' as const,
              fulfilledBy: partnerName,
              fulfilledAt: new Date().toISOString(),
              allocatedResourceId: resourceId,
            }
          : req
      );

    // 2. Decrement Resource quantity if matched
    const resourceUpdater = (prev: ReliefResource[]) =>
      prev.map((res) => {
        if (resourceId && res.id === resourceId) {
          const newQty = Math.max(0, res.quantity - 10);
          return {
            ...res,
            quantity: newQty,
            status: newQty === 0 ? ('allocated' as const) : res.status,
          };
        }
        return res;
      });

    if (mode === 'demo') {
      setDemoRequests(requestUpdater);
      if (resourceId) setDemoResources(resourceUpdater);
    } else {
      setLiveRequests(requestUpdater);
      if (resourceId) setLiveResources(resourceUpdater);
    }
  };

  const updateShelterOccupancy = (shelterId: string, newOccupancy: number) => {
    const updater = (prev: Shelter[]) =>
      prev.map((s) => {
        if (s.id === shelterId) {
          const occ = Math.max(0, newOccupancy);
          let status = s.status;
          if (occ >= s.capacity) status = 'full';
          else if (occ >= s.capacity * 0.85) status = 'near_capacity';
          else status = 'active';

          return { ...s, currentOccupancy: occ, status };
        }
        return s;
      });

    if (mode === 'demo') {
      setDemoShelters(updater);
    } else {
      setLiveShelters(updater);
      if (supabase && isSupabaseConfigured) {
        Promise.resolve(supabase.from('shelters').update({ current_occupancy: newOccupancy }).eq('id', shelterId)).catch(() => {});
      }
    }
  };

  const registerResource = (res: Omit<ReliefResource, 'id' | 'registeredAt' | 'status'>): ReliefResource => {
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
    }

    return newRes;
  };

  const registerVolunteer = (vol: Omit<Volunteer, 'id' | 'registeredAt' | 'status'>): Volunteer => {
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
    }

    return newVeh;
  };

  const submitDamageReport = (dmg: Omit<PropertyDamageReport, 'id' | 'submittedAt' | 'status'>): PropertyDamageReport => {
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

  const markPotentialDuplicate = (incidentId: string, primaryId: string) => {
    const updater = (prev: Incident[]) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              isDuplicateOf: primaryId,
              isPotentialDuplicate: true,
              verificationNotes: `Linked as potential duplicate of ${primaryId}`,
            }
          : inc
      );

    if (mode === 'demo') {
      setDemoIncidents(updater);
    } else {
      setLiveIncidents(updater);
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
        user,
        setUser,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        supabaseStatus,
        refreshSupabaseStatus,
        incidents,
        shelters,
        responseTeams,
        assistanceRequests,
        resources,
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
        updateShelterOccupancy,
        registerResource,
        registerVolunteer,
        registerVehicle,
        submitDamageReport,
        toggleChecklistItem,
        markPotentialDuplicate,
        isEmergencyCallModalOpen,
        setIsEmergencyCallModalOpen,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
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
