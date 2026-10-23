# ResQsphere — Safer Communities Dashboard
### India Disaster Preparedness, Emergency Response & Relief Coordination Platform

A competition-ready, responsive, accessible web platform connecting citizens, emergency responders, and relief partners across India during disaster preparedness, crisis management, and relief operations.

---

## 🚀 Quick Start Guide

### Option 1: Instant Offline Demo (No Node.js Required)
Simply open the included standalone HTML application directly in any modern browser:
- Double-click **`ResQsphere-App.html`** (or open `drill demo/dist/index.html`).
- The full application, interactive Leaflet maps, demo scenario, forms, and workflows will run completely offline.

---

### Option 2: Run Development Server (with Node.js)

1. Open a terminal in the application folder:
   ```bash
   cd "drill demo"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## 📦 Project Structure

```
ResQsphere/
├── ResQsphere-App.html           # Standalone 1-click inlined application
├── package.json                  # Root runner scripts (npm run dev / npm run build)
├── README.md                     # Documentation & setup guide
└── drill demo/
    ├── dist/
    │   └── index.html            # Production singlefile bundle
    ├── supabase/
    │   └── schema.sql            # PostgreSQL schema + Row Level Security (RLS) + RPCs
    ├── src/
    │   ├── components/
    │   │   ├── common/           # 112 Emergency Modal
    │   │   ├── layout/           # Navbar with Mode Switcher & Role Badges
    │   │   └── map/              # Leaflet Geospatial Map with Incident & Shelter Pins
    │   ├── data/
    │   │   └── demoScenario.ts   # Godavari Delta Flood Scenario
    │   ├── pages/
    │   │   ├── HomePortal.tsx    # 1. Public Home (Geolocation, Live Weather, Advisories, Risk Map)
    │   │   ├── CitizenPortal.tsx # 2. Citizen Portal (4 Primary Action Cards, Checklist, My Requests)
    │   │   ├── AuthorityPortal.tsx # 3. Authority Command (Overview, Verification, Shelters, Teams, Needs, Risk)
    │   │   ├── ReliefPartnerPortal.tsx # 4. Relief Partner Portal (Inventory, Volunteers, Need Matching)
    │   │   └── AuthModal.tsx     # Role-separated authentication modal (Citizen, Authority, Partner)
    │   ├── services/
    │   │   ├── weatherService.ts # Real Open-Meteo weather API with WMO decoding
    │   │   └── supabaseClient.ts # Supabase client initialization (resqsphere)
    │   ├── state/
    │   └── DisasterContext.tsx   # Unified state store & mode switcher
    │   ├── types/
    │   │   └── disaster.ts       # Domain TypeScript interfaces
    │   ├── utils/
    │   │   └── phoneValidation.ts # Indian mobile number validation (+91 / 10-digits)
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css             # Tailwind v4 theme & Leaflet styling
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 🛡️ Key Features & Architecture

- **Branding:** Consistent **ResQsphere** branding across metadata, navigation, headings, and legal footers.
- **Device Geolocation in Live Mode:** Prompts for current device location with clear purpose explanation. Real-time Open-Meteo weather integration for detected coordinates, with manual fallback district selection and denial persistence.
- **Separate Live Mode Role Sign-in:** Distinct sign-in tabs and entry points for Citizen, Authority / Responder, and Relief Partner. Roles stored securely in `profiles` table with admin approval enforcement (`is_approved`) for privileged accounts.
- **Citizen Portal (4 Focused Actions):**
  1. Report Emergency Incident (with GPS & photo attachment)
  2. Find Safe Shelters (live occupancy & capacity tracking)
  3. Request Emergency Assistance (food, water, medicine, rescue)
  4. Report Property & Infrastructure Damage
  *(Evacuation guidance and family safety options removed for stream-lined flow; Preparedness Checklist & My Requests preserved).*
- **Authority / Responder Command Portal:**
  1. **Overview Dashboard:** Exactly 4 primary statistic cards + embedded tactical incident map.
  2. **Shelter Management & Add Shelter:** Strict capacity validation (`capacity > 0`, `0 <= currentOccupancy <= capacity`, rejects occupancy > capacity).
  3. **Response Teams Dispatch:** Prevents repeat deployment of teams already `deployed` or `on_site` (disabled in UI and validated in state).
  4. **Duplicate Review:** Link to Primary Incident (with target selection and loop prevention) or Keep Distinct.
  5. **Unmet Needs & Match Resources:** Dedicated allocation modal showing requested quantity, fulfilled quantity, remaining quantity, and compatible relief stock with atomic deduction.
  6. **Risk Monitoring & Situation Awareness:** Merged situational overview with river gauge levels, radar rain status, and cyclone tracking.
- **Relief Partner Portal:** Clean coordination hub for inventory management, volunteer roster, relief fleet dispatch, and assistance request fulfillment.
- **Clean UI:** Completely removed AI chatbot launcher, modal, and dead assets for an unobstructed emergency command experience.
- **Indian Mobile Validation:** Strict normalization and regex checks (`+91` / `0` prefix, valid 10-digit mobile starting with 6, 7, 8, 9) with explicit error guidance across all public forms.
- **Supabase Integration:** Full PostgreSQL schema with tables, RLS policies, atomic `allocate_relief_resource` stored procedure, and connection status reporting.
