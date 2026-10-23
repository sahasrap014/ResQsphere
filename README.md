# DisasterShield — Safer Communities Dashboard
### India Disaster Preparedness, Emergency Response & Relief Coordination Platform

A competition-ready, responsive, accessible web platform connecting citizens, emergency responders, and relief partners across India during disaster preparedness, crisis management, and relief operations.

---

## 🚀 Quick Start Guide

### Option 1: Instant Offline Demo (No Node.js Required)
Simply open the included standalone HTML application directly in any browser:
- Double-click **`DisasterShield-App.html`** (or open `drill demo/dist/index.html`).
- The full application, interactive Leaflet maps, demo scenario, forms, and workflows will run completely offline.

---

### Option 2: Run Development Server (with Node.js)

1. Open a terminal in this project folder:
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
DisasterShield/
├── DisasterShield-App.html       # Standalone 1-click inlined application
├── package.json                  # Root runner scripts (npm run dev / npm run build)
├── README.md                     # Documentation & setup guide
└── drill demo/
    ├── dist/
    │   └── index.html            # Production singlefile bundle
    ├── supabase/
    │   └── schema.sql            # PostgreSQL schema + Row Level Security (RLS)
    ├── src/
    │   ├── components/
    │   │   ├── common/           # 112 Emergency Modal, Ask AI Floating Assistant
    │   │   ├── layout/           # Navbar with Mode Switcher & Role Badges
    │   │   └── map/              # Leaflet Geospatial Map with Incident & Shelter Pins
    │   ├── data/
    │   │   └── demoScenario.ts   # Godavari Delta Flood Scenario (14 incidents, 6 shelters, 6 teams)
    │   ├── pages/
    │   │   ├── HomePortal.tsx    # 1. Public Home (Snapshot, Live Weather, Advisories, Risk Map)
    │   │   ├── CitizenPortal.tsx # 2. Citizen Portal (6 Action Cards, Preparedness Checklist, My Requests)
    │   │   ├── AuthorityPortal.tsx # 3. Authority Command (4 Overview Cards, Map, 12 Sections)
    │   │   ├── ReliefPartnerPortal.tsx # 4. Relief Partner Portal (Inventory, Volunteers, Need Matching)
    │   │   └── AuthModal.tsx     # Role-based authentication modal
    │   ├── services/
    │   │   ├── weatherService.ts # Real Open-Meteo weather API with WMO decoding
    │   │   └── supabaseClient.ts # Supabase client initialization
    │   ├── state/
    │   │   └── DisasterContext.tsx # Unified state store & mode switcher
    │   ├── types/
    │   │   └── disaster.ts       # Domain TypeScript interfaces
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css             # Tailwind v4 theme & Leaflet styling
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 🛡️ Key Features

- **Four Distinct Portals:**
  1. **Public Home:** Live weather, official advisories, risk context map, food & water readiness.
  2. **Citizen Portal:** Exactly 6 primary action cards, 4-category Preparedness Checklist, and "My Requests" live tracking.
  3. **Authority / Responder Portal:** Exactly 4 overview statistic cards + tactical map, incident verification queue, duplicate detection, response team dispatch, and shelter occupancy management.
  4. **Relief Partner Portal:** Supplies inventory, volunteer and fleet registration, pending assistance needs matching ("Commit & Fulfill Relief"), and impact metrics.
- **Interactive Godavari Delta Scenario:** Pre-populated in Demo Mode across all 12 operational sections. One-click "Reset Scenario" restores pristine data.
- **Emergency 112 & Ask AI:** Integrated India emergency dialing and floating bottom-right DisasterShield AI assistant.
- **Supabase Ready:** Includes full schema (`drill demo/supabase/schema.sql`) with 8 tables and Row-Level Security policies.
