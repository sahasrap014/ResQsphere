/**
 * ResQsphere Geocoding & Geographic Verification Service
 * 
 * Provides verified coordinates for Indian locations:
 * 1. Curated verified database for instant, zero-latency resolution of major cities,
 *    districts, and vulnerable coastal and river-basin sectors.
 * 2. Public OpenStreetMap Nominatim client (no client-side API secrets needed)
 *    restricted to India (countrycodes=in).
 * 3. Ambiguity detection and coordinate validation against Indian territorial boundaries.
 */

export interface GeocodingResult {
  displayName: string;
  lat: number;
  lng: number;
  district: string;
  state: string;
  source: 'verified_db' | 'nominatim' | 'manual';
  isExact?: boolean;
}

export interface GeocodingResponse {
  results: GeocodingResult[];
  isAmbiguous: boolean;
  error?: string;
}

/**
 * Curated database of verified Indian administrative centres, districts,
 * and high-vulnerability disaster monitoring locations.
 */
export const VERIFIED_INDIAN_LOCATIONS: Record<string, {
  displayName: string;
  lat: number;
  lng: number;
  district: string;
  state: string;
}> = {
  hyderabad: {
    displayName: 'Hyderabad, Telangana',
    lat: 17.3850,
    lng: 78.4867,
    district: 'Hyderabad',
    state: 'Telangana',
  },
  chennai: {
    displayName: 'Chennai, Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    district: 'Chennai',
    state: 'Tamil Nadu',
  },
  visakhapatnam: {
    displayName: 'Visakhapatnam, Andhra Pradesh',
    lat: 17.6868,
    lng: 83.2185,
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
  },
  vizag: {
    displayName: 'Visakhapatnam (Vizag), Andhra Pradesh',
    lat: 17.6868,
    lng: 83.2185,
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
  },
  vijayawada: {
    displayName: 'Vijayawada, Krishna / NTR District, Andhra Pradesh',
    lat: 16.5062,
    lng: 80.6480,
    district: 'NTR / Krishna',
    state: 'Andhra Pradesh',
  },
  guntur: {
    displayName: 'Guntur, Andhra Pradesh',
    lat: 16.3067,
    lng: 80.4365,
    district: 'Guntur',
    state: 'Andhra Pradesh',
  },
  rajahmundry: {
    displayName: 'Rajahmundry, East Godavari, Andhra Pradesh',
    lat: 17.0005,
    lng: 81.8040,
    district: 'East Godavari',
    state: 'Andhra Pradesh',
  },
  kovvur: {
    displayName: 'Kovvur, West Godavari / East Godavari Zone, Andhra Pradesh',
    lat: 17.0125,
    lng: 81.7289,
    district: 'East Godavari Sector',
    state: 'Andhra Pradesh',
  },
  kakinada: {
    displayName: 'Kakinada, Andhra Pradesh',
    lat: 16.9891,
    lng: 82.2475,
    district: 'Kakinada',
    state: 'Andhra Pradesh',
  },
  tirupati: {
    displayName: 'Tirupati, Andhra Pradesh',
    lat: 13.6288,
    lng: 79.4192,
    district: 'Tirupati',
    state: 'Andhra Pradesh',
  },
  nellore: {
    displayName: 'Nellore, SPSR Nellore, Andhra Pradesh',
    lat: 14.4426,
    lng: 79.9865,
    district: 'SPSR Nellore',
    state: 'Andhra Pradesh',
  },
  mumbai: {
    displayName: 'Mumbai, Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    district: 'Mumbai',
    state: 'Maharashtra',
  },
  bengaluru: {
    displayName: 'Bengaluru, Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    district: 'Bengaluru Urban',
    state: 'Karnataka',
  },
  bangalore: {
    displayName: 'Bengaluru (Bangalore), Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    district: 'Bengaluru Urban',
    state: 'Karnataka',
  },
  delhi: {
    displayName: 'New Delhi, Delhi NCR',
    lat: 28.6139,
    lng: 77.2090,
    district: 'New Delhi',
    state: 'Delhi',
  },
  'new delhi': {
    displayName: 'New Delhi, Delhi NCR',
    lat: 28.6139,
    lng: 77.2090,
    district: 'New Delhi',
    state: 'Delhi',
  },
  kolkata: {
    displayName: 'Kolkata, West Bengal',
    lat: 22.5726,
    lng: 88.3639,
    district: 'Kolkata',
    state: 'West Bengal',
  },
  bhubaneswar: {
    displayName: 'Bhubaneswar, Odisha',
    lat: 20.2961,
    lng: 85.8245,
    district: 'Khordha',
    state: 'Odisha',
  },
  cuttack: {
    displayName: 'Cuttack, Odisha',
    lat: 20.4625,
    lng: 85.8828,
    district: 'Cuttack',
    state: 'Odisha',
  },
  puri: {
    displayName: 'Puri, Odisha',
    lat: 19.8135,
    lng: 85.8312,
    district: 'Puri',
    state: 'Odisha',
  },
  kochi: {
    displayName: 'Kochi, Ernakulam, Kerala',
    lat: 9.9312,
    lng: 76.2673,
    district: 'Ernakulam',
    state: 'Kerala',
  },
  thiruvananthapuram: {
    displayName: 'Thiruvananthapuram, Kerala',
    lat: 8.5241,
    lng: 76.9366,
    district: 'Thiruvananthapuram',
    state: 'Kerala',
  },
  ahmedabad: {
    displayName: 'Ahmedabad, Gujarat',
    lat: 23.0225,
    lng: 72.5714,
    district: 'Ahmedabad',
    state: 'Gujarat',
  },
  surat: {
    displayName: 'Surat, Gujarat',
    lat: 21.1702,
    lng: 72.8311,
    district: 'Surat',
    state: 'Gujarat',
  },
  patna: {
    displayName: 'Patna, Bihar',
    lat: 25.5941,
    lng: 85.1376,
    district: 'Patna',
    state: 'Bihar',
  },
  guwahati: {
    displayName: 'Guwahati, Kamrup Metropolitan, Assam',
    lat: 26.1445,
    lng: 91.7362,
    district: 'Kamrup Metropolitan',
    state: 'Assam',
  },
  lucknow: {
    displayName: 'Lucknow, Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
    district: 'Lucknow',
    state: 'Uttar Pradesh',
  },
  jaipur: {
    displayName: 'Jaipur, Rajasthan',
    lat: 26.9124,
    lng: 75.7873,
    district: 'Jaipur',
    state: 'Rajasthan',
  },
  pune: {
    displayName: 'Pune, Maharashtra',
    lat: 18.5204,
    lng: 73.8567,
    district: 'Pune',
    state: 'Maharashtra',
  },
  bhopal: {
    displayName: 'Bhopal, Madhya Pradesh',
    lat: 23.2599,
    lng: 77.4126,
    district: 'Bhopal',
    state: 'Madhya Pradesh',
  },
};

/**
 * Validates whether coordinates lie within Indian territorial bounds.
 * (Approximate bounding box: Lat 6.0° to 38.0° N, Lng 68.0° to 98.0° E)
 */
export function validateCoordinates(lat: number, lng: number): { isValid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return { isValid: false, error: 'Latitude and longitude must be valid numbers.' };
  }
  if (lat < 6.0 || lat > 38.0) {
    return { isValid: false, error: `Latitude ${lat.toFixed(4)}° is outside Indian territorial bounds (6.0°N to 38.0°N).` };
  }
  if (lng < 68.0 || lng > 98.0) {
    return { isValid: false, error: `Longitude ${lng.toFixed(4)}° is outside Indian territorial bounds (68.0°E to 98.0°E).` };
  }
  return { isValid: true };
}

/**
 * Resolves a place name to verified coordinates with ambiguity detection.
 * Prioritizes the curated database, with OpenStreetMap Nominatim for arbitrary landmarks.
 */
export async function geocodeLocation(query: string): Promise<GeocodingResponse> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return {
      results: [],
      isAmbiguous: false,
      error: 'Please enter at least 2 characters for location search.',
    };
  }

  const normalized = trimmed.toLowerCase();
  const matchedFromDb: GeocodingResult[] = [];

  // 1. Direct or partial match in curated database
  for (const [key, loc] of Object.entries(VERIFIED_INDIAN_LOCATIONS)) {
    if (normalized === key) {
      // Exact match
      matchedFromDb.unshift({
        displayName: loc.displayName,
        lat: loc.lat,
        lng: loc.lng,
        district: loc.district,
        state: loc.state,
        source: 'verified_db',
        isExact: true,
      });
    } else if (normalized.includes(key) || key.includes(normalized)) {
      matchedFromDb.push({
        displayName: loc.displayName,
        lat: loc.lat,
        lng: loc.lng,
        district: loc.district,
        state: loc.state,
        source: 'verified_db',
        isExact: false,
      });
    }
  }

  // If exact match found in verified DB, return immediately
  if (matchedFromDb.length > 0 && matchedFromDb[0].isExact) {
    return {
      results: matchedFromDb,
      isAmbiguous: matchedFromDb.length > 1,
    };
  }

  // 2. Query OpenStreetMap Nominatim (countrycodes=in) with a 4-second timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&countrycodes=in&limit=5&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const nominatimResults: GeocodingResult[] = data
          .map((item: any) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const val = validateCoordinates(lat, lng);
            if (!val.isValid) return null;

            const district =
              item.address?.state_district ||
              item.address?.county ||
              item.address?.city ||
              item.address?.town ||
              'General Sector';
            const state = item.address?.state || 'India';

            return {
              displayName: item.display_name,
              lat: Number(lat.toFixed(4)),
              lng: Number(lng.toFixed(4)),
              district,
              state,
              source: 'nominatim' as const,
              isExact: false,
            };
          })
          .filter(Boolean) as GeocodingResult[];

        // Combine DB matches and Nominatim results, removing duplicates
        const combined = [...matchedFromDb, ...nominatimResults];
        const unique = combined.filter(
          (v, i, a) =>
            a.findIndex(
              (t) => Math.abs(t.lat - v.lat) < 0.005 && Math.abs(t.lng - v.lng) < 0.005
            ) === i
        );

        if (unique.length > 0) {
          return {
            results: unique,
            isAmbiguous: unique.length > 1,
          };
        }
      }
    }
  } catch (err: any) {
    // Network or timeout failure gracefully handled
    console.warn('Nominatim geocoding request skipped/timed out:', err?.message);
  }

  // If Nominatim failed or returned no results, check if we had partial DB matches
  if (matchedFromDb.length > 0) {
    return {
      results: matchedFromDb,
      isAmbiguous: matchedFromDb.length > 1,
    };
  }

  return {
    results: [],
    isAmbiguous: false,
    error: `Could not resolve geographical coordinates for "${trimmed}". Please refine the location name or enter coordinates manually.`,
  };
}
