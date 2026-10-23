export type PortalType = 'home' | 'citizen' | 'authority' | 'partner';

export type AuthoritySection =
  | 'overview'
  | 'verification'
  | 'duplicates'
  | 'shelters'
  | 'teams'
  | 'resources'
  | 'unmet_needs'
  | 'risk';

export type CitizenAction =
  | 'main'
  | 'report_emergency'
  | 'find_shelter'
  | 'request_help'
  | 'report_damage'
  | 'my_requests'
  | 'checklist';

export type PartnerSection =
  | 'main'
  | 'register_resource'
  | 'resources_inventory'
  | 'register_volunteer'
  | 'register_vehicle'
  | 'pending_needs'
  | 'matching';

export type IncidentSeverity = 'low' | 'moderate' | 'high' | 'critical';

export type IncidentStatus =
  | 'pending_verification'
  | 'verified'
  | 'dispatched'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'duplicate';

export type IncidentType =
  | 'Flash Flood'
  | 'Severe Waterlogging'
  | 'Structural Collapse / Damage'
  | 'Trapped Persons / Rescue Required'
  | 'Medical Emergency'
  | 'Landslide'
  | 'Electrical / Grid Hazard'
  | 'Cyclone / High Winds'
  | 'Fire Outbreak'
  | 'Other Emergency';

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  description: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;
  reportedPhone?: string;
  reportedAt: string;
  casualties?: number;
  peopleTrapped?: number;
  assignedTeamId?: string;
  assignedTeamName?: string;
  isDuplicateOf?: string;
  isPotentialDuplicate?: boolean;
  duplicateGroup?: string;
  duplicateReviewed?: boolean;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  isDemo?: boolean;
}

export type AssistanceCategory =
  | 'food'
  | 'water'
  | 'medical'
  | 'shelter'
  | 'clothing'
  | 'rescue'
  | 'sanitation';

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'pending' | 'partially_fulfilled' | 'matched' | 'dispatched' | 'fulfilled' | 'cancelled';

export interface AssistanceRequest {
  id: string;
  citizenName: string;
  citizenId: string;
  phone: string;
  category: AssistanceCategory;
  priority: RequestPriority;
  peopleCount: number;
  location: string;
  district: string;
  lat: number;
  lng: number;
  details: string;
  specialNeeds?: string; // e.g. infant, elderly, diabetic
  status: RequestStatus;
  requestedAt: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  allocatedResourceId?: string;
  quantityRequested?: number;
  quantityFulfilled?: number;
  remainingQuantity?: number;
  unit?: string;
  isDemo?: boolean;
}

export interface ResourceAllocation {
  id: string;
  requestId: string;
  resourceId: string;
  resourceName: string;
  category: AssistanceCategory;
  allocatedQuantity: number;
  unit: string;
  allocatedBy: string;
  allocatedAt: string;
  isDemo?: boolean;
}

export type ShelterStatus = 'active' | 'near_capacity' | 'full' | 'inactive';

export interface Shelter {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  facilities: string[];
  contactPhone: string;
  contactPerson: string;
  isDemo?: boolean;
}

export interface AddShelterInput {
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  status?: ShelterStatus;
  facilities?: string[];
  contactPhone: string;
  contactPerson: string;
}

export interface ResponseTeam {
  id: string;
  name: string;
  agency: 'NDRF' | 'SDRF' | 'Fire & Rescue' | 'Medical Corps' | 'Civil Defence' | 'Police Quick Response';
  type: 'flood_rescue' | 'medical' | 'boat_rescue' | 'logistics' | 'structural_search';
  leader: string;
  contactPhone: string;
  membersCount: number;
  status: 'available' | 'deployed' | 'on_site' | 'resting';
  currentIncidentId?: string;
  currentIncidentTitle?: string;
  baseLocation: string;
  lat: number;
  lng: number;
  specialties: string[];
  isDemo?: boolean;
}

export interface ReliefResource {
  id: string;
  partnerName: string;
  partnerId: string;
  category: AssistanceCategory;
  itemName: string;
  quantity: number;
  unit: string;
  location: string;
  district: string;
  lat: number;
  lng: number;
  status: 'available' | 'allocated' | 'dispatched';
  registeredAt: string;
  contactPhone: string;
  isDemo?: boolean;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  skills: string[];
  preferredWork: string;
  availableHours: string;
  assignedTaskId?: string;
  status: 'registered' | 'assigned' | 'active';
  registeredAt: string;
  isDemo?: boolean;
}

export interface Vehicle {
  id: string;
  partnerName: string;
  vehicleType: 'Advanced Ambulance' | 'Inflatable Rescue Boat' | '4x4 High-Clearance Truck' | 'Cargo Van' | 'Water Tanker (10,000L)' | 'Tractor Trailer';
  registrationNumber: string;
  capacity: string;
  driverName: string;
  driverPhone: string;
  location: string;
  status: 'available' | 'dispatched' | 'maintenance';
  lat: number;
  lng: number;
  isDemo?: boolean;
}

export interface OfficialAlert {
  id: string;
  title: string;
  severity: 'warning' | 'alert' | 'emergency' | 'advisory';
  agency: string;
  issuedAt: string;
  validUntil: string;
  area: string;
  district: string;
  description: string;
  instructions: string[];
  isLive: boolean;
}

export interface WeatherData {
  city: string;
  district: string;
  temp: number;
  apparentTemp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  lastUpdated: string;
  isLive: boolean;
  statusMessage: string;
  forecast: { time: string; temp: number; precipitation: number; condition: string }[];
}

export interface PropertyDamageReport {
  id: string;
  citizenName: string;
  citizenId: string;
  phone: string;
  propertyType: 'Residential Home' | 'Commercial Building' | 'Agricultural Crop / Farm' | 'Infrastructure / Road';
  damageSeverity: 'Minor' | 'Moderate' | 'Severe' | 'Total Destruction';
  location: string;
  district: string;
  lat: number;
  lng: number;
  estimatedLossInr: string;
  isStructuralHazard: boolean;
  description: string;
  submittedAt: string;
  status: 'pending_survey' | 'surveyed' | 'approved_compensation' | 'rejected';
  isDemo?: boolean;
}

export interface ChecklistItem {
  id: string;
  category: 'water_food' | 'medical' | 'power_light' | 'documents' | 'evacuation';
  title: string;
  description: string;
  completed: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'authority' | 'partner' | 'public';
  phone?: string;
  district?: string;
  agency?: string;
  isApproved?: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  district?: string;
  isDetected: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
}
